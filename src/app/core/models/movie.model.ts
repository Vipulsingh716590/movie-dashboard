export interface Genre {
  id: number;
  name: string;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string;
}

/** A movie as stored in the mock API (`movieDetails`); the home lists hold copies without runtime and cast. */
export interface Movie {
  id: number;
  title: string;
  poster_path: string;
  backdrop_path: string;
  release_date: string;
  vote_average: number;
  overview: string;
  alternative_titles?: string[];
  genres?: Genre[];
  runtime?: number;
  cast?: CastMember[];
  trailer_key?: string;
  trailer_url?: string;
}

/** A movie before it has an id (what "Add movie" and the TMDB import produce). */
export type NewMovie = Omit<Movie, 'id'>;

/** Any field of a stored movie except its id, for partial updates such as changing only the trailer. */
export type MoviePatch = Partial<Omit<Movie, 'id'>>;

/** Fields the dashboard lets an admin edit. */
export type MovieEdit = Pick<Movie, 'title' | 'overview' | 'release_date' | 'vote_average' | 'poster_path'>;

/** Which list of the movie app holds a movie (each is a list in the mock API). `search` is the list of films that only appear in search. */
export type SectionKey = 'hero' | 'popular' | 'upcoming' | 'latest' | 'search';

export const SECTION_LABELS: Record<SectionKey, string> = {
  hero: 'Hero banner',
  popular: 'Popular',
  upcoming: 'Upcoming',
  latest: 'Now playing',
  search: 'Search only'
};

export interface TmdbHit {
  tmdbId: number;
  title: string;
  year: string;
  poster: string;
  overview: string;
  rating: number;
}

/** What TMDB suggests for a movie that is missing a poster or a trailer. */
export interface TmdbSuggestion {
  tmdbId: number;
  title: string;
  year: string;
  poster: string;
  trailerKey?: string;
}

export interface MovieRow extends Movie {
  sections: SectionKey[];
}
