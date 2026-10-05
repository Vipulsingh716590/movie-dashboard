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

/** Fields the dashboard lets an admin edit. */
export type MovieEdit = Pick<Movie, 'title' | 'overview' | 'release_date' | 'vote_average'>;

/** Which movie app section lists a movie (each is a list in the mock API). */
export type SectionKey = 'hero' | 'popular' | 'upcoming' | 'latest';

export const SECTION_LABELS: Record<SectionKey, string> = {
  hero: 'Hero banner',
  popular: 'Popular',
  upcoming: 'Upcoming',
  latest: 'Now playing'
};

export interface MovieRow extends Movie {
  sections: SectionKey[];
}
