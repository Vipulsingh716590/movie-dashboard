import { CastMember, Genre, NewMovie } from '../models/movie.model';

export const TMDB_POSTER_BASE = 'https://image.tmdb.org/t/p/w500';
export const TMDB_BACKDROP_BASE = 'https://image.tmdb.org/t/p/original';

export interface TmdbVideo {
  key: string;
  site: string;
  type: string;
  official?: boolean;
}

export interface TmdbDetail {
  title: string;
  original_title?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  vote_average?: number;
  runtime?: number | null;
  genres?: Genre[];
  credits?: { cast?: { id: number; name: string; character?: string; profile_path?: string | null }[] };
  videos?: { results?: TmdbVideo[] };
}

/** TMDB names a few genres differently from the movie data ("Science Fiction" is "Sci-Fi" here). */
const GENRE_ALIASES: Record<string, string> = { 'Science Fiction': 'Sci-Fi' };

/** The best YouTube trailer: an official Trailer first, then other trailers, then teasers and clips. */
export function pickTrailer(videos: TmdbVideo[] = []): string | undefined {
  const rank = (v: TmdbVideo) => (v.type === 'Trailer' ? 0 : v.type === 'Teaser' ? 2 : 4) + (v.official ? 0 : 1);
  return videos
    .filter((v) => v.site === 'YouTube')
    .sort((a, b) => rank(a) - rank(b))[0]?.key;
}

/** Reuses the id of a genre the catalogue already has (matched by name); unknown genres keep TMDB's id. */
export function mapGenres(existing: Genre[], incoming: Genre[] = []): Genre[] {
  return incoming.map((g) => {
    const name = GENRE_ALIASES[g.name] ?? g.name;
    return { id: existing.find((e) => e.name === name)?.id ?? g.id, name };
  });
}

const CAST_COUNT = 12;

export function mapTmdbMovie(d: TmdbDetail, existingGenres: Genre[]): NewMovie {
  const poster = d.poster_path ? `${TMDB_POSTER_BASE}${d.poster_path}` : '';
  const cast: CastMember[] = (d.credits?.cast ?? []).slice(0, CAST_COUNT).map((c) => ({
    id: c.id,
    name: c.name,
    character: c.character ?? '',
    profile_path: c.profile_path ? `${TMDB_POSTER_BASE}${c.profile_path}` : ''
  }));

  return {
    title: d.title,
    overview: d.overview ?? '',
    poster_path: poster,
    backdrop_path: d.backdrop_path ? `${TMDB_BACKDROP_BASE}${d.backdrop_path}` : poster,
    release_date: d.release_date ?? '',
    vote_average: Math.round((d.vote_average ?? 0) * 10) / 10,
    runtime: d.runtime || undefined,
    genres: mapGenres(existingGenres, d.genres),
    cast,
    trailer_key: pickTrailer(d.videos?.results),
    alternative_titles: d.original_title && d.original_title !== d.title ? [d.original_title] : undefined
  };
}
