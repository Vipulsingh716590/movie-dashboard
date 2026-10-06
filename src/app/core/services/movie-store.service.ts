import { Injectable, computed, inject, signal } from '@angular/core';
import { concatMap, forkJoin, from, map, toArray } from 'rxjs';
import { Genre, MoviePatch, MovieRow, NewMovie, SectionKey } from '../models/movie.model';
import { DEFAULT_SITE_SETTINGS, SiteSettings } from '../models/site-settings.model';
import { MovieApiService } from './movie-api.service';
import { ToastService } from './toast.service';
import { computeKpis, decadeCounts, genreCounts, ratingBuckets, sectionCounts, topRated } from '../utils/analytics';

/** Single source of truth for every dashboard page: the catalogue, the site settings and the stats derived from them. */
@Injectable({ providedIn: 'root' })
export class MovieStore {
  private api = inject(MovieApiService);
  private toast = inject(ToastService);

  private moviesState = signal<MovieRow[]>([]);
  private settingsState = signal<SiteSettings>(DEFAULT_SITE_SETTINGS);

  readonly movies = this.moviesState.asReadonly();
  readonly settings = this.settingsState.asReadonly();
  readonly loading = signal(false);
  readonly loaded = signal(false);
  readonly failed = signal(false);

  /** Every genre in the catalogue (id and name), for forms. */
  readonly genres = computed<Genre[]>(() => {
    const byName = new Map<string, Genre>();
    for (const m of this.movies()) for (const g of m.genres ?? []) if (!byName.has(g.name)) byName.set(g.name, g);
    return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
  });

  /** Movies that lack a poster, a trailer or both. */
  readonly incomplete = computed(() => this.movies().filter((m) => !m.poster_path || (!m.trailer_key && !m.trailer_url)));

  readonly kpis = computed(() => computeKpis(this.movies()));
  readonly ratingBuckets = computed(() => ratingBuckets(this.movies()));
  readonly genreCounts = computed(() => genreCounts(this.movies()));
  readonly decadeCounts = computed(() => decadeCounts(this.movies()));
  readonly sectionCounts = computed(() => sectionCounts(this.movies()));
  readonly topRated = computed(() => topRated(this.movies()));

  /** Loads once; pass force to refetch (the Refresh button). */
  load(force = false): void {
    if (this.loading() || (this.loaded() && !force)) return;
    this.loading.set(true);
    this.failed.set(false);
    forkJoin({ movies: this.api.getCatalogue(), settings: this.api.getSettings() }).subscribe({
      next: ({ movies, settings }) => {
        this.moviesState.set(movies);
        this.settingsState.set(settings);
        this.loaded.set(true);
        this.loading.set(false);
      },
      error: () => {
        this.failed.set(true);
        this.loading.set(false);
      }
    });
  }

  saveMovie(id: number, edit: MoviePatch, onDone?: () => void): void {
    this.api.updateMovie(id, edit).subscribe({
      next: () => {
        this.moviesState.update((list) => list.map((m) => (m.id === id ? { ...m, ...edit } : m)));
        this.toast.show('Movie saved');
        onDone?.();
      },
      // An edit is several writes (the movie, then each list that holds a copy). If one fails the server may be
      // half updated, so show what it really has; the interceptor already told the user it failed.
      error: () => this.load(true)
    });
  }

  /**
   * Saves several movies one after another. They must not run in parallel: each save rewrites the home lists it is in,
   * and two saves rewriting the same list at once would lose one of the changes.
   */
  saveMany(items: { id: number; patch: MoviePatch }[], onDone?: () => void): void {
    from(items)
      .pipe(
        concatMap(({ id, patch }) => this.api.updateMovie(id, patch).pipe(map(() => ({ id, patch })))),
        toArray()
      )
      .subscribe({
        next: (done) => {
          this.moviesState.update((list) =>
            list.map((m) => done.filter((d) => d.id === m.id).reduce((movie, d) => ({ ...movie, ...d.patch }), m))
          );
          this.toast.show(`${done.length} movie${done.length === 1 ? '' : 's'} updated`);
          onDone?.();
        },
        // Some may have been saved before the failure: show what the server really has.
        error: () => this.load(true)
      });
  }

  /** Adds a movie (the next free id) and puts it on the chosen home lists. */
  addMovie(movie: NewMovie, sections: SectionKey[], onDone?: () => void): void {
    const id = Math.max(0, ...this.movies().map((m) => m.id)) + 1;
    this.api.addMovie({ ...movie, id }, sections).subscribe({
      next: (saved) => {
        this.moviesState.update((list) => [...list, { ...saved, sections }]);
        this.toast.show(`"${saved.title}" added`);
        onDone?.();
      },
      error: () => this.load(true)
    });
  }

  /** Deletes a movie everywhere (details and home lists) and forgets its per-movie rating switch. */
  deleteMovie(id: number, onDone?: () => void): void {
    this.api.deleteMovie(id).subscribe({
      next: () => {
        this.moviesState.update((list) => list.filter((m) => m.id !== id));
        if (this.isRatingHidden(id)) {
          this.updateSettings({ hiddenRatingIds: this.settings().hiddenRatingIds.filter((x) => x !== id) }, 'Movie deleted');
        } else {
          this.toast.show('Movie deleted');
        }
        onDone?.();
      },
      error: () => this.load(true)
    });
  }

  /** Applies a settings change straight away and rolls it back if the API rejects it. */
  updateSettings(patch: Partial<SiteSettings>, message = 'Settings saved'): void {
    const previous = this.settingsState();
    const next = { ...previous, ...patch };
    this.settingsState.set(next);
    this.api.saveSettings(next).subscribe({
      next: () => this.toast.show(message),
      error: () => this.settingsState.set(previous)
    });
  }

  isRatingHidden(id: number): boolean {
    return this.settings().hiddenRatingIds.includes(id);
  }

  setRatingHidden(id: number, hidden: boolean): void {
    const ids = this.settings().hiddenRatingIds.filter((x) => x !== id);
    this.updateSettings({ hiddenRatingIds: hidden ? [...ids, id] : ids }, hidden ? 'Rating hidden' : 'Rating shown');
  }

  resetSettings(): void {
    this.updateSettings({ ...DEFAULT_SITE_SETTINGS }, 'Settings reset to defaults');
  }
}
