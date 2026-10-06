import { MovieRow } from '../models/movie.model';
import { computeKpis, decadeCounts, genreCounts, ratingBuckets, topRated } from './analytics';

const movie = (id: number, rating: number, year: number, genres: string[], runtime = 100): MovieRow => ({
  id,
  title: `Movie ${id}`,
  poster_path: '',
  backdrop_path: '',
  release_date: `${year}-01-01`,
  vote_average: rating,
  overview: '',
  runtime,
  genres: genres.map((name, i) => ({ id: i, name })),
  sections: ['popular']
});

describe('analytics', () => {
  const movies = [movie(1, 8.4, 2010, ['Action', 'Sci-Fi'], 148), movie(2, 6.2, 1975, ['Drama']), movie(3, 0, 2026, ['Action'], 90)];

  it('computes KPIs, ignoring unrated movies in the average rating', () => {
    expect(computeKpis(movies)).toEqual({ total: 3, rated: 2, averageRating: 7.3, averageRuntime: 113, genreCount: 3, missingPosters: 3, missingTrailers: 3 });
  });

  it('handles an empty catalogue', () => {
    expect(computeKpis([])).toEqual({ total: 0, rated: 0, averageRating: 0, averageRuntime: 0, genreCount: 0, missingPosters: 0, missingTrailers: 0 });
  });

  it('buckets rated movies by rating point', () => {
    const buckets = ratingBuckets([...movies, movie(4, 10, 2000, []), movie(5, 3, 2000, [])]);
    expect(buckets.map((b) => b.value)).toEqual([1, 0, 1, 0, 1, 1]);
  });

  it('counts genres, most common first', () => {
    expect(genreCounts(movies)[0]).toEqual({ label: 'Action', value: 2 });
  });

  it('groups by decade in order', () => {
    expect(decadeCounts(movies).map((d) => d.label)).toEqual(['1970s', '2010s', '2020s']);
  });

  it('lists top rated movies without unrated ones', () => {
    expect(topRated(movies, 5).map((m) => m.id)).toEqual([1, 2]);
  });
});
