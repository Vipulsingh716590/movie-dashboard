import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MovieStore } from '../../core/services/movie-store.service';
import { MovieEdit, MovieRow, SECTION_LABELS, SectionKey } from '../../core/models/movie.model';
import { RatingBadgeComponent } from '../../shared/components/rating-badge/rating-badge.component';
import { ToggleSwitchComponent } from '../../shared/components/toggle-switch/toggle-switch.component';
import { LoadingStateComponent } from '../../shared/components/loading-state/loading-state.component';
import { RuntimePipe } from '../../shared/pipes/runtime.pipe';
import { MovieEditorComponent } from './components/movie-editor/movie-editor.component';

type SortKey = 'title' | 'rating' | 'year' | 'runtime';

const SORTERS: Record<SortKey, (a: MovieRow, b: MovieRow) => number> = {
  title: (a, b) => a.title.localeCompare(b.title),
  rating: (a, b) => b.vote_average - a.vote_average,
  year: (a, b) => b.release_date.localeCompare(a.release_date),
  runtime: (a, b) => (b.runtime ?? 0) - (a.runtime ?? 0)
};

@Component({
  selector: 'app-movies',
  standalone: true,
  imports: [RatingBadgeComponent, ToggleSwitchComponent, LoadingStateComponent, RuntimePipe, MovieEditorComponent],
  templateUrl: './movies.component.html',
  styleUrl: './movies.component.scss'
})
export class MoviesComponent implements OnInit {
  store = inject(MovieStore);

  query = signal('');
  genre = signal('');
  section = signal<SectionKey | ''>('');
  sort = signal<SortKey>('title');
  editing = signal<MovieRow | null>(null);

  readonly sectionOptions = Object.entries(SECTION_LABELS) as [SectionKey, string][];
  readonly sectionLabels = SECTION_LABELS;
  genres = computed(() => this.store.genreCounts().map((g) => g.label).sort());

  /** Title, Hindi/alternative titles and cast names all match the search box, like the site's own search. */
  filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const genre = this.genre();
    const section = this.section();
    return this.store
      .movies()
      .filter((m) => !genre || (m.genres ?? []).some((g) => g.name === genre))
      .filter((m) => !section || m.sections.includes(section))
      .filter(
        (m) =>
          !q ||
          [m.title, ...(m.alternative_titles ?? [])].some((t) => t.toLowerCase().includes(q))
      )
      .sort(SORTERS[this.sort()]);
  });

  ngOnInit(): void {
    this.store.load();
  }

  onInput(signalToSet: { set(v: string): void }, event: Event): void {
    signalToSet.set((event.target as HTMLInputElement).value);
  }

  setSection(event: Event): void {
    this.section.set((event.target as HTMLSelectElement).value as SectionKey | '');
  }

  setSort(event: Event): void {
    this.sort.set((event.target as HTMLSelectElement).value as SortKey);
  }

  save(edit: MovieEdit): void {
    const movie = this.editing();
    if (movie) this.store.saveMovie(movie.id, edit, () => this.editing.set(null));
  }
}
