import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import { Genre } from '../../core/models/movie.model';
import { TmdbListMovie, TmdbService } from '../../core/services/tmdb.service';
import { TMDB_POSTER_BASE } from '../../core/utils/tmdb-map';
import { Datum } from '../../core/utils/analytics';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { BarChartComponent } from '../../shared/components/bar-chart/bar-chart.component';
import { DonutChartComponent } from '../../shared/components/donut-chart/donut-chart.component';
import { PosterComponent } from '../../shared/components/poster/poster.component';
import { RatingBadgeComponent } from '../../shared/components/rating-badge/rating-badge.component';

/**
 * Live numbers straight from TMDB (not the site's own catalogue): five requests go out in parallel on every load,
 * so they show up in the browser's Network tab as calls to api.themoviedb.org. Uses the key saved in Display settings.
 */
@Component({
  selector: 'app-tmdb-live',
  standalone: true,
  imports: [DecimalPipe, StatCardComponent, BarChartComponent, DonutChartComponent, PosterComponent, RatingBadgeComponent],
  templateUrl: './tmdb-live.component.html',
  styleUrl: './tmdb-live.component.scss'
})
export class TmdbLiveComponent implements OnInit {
  tmdb = inject(TmdbService);

  loading = signal(false);
  error = signal('');
  loadedAt = signal<Date | null>(null);
  keyDraft = signal('');

  popular = signal<TmdbListMovie[]>([]);
  topRated = signal<TmdbListMovie[]>([]);
  trending = signal<TmdbListMovie[]>([]);
  genres = signal<Genre[]>([]);

  averageRating = computed(() => {
    const m = this.popular();
    return m.length ? Math.round((m.reduce((s, x) => s + x.vote_average, 0) / m.length) * 10) / 10 : 0;
  });
  totalVotes = computed(() => this.popular().reduce((s, x) => s + x.vote_count, 0));

  genreCounts = computed<Datum[]>(() => {
    const names = new Map(this.genres().map((g) => [g.id, g.name]));
    const counts = new Map<string, number>();
    for (const m of this.popular())
      for (const id of m.genre_ids) {
        const name = names.get(id);
        if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
      }
    return [...counts].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  });
  topGenre = computed(() => this.genreCounts()[0]?.label ?? '—');

  releasesByYear = computed<Datum[]>(() => {
    const byYear = new Map<string, number>();
    for (const m of this.popular()) {
      const year = m.release_date?.slice(0, 4);
      if (year) byYear.set(year, (byYear.get(year) ?? 0) + 1);
    }
    return [...byYear].sort(([a], [b]) => b.localeCompare(a)).slice(0, 8).map(([label, value]) => ({ label, value }));
  });

  ngOnInit(): void {
    if (this.tmdb.hasKey()) this.load();
  }

  poster(path: string | null): string {
    return path ? `${TMDB_POSTER_BASE}${path}` : '';
  }

  onKeyInput(event: Event): void {
    this.keyDraft.set((event.target as HTMLInputElement).value);
  }

  saveKey(): void {
    if (!this.keyDraft().trim()) return;
    this.tmdb.setKey(this.keyDraft());
    this.keyDraft.set('');
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    forkJoin({
      page1: this.tmdb.movieList('/movie/popular', 1),
      page2: this.tmdb.movieList('/movie/popular', 2),
      top: this.tmdb.movieList('/movie/top_rated'),
      trending: this.tmdb.movieList('/trending/movie/week'),
      genres: this.tmdb.genreList()
    }).subscribe({
      next: ({ page1, page2, top, trending, genres }) => {
        // TMDB can repeat a movie across pages while its ranking shifts, so keep each id once.
        const seen = new Set<number>();
        this.popular.set([...page1, ...page2].filter((m) => !seen.has(m.id) && seen.add(m.id)));
        this.topRated.set(top.slice(0, 8));
        this.trending.set(trending.slice(0, 10));
        this.genres.set(genres);
        this.loadedAt.set(new Date());
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.loading.set(false);
      }
    });
  }
}
