import { Component, EventEmitter, HostListener, OnInit, Output, computed, inject, signal } from '@angular/core';
import { concatMap, from, map } from 'rxjs';
import { MoviePatch, MovieRow, TmdbSuggestion } from '../../../core/models/movie.model';
import { MovieStore } from '../../../core/services/movie-store.service';
import { TmdbService } from '../../../core/services/tmdb.service';
import { youtubeThumbUrl, youtubeWatchUrl } from '../../../core/utils/youtube';
import { PosterComponent } from '../poster/poster.component';

interface Row {
  movie: MovieRow;
  /** null while looking up; 'none' when TMDB has nothing for the title. */
  suggestion: TmdbSuggestion | 'none' | null;
  usePoster: boolean;
  useTrailer: boolean;
}

/**
 * Looks up every movie that has no poster or no trailer on TMDB and lists what it found. Nothing is saved until the
 * admin ticks what to use and applies it. A match whose year differs is left unticked, because it may be another film.
 */
@Component({
  selector: 'app-tmdb-autofill',
  standalone: true,
  imports: [PosterComponent],
  templateUrl: './tmdb-autofill.component.html',
  styleUrl: './tmdb-autofill.component.scss'
})
export class TmdbAutofillComponent implements OnInit {
  private store = inject(MovieStore);
  private tmdb = inject(TmdbService);

  @Output() close = new EventEmitter<void>();

  rows = signal<Row[]>([]);
  error = signal('');
  done = signal(0);
  applying = signal(false);

  readonly thumb = youtubeThumbUrl;
  readonly watchUrl = youtubeWatchUrl;

  loading = computed(() => this.done() < this.rows().length && !this.error());
  changes = computed(() => this.rows().reduce((n, r) => n + (r.usePoster ? 1 : 0) + (r.useTrailer ? 1 : 0), 0));

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close.emit();
  }

  ngOnInit(): void {
    const targets = this.store.incomplete();
    this.rows.set(targets.map((movie) => ({ movie, suggestion: null, usePoster: false, useTrailer: false })));
    if (!targets.length) return;

    // One lookup at a time: gentle on TMDB's rate limit, and the rows fill in order. A failed lookup ends the run with
    // its reason (a wrong key fails every movie the same way).
    from(targets.map((movie, index) => ({ movie, index })))
      .pipe(
        concatMap(({ movie, index }) =>
          this.tmdb.suggest(movie.title, movie.release_date.slice(0, 4)).pipe(map((s) => [index, s] as const))
        )
      )
      .subscribe({
        next: ([i, suggestion]) => this.setSuggestion(i, suggestion),
        error: (e: Error) => this.error.set(e.message)
      });
  }

  private setSuggestion(index: number, suggestion: TmdbSuggestion | null): void {
    this.rows.update((rows) =>
      rows.map((row, i) => {
        if (i !== index) return row;
        if (!suggestion) return { ...row, suggestion: 'none' as const };
        const sameYear = !suggestion.year || suggestion.year === row.movie.release_date.slice(0, 4);
        return {
          ...row,
          suggestion,
          usePoster: sameYear && this.canPoster(row.movie, suggestion),
          useTrailer: sameYear && this.canTrailer(row.movie, suggestion)
        };
      })
    );
    this.done.update((n) => n + 1);
  }

  canPoster(movie: MovieRow, s: TmdbSuggestion): boolean {
    return !movie.poster_path && !!s.poster;
  }

  canTrailer(movie: MovieRow, s: TmdbSuggestion): boolean {
    return !movie.trailer_key && !movie.trailer_url && !!s.trailerKey;
  }

  yearDiffers(row: Row): boolean {
    const s = row.suggestion;
    return !!s && s !== 'none' && !!s.year && s.year !== row.movie.release_date.slice(0, 4);
  }

  suggestionOf(row: Row): TmdbSuggestion | null {
    return row.suggestion && row.suggestion !== 'none' ? row.suggestion : null;
  }

  toggle(index: number, field: 'usePoster' | 'useTrailer'): void {
    this.rows.update((rows) => rows.map((r, i) => (i === index ? { ...r, [field]: !r[field] } : r)));
  }

  apply(): void {
    const items = this.rows().flatMap((row) => {
      const s = this.suggestionOf(row);
      if (!s || (!row.usePoster && !row.useTrailer)) return [];
      const patch: MoviePatch = {};
      if (row.usePoster) {
        patch.poster_path = s.poster;
        // The site's hero banner shows the backdrop; for these movies it is empty too.
        if (!row.movie.backdrop_path) patch.backdrop_path = s.poster;
      }
      if (row.useTrailer) patch.trailer_key = s.trailerKey;
      return [{ id: row.movie.id, patch }];
    });
    if (!items.length) return;
    this.applying.set(true);
    this.store.saveMany(items, () => this.close.emit());
  }
}
