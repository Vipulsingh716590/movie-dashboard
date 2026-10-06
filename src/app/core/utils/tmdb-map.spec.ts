import { mapGenres, mapTmdbMovie, pickTrailer } from './tmdb-map';

describe('tmdb-map', () => {
  it('prefers an official trailer over teasers and unofficial uploads', () => {
    const key = pickTrailer([
      { key: 'teaser00001', site: 'YouTube', type: 'Teaser', official: true },
      { key: 'fan0000001', site: 'YouTube', type: 'Trailer', official: false },
      { key: 'official001', site: 'YouTube', type: 'Trailer', official: true },
      { key: 'vimeo00001', site: 'Vimeo', type: 'Trailer', official: true }
    ]);
    expect(key).toBe('official001');
  });

  it('returns nothing when there is no YouTube video', () => {
    expect(pickTrailer([])).toBeUndefined();
    expect(pickTrailer([{ key: 'x', site: 'Vimeo', type: 'Trailer' }])).toBeUndefined();
  });

  it('reuses the ids of genres the catalogue already has and renames Science Fiction', () => {
    const existing = [{ id: 2, name: 'Sci-Fi' }, { id: 1, name: 'Action' }];
    expect(mapGenres(existing, [{ id: 878, name: 'Science Fiction' }, { id: 28, name: 'Action' }, { id: 99, name: 'Documentary' }])).toEqual([
      { id: 2, name: 'Sci-Fi' },
      { id: 1, name: 'Action' },
      { id: 99, name: 'Documentary' }
    ]);
  });

  it('maps a TMDB movie to the dashboard shape', () => {
    const movie = mapTmdbMovie(
      {
        title: 'Dangal',
        original_title: 'दंगल',
        overview: 'Wrestling.',
        poster_path: '/p.jpg',
        backdrop_path: null,
        release_date: '2016-12-21',
        vote_average: 7.96,
        runtime: 161,
        genres: [{ id: 18, name: 'Drama' }],
        credits: { cast: [{ id: 1, name: 'Aamir Khan', character: 'Mahavir', profile_path: '/a.jpg' }, { id: 2, name: 'No Photo' }] },
        videos: { results: [{ key: 'abcdefghijk', site: 'YouTube', type: 'Trailer', official: true }] }
      },
      []
    );
    expect(movie.poster_path).toBe('https://image.tmdb.org/t/p/w500/p.jpg');
    expect(movie.backdrop_path).toBe(movie.poster_path);
    expect(movie.vote_average).toBe(8);
    expect(movie.runtime).toBe(161);
    expect(movie.cast?.[0].profile_path).toBe('https://image.tmdb.org/t/p/w500/a.jpg');
    expect(movie.cast?.[1].profile_path).toBe('');
    expect(movie.trailer_key).toBe('abcdefghijk');
    expect(movie.alternative_titles).toEqual(['दंगल']);
  });
});
