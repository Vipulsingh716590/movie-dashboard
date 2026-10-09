import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, switchMap, throwError } from 'rxjs';
import { Genre, NewMovie, TmdbHit, TmdbSuggestion } from '../models/movie.model';
import { TMDB_POSTER_BASE, TmdbDetail, TmdbVideo, mapTmdbMovie, pickTrailer } from '../utils/tmdb-map';
import { environment } from '../../../environments/environment';

const BASE = environment.tmdbApiBase;
const KEY_STORAGE = 'movieflix-dashboard.tmdbKey';
/** Many Indian films have their trailer uploaded in Hindi (or with no language set), which TMDB hides by default. */
const VIDEO_LANGUAGES = 'en,hi,null';

const readKey = (): string => {
  try {
    return localStorage.getItem(KEY_STORAGE) ?? '';
  } catch {
    return '';
  }
};

/** A movie as TMDB returns it in its list endpoints (popular, top rated, trending). */
export interface TmdbListMovie {
  id: number;
  title: string;
  poster_path: string | null;
  release_date?: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids: number[];
}

type SearchResponse = {
  results: { id: number; title: string; release_date?: string; poster_path?: string | null; overview?: string; vote_average?: number }[];
};

/**
 * Reads movie data from TMDB for "Add movie" and "Find trailer". The admin's own TMDB (v3) API key is kept in this
 * browser only (localStorage); it is never sent anywhere except to TMDB and never stored in the project.
 */
@Injectable({ providedIn: 'root' })
export class TmdbService {
  private http = inject(HttpClient);
  private keyState = signal(readKey());

  readonly hasKey = computed(() => this.keyState() !== '');

  setKey(value: string): void {
    const key = value.trim();
    this.keyState.set(key);
    try {
      if (key) localStorage.setItem(KEY_STORAGE, key);
      else localStorage.removeItem(KEY_STORAGE);
    } catch {
      /* private mode: the key lasts until the page is reloaded */
    }
  }

  search(query: string): Observable<TmdbHit[]> {
    return this.get<SearchResponse>('/search/movie', { query, include_adult: 'false' }).pipe(
      map((res) =>
        res.results.slice(0, 8).map((r) => ({
          tmdbId: r.id,
          title: r.title,
          year: r.release_date?.slice(0, 4) ?? '',
          poster: r.poster_path ? `${TMDB_POSTER_BASE}${r.poster_path}` : '',
          overview: r.overview ?? '',
          rating: Math.round((r.vote_average ?? 0) * 10) / 10
        }))
      )
    );
  }

  details(tmdbId: number, knownGenres: Genre[]): Observable<NewMovie> {
    return this.get<TmdbDetail>(`/movie/${tmdbId}`, { append_to_response: 'credits,videos', include_video_language: VIDEO_LANGUAGES }).pipe(
      map((d) => mapTmdbMovie(d, knownGenres))
    );
  }

  /** Looks a movie up by title (and year) and returns its best YouTube trailer id, or null. */
  findTrailer(title: string, year?: string): Observable<string | null> {
    return this.get<SearchResponse>('/search/movie', { query: title, ...(year ? { primary_release_year: year } : {}) }).pipe(
      switchMap((res) =>
        res.results.length
          ? this.get<{ results: TmdbVideo[] }>(`/movie/${res.results[0].id}/videos`, { include_video_language: VIDEO_LANGUAGES }).pipe(
              map((v) => pickTrailer(v.results) ?? null)
            )
          : of(null)
      )
    );
  }

  /**
   * The best TMDB match for a movie by title and year (falling back to the title alone), with its poster and trailer.
   * It is only a suggestion: the caller shows it to the admin, who decides.
   */
  suggest(title: string, year: string): Observable<TmdbSuggestion | null> {
    return this.get<SearchResponse>('/search/movie', { query: title, ...(year ? { primary_release_year: year } : {}) }).pipe(
      switchMap((res) => (res.results.length || !year ? of(res) : this.get<SearchResponse>('/search/movie', { query: title }))),
      switchMap((res) => {
        const hit = res.results[0];
        if (!hit) return of(null);
        return this.get<{ poster_path?: string | null; release_date?: string; videos?: { results?: TmdbVideo[] } }>(`/movie/${hit.id}`, {
          append_to_response: 'videos',
          include_video_language: VIDEO_LANGUAGES
        }).pipe(
          map((d) => ({
            tmdbId: hit.id,
            title: hit.title,
            year: (d.release_date ?? hit.release_date ?? '').slice(0, 4),
            poster: d.poster_path ? `${TMDB_POSTER_BASE}${d.poster_path}` : '',
            trailerKey: pickTrailer(d.videos?.results)
          }))
        );
      })
    );
  }

  /** One page of a TMDB movie list, used by the TMDB Live page: '/movie/popular', '/movie/top_rated', '/trending/movie/week'. */
  movieList(path: string, page = 1): Observable<TmdbListMovie[]> {
    return this.get<{ results: TmdbListMovie[] }>(path, { page: String(page) }).pipe(map((res) => res.results));
  }

  /** TMDB's genre ids with their names, to turn genre_ids into labels. */
  genreList(): Observable<Genre[]> {
    return this.get<{ genres: Genre[] }>('/genre/movie/list').pipe(map((res) => res.genres));
  }

  private get<T>(path: string, params: Record<string, string> = {}): Observable<T> {
    return this.http.get<T>(`${BASE}${path}`, { params: { api_key: this.keyState(), ...params } }).pipe(
      catchError((error: HttpErrorResponse) => throwError(() => new Error(tmdbMessage(error))))
    );
  }
}

function tmdbMessage(error: HttpErrorResponse): string {
  if (error.status === 401) return 'TMDB did not accept that API key. Check it in Display settings.';
  if (error.status === 0) return "Can't reach TMDB. Check your internet connection, or try another network (some mobile networks block TMDB).";
  if (error.status === 429) return 'TMDB is limiting requests. Wait a moment and try again.';
  return 'TMDB could not complete that request.';
}
