import { Injectable, computed, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { MovieEdit, MovieRow } from '../models/movie.model';
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

  saveMovie(id: number, edit: MovieEdit, onDone?: () => void): void {
    this.api.updateMovie(id, edit).subscribe({
      next: () => {
        this.moviesState.update((list) => list.map((m) => (m.id === id ? { ...m, ...edit } : m)));
        this.toast.show('Movie saved');
        onDone?.();
      }
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
