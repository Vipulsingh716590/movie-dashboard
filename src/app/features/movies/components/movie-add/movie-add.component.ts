import { Component, EventEmitter, HostListener, Output, computed, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Genre, NewMovie, SECTION_LABELS, SectionKey, TmdbHit } from '../../../../core/models/movie.model';
import { MovieStore } from '../../../../core/services/movie-store.service';
import { TmdbService } from '../../../../core/services/tmdb.service';
import { parseYoutubeKey } from '../../../../core/utils/youtube';
import { PosterComponent } from '../../../../shared/components/poster/poster.component';

const youtubeLink = (control: AbstractControl): ValidationErrors | null =>
  !control.value || parseYoutubeKey(control.value) ? null : { youtube: true };

/**
 * "Add movie": fill the form by hand, or search TMDB and let it prefill the form (poster, cast, genres, runtime, trailer)
 * so the details can be checked and changed before saving.
 */
@Component({
  selector: 'app-movie-add',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, PosterComponent],
  templateUrl: './movie-add.component.html',
  styleUrl: './movie-add.component.scss'
})
export class MovieAddComponent {
  private fb = inject(FormBuilder);
  private store = inject(MovieStore);
  private tmdb = inject(TmdbService);

  @Output() add = new EventEmitter<{ movie: NewMovie; sections: SectionKey[] }>();
  @Output() cancel = new EventEmitter<void>();

  readonly hasKey = this.tmdb.hasKey;
  readonly sectionOptions = Object.entries(SECTION_LABELS) as [SectionKey, string][];

  query = signal('');
  hits = signal<TmdbHit[]>([]);
  searched = signal(false);
  searching = signal(false);
  searchError = signal('');
  loadingId = signal<number | null>(null);

  /** What TMDB supplied (cast, backdrop, other titles) that the form has no field for. */
  private imported = signal<NewMovie | null>(null);
  chosenGenres = signal<Genre[]>([]);
  chosenSections = signal<SectionKey[]>(['popular']);

  genreOptions = computed(() => {
    const byName = new Map<string, Genre>();
    for (const g of [...this.store.genres(), ...(this.imported()?.genres ?? [])]) if (!byName.has(g.name)) byName.set(g.name, g);
    return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
  });

  form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(120)]],
    release_date: ['', [Validators.required, Validators.pattern(/^\d{4}-\d{2}-\d{2}$/)]],
    vote_average: [0, [Validators.required, Validators.min(0), Validators.max(10)]],
    runtime: [null as number | null, [Validators.min(1), Validators.max(600)]],
    overview: ['', Validators.maxLength(1000)],
    poster_path: ['', Validators.pattern(/^(https?:\/\/\S+)?$/)],
    trailer: ['', youtubeLink]
  });

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.cancel.emit();
  }

  isDuplicate(): boolean {
    const title = this.form.controls.title.value.trim().toLowerCase();
    return !!title && this.store.movies().some((m) => m.title.trim().toLowerCase() === title);
  }

  onQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  search(): void {
    const q = this.query().trim();
    if (!q) return;
    this.searching.set(true);
    this.searchError.set('');
    this.tmdb.search(q).subscribe({
      next: (hits) => {
        this.hits.set(hits);
        this.searched.set(true);
        this.searching.set(false);
      },
      error: (e: Error) => {
        this.searchError.set(e.message);
        this.searching.set(false);
      }
    });
  }

  /** Fetches the full TMDB record and fills the form with it. */
  useHit(hit: TmdbHit): void {
    this.loadingId.set(hit.tmdbId);
    this.searchError.set('');
    this.tmdb.details(hit.tmdbId, this.store.genres()).subscribe({
      next: (movie) => {
        this.imported.set(movie);
        this.chosenGenres.set(movie.genres ?? []);
        this.form.patchValue({
          title: movie.title,
          release_date: movie.release_date,
          vote_average: movie.vote_average,
          runtime: movie.runtime ?? null,
          overview: movie.overview,
          poster_path: movie.poster_path,
          trailer: movie.trailer_key ?? ''
        });
        this.chosenSections.set([movie.release_date > new Date().toISOString().slice(0, 10) ? 'upcoming' : 'popular']);
        this.loadingId.set(null);
      },
      error: (e: Error) => {
        this.searchError.set(e.message);
        this.loadingId.set(null);
      }
    });
  }

  hasGenre(genre: Genre): boolean {
    return this.chosenGenres().some((g) => g.name === genre.name);
  }

  toggleGenre(genre: Genre): void {
    this.chosenGenres.update((list) => (this.hasGenre(genre) ? list.filter((g) => g.name !== genre.name) : [...list, genre]));
  }

  hasSection(key: SectionKey): boolean {
    return this.chosenSections().includes(key);
  }

  toggleSection(key: SectionKey): void {
    this.chosenSections.update((list) => (list.includes(key) ? list.filter((k) => k !== key) : [...list, key]));
  }

  submit(): void {
    if (this.form.invalid || this.isDuplicate()) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const imported = this.imported();
    const poster = v.poster_path.trim();
    this.add.emit({
      sections: this.chosenSections(),
      movie: {
        title: v.title.trim(),
        overview: v.overview.trim(),
        release_date: v.release_date,
        vote_average: v.vote_average,
        poster_path: poster,
        backdrop_path: imported?.backdrop_path || poster,
        runtime: v.runtime ?? undefined,
        genres: this.chosenGenres(),
        cast: imported?.cast ?? [],
        trailer_key: parseYoutubeKey(v.trailer) ?? undefined,
        alternative_titles: imported?.alternative_titles
      }
    });
  }
}
