import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Movie, MovieEdit, MovieRow, SectionKey } from '../models/movie.model';
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

  updateMovie(id: number, edit: MovieEdit): Observable<Movie> {
    return this.http.patch<Movie>(`${this.base}/movieDetails/${id}`, edit).pipe(
      switchMap((saved) => this.syncLists(id, edit).pipe(map(() => saved)))
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

  /** Writes the edit into every home list that contains the movie. */
  private syncLists(id: number, edit: MovieEdit): Observable<unknown> {
    return forkJoin(SECTIONS.map((key) => this.http.get<SectionList>(`${this.base}/${key}`))).pipe(
      switchMap((lists) => {
        const writes = lists
          .map((list, i) => ({ key: SECTIONS[i], list }))
          .filter(({ list }) => list.results.some((m) => m.id === id))
          .map(({ key, list }) =>
            this.http.put(`${this.base}/${key}`, {
              ...list,
              results: list.results.map((m) => (m.id === id ? { ...m, ...edit } : m))
            })
          );
        return writes.length ? forkJoin(writes) : of(null);
      })
    );
  }
}
