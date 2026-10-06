import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Movie, MoviePatch, MovieRow, SectionKey } from '../models/movie.model';
import { DEFAULT_SITE_SETTINGS, SiteSettings } from '../models/site-settings.model';

const SECTIONS: SectionKey[] = ['hero', 'popular', 'upcoming', 'latest'];
type SectionList = { results: Movie[] };

/**
 * Talks to the json-server the movie app uses. `movieDetails` is the full record per movie; the four home lists
 * (`hero`, `popular`, `upcoming`, `latest`) hold copies, so edits are written to both to keep the movie app in sync.
 */
@Injectable({ providedIn: 'root' })
export class MovieApiService {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl;

  getCatalogue(): Observable<MovieRow[]> {
    return forkJoin({
      details: this.http.get<Movie[]>(`${this.base}/movieDetails`),
      lists: forkJoin(SECTIONS.map((key) => this.http.get<SectionList>(`${this.base}/${key}`)))
    }).pipe(
      map(({ details, lists }) => {
        const sections = new Map<number, SectionKey[]>();
        lists.forEach((list, i) => {
          for (const m of list.results) sections.set(m.id, [...(sections.get(m.id) ?? []), SECTIONS[i]]);
        });
        return details.map((m) => ({ ...m, sections: sections.get(m.id) ?? [] }));
      })
    );
  }

  updateMovie(id: number, patch: MoviePatch): Observable<Movie> {
    return this.http.patch<Movie>(`${this.base}/movieDetails/${id}`, patch).pipe(
      switchMap((saved) =>
        this.editLists(SECTIONS, (results) =>
          results.some((m) => m.id === id) ? results.map((m) => (m.id === id ? { ...m, ...patch } : m)) : null
        ).pipe(map(() => saved))
      )
    );
  }

  /** Stores the movie and adds a copy (without cast and runtime, like the existing ones) to each chosen home list. */
  addMovie(movie: Movie, sections: SectionKey[]): Observable<Movie> {
    const { cast, runtime, ...copy } = movie;
    return this.http.post<Movie>(`${this.base}/movieDetails`, movie).pipe(
      switchMap((saved) => this.editLists(sections, (results) => [...results, copy]).pipe(map(() => saved)))
    );
  }

  deleteMovie(id: number): Observable<unknown> {
    return this.http.delete(`${this.base}/movieDetails/${id}`).pipe(
      switchMap(() => this.editLists(SECTIONS, (results) => (results.some((m) => m.id === id) ? results.filter((m) => m.id !== id) : null)))
    );
  }

  getSettings(): Observable<SiteSettings> {
    return this.http
      .get<Partial<SiteSettings>>(`${this.base}/settings`)
      .pipe(map((saved) => ({ ...DEFAULT_SITE_SETTINGS, ...saved })));
  }

  saveSettings(settings: SiteSettings): Observable<SiteSettings> {
    return this.http.put<SiteSettings>(`${this.base}/settings`, settings);
  }

  /** Rewrites the given home lists; `change` returns the new movies, or null to leave a list alone. */
  private editLists(keys: SectionKey[], change: (results: Movie[]) => Movie[] | null): Observable<unknown> {
    if (!keys.length) return of(null);
    return forkJoin(keys.map((key) => this.http.get<SectionList>(`${this.base}/${key}`))).pipe(
      switchMap((lists) => {
        const writes = lists.flatMap((list, i) => {
          const results = change(list.results);
          return results ? [this.http.put(`${this.base}/${keys[i]}`, { ...list, results })] : [];
        });
        return writes.length ? forkJoin(writes) : of(null);
      })
    );
  }
}
