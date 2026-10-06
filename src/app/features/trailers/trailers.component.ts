import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MovieRow } from '../../core/models/movie.model';
import { MovieStore } from '../../core/services/movie-store.service';
import { TmdbService } from '../../core/services/tmdb.service';
import { ToastService } from '../../core/services/toast.service';
import { parseYoutubeKey, youtubeThumbUrl, youtubeWatchUrl } from '../../core/utils/youtube';
import { LoadingStateComponent } from '../../shared/components/loading-state/loading-state.component';
import { PosterComponent } from '../../shared/components/poster/poster.component';
import { TrailerPreviewComponent } from '../../shared/components/trailer-preview/trailer-preview.component';

type Status = '' | 'missing' | 'set';

@Component({
  selector: 'app-trailers',
  standalone: true,
  imports: [LoadingStateComponent, PosterComponent, TrailerPreviewComponent],
  templateUrl: './trailers.component.html',
  styleUrl: './trailers.component.scss'
})
export class TrailersComponent implements OnInit {
  store = inject(MovieStore);
  private tmdb = inject(TmdbService);
  private toast = inject(ToastService);

  query = signal('');
  status = signal<Status>('');
  /** Text typed in a row but not saved yet, by movie id. */
  private drafts = signal<Record<number, string>>({});
  errors = signal<Record<number, string>>({});
  finding = signal<number | null>(null);
  preview = signal<MovieRow | null>(null);

  readonly hasTmdbKey = this.tmdb.hasKey;
  readonly thumb = youtubeThumbUrl;
  readonly watchUrl = youtubeWatchUrl;

  counts = computed(() => {
    const movies = this.store.movies();
    const missing = movies.filter((m) => !this.hasTrailer(m)).length;
    return { total: movies.length, missing, set: movies.length - missing };
  });

  filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const status = this.status();
    return this.store
      .movies()
      .filter((m) => !status || (status === 'missing') === !this.hasTrailer(m))
      .filter((m) => !q || [m.title, ...(m.alternative_titles ?? [])].some((t) => t.toLowerCase().includes(q)))
      .sort((a, b) => a.title.localeCompare(b.title));
  });

  ngOnInit(): void {
    this.store.load();
  }

  /** A movie's own trailer link counts too (the site can play a direct video file). */
  hasTrailer(m: MovieRow): boolean {
    return !!(m.trailer_key || m.trailer_url);
  }

  draftFor(m: MovieRow): string {
    return this.drafts()[m.id] ?? m.trailer_key ?? '';
  }

  dirty(m: MovieRow): boolean {
    return this.draftFor(m).trim() !== (m.trailer_key ?? '');
  }

  setQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  setStatus(event: Event): void {
    this.status.set((event.target as HTMLSelectElement).value as Status);
  }

  onDraft(m: MovieRow, event: Event): void {
    this.drafts.update((d) => ({ ...d, [m.id]: (event.target as HTMLInputElement).value }));
    this.setError(m, '');
  }

  save(m: MovieRow): void {
    const text = this.draftFor(m).trim();
    const key = text ? parseYoutubeKey(text) : '';
    if (key === null) {
      this.setError(m, 'Paste a YouTube link or the 11-character video id.');
      return;
    }
    this.store.saveMovie(m.id, { trailer_key: key }, () => this.clearDraft(m));
  }

  remove(m: MovieRow): void {
    this.store.saveMovie(m.id, { trailer_key: '' }, () => this.clearDraft(m));
  }

  /** Looks the movie up on TMDB and fills the box with its trailer; nothing is saved until the admin saves it. */
  findWithTmdb(m: MovieRow): void {
    this.finding.set(m.id);
    this.tmdb.findTrailer(m.title, m.release_date.slice(0, 4)).subscribe({
      next: (key) => {
        this.finding.set(null);
        if (key) {
          this.drafts.update((d) => ({ ...d, [m.id]: key }));
          this.setError(m, '');
        } else {
          this.toast.show(`TMDB has no trailer for "${m.title}".`, 'error');
        }
      },
      error: (e: Error) => {
        this.finding.set(null);
        this.toast.show(e.message, 'error');
      }
    });
  }

  private clearDraft(m: MovieRow): void {
    this.drafts.update(({ [m.id]: _gone, ...rest }) => rest);
  }

  private setError(m: MovieRow, message: string): void {
    this.errors.update((e) => ({ ...e, [m.id]: message }));
  }
}
