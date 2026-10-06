import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MovieStore } from './movie-store.service';
import { environment } from '../../../environments/environment';
import { DEFAULT_SITE_SETTINGS } from '../models/site-settings.model';

describe('MovieStore', () => {
  let store: MovieStore;
  let http: HttpTestingController;
  const base = environment.apiBaseUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    store = TestBed.inject(MovieStore);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function flushLoad() {
    store.load();
    http.expectOne(`${base}/movieDetails`).flush([{ id: 1, title: 'A', vote_average: 8, release_date: '2010-01-01', overview: '', poster_path: '', backdrop_path: '' }]);
    for (const key of ['hero', 'popular', 'upcoming', 'latest']) {
      http.expectOne(`${base}/${key}`).flush({ results: key === 'popular' ? [{ id: 1 }] : [] });
    }
    http.expectOne(`${base}/settings`).flush({ showRatings: true });
  }

  it('loads movies with the sections they appear in, and fills in missing settings', () => {
    flushLoad();
    expect(store.movies()[0].sections).toEqual(['popular']);
    expect(store.settings()).toEqual(DEFAULT_SITE_SETTINGS);
    expect(store.loaded()).toBeTrue();
  });

  it('rolls a settings change back when saving fails', () => {
    flushLoad();
    store.updateSettings({ showRatings: false });
    expect(store.settings().showRatings).toBeFalse();
    http.expectOne({ method: 'PUT', url: `${base}/settings` }).error(new ProgressEvent('error'), { status: 500 });
    expect(store.settings().showRatings).toBeTrue();
  });

  it('reloads from the server when saving a movie fails, so the screen matches what was really saved', () => {
    flushLoad();
    store.saveMovie(1, { title: 'B', overview: '', release_date: '2010-01-01', vote_average: 7, poster_path: '' });
    http.expectOne({ method: 'PATCH', url: `${base}/movieDetails/1` }).error(new ProgressEvent('error'), { status: 500 });

    http.expectOne(`${base}/movieDetails`).flush([{ id: 1, title: 'B', vote_average: 7, release_date: '2010-01-01', overview: '', poster_path: '', backdrop_path: '' }]);
    for (const key of ['hero', 'popular', 'upcoming', 'latest']) http.expectOne(`${base}/${key}`).flush({ results: [] });
    http.expectOne(`${base}/settings`).flush({});
    expect(store.movies()[0].title).toBe('B');
  });

  it('adds a movie with the next free id and puts a copy, without cast and runtime, on the chosen list', () => {
    flushLoad();
    store.addMovie(
      {
        title: 'New', overview: '', release_date: '2026-01-01', vote_average: 7, poster_path: '', backdrop_path: '',
        runtime: 100, cast: [{ id: 1, name: 'A', character: 'B', profile_path: '' }]
      },
      ['popular']
    );
    const post = http.expectOne({ method: 'POST', url: `${base}/movieDetails` });
    expect(post.request.body.id).toBe(2);
    post.flush(post.request.body);

    http.expectOne(`${base}/popular`).flush({ results: [] });
    const put = http.expectOne({ method: 'PUT', url: `${base}/popular` });
    expect(put.request.body.results[0].title).toBe('New');
    expect(put.request.body.results[0].cast).toBeUndefined();
    expect(put.request.body.results[0].runtime).toBeUndefined();
    put.flush({});

    expect(store.movies().length).toBe(2);
    expect(store.movies()[1].sections).toEqual(['popular']);
  });

  it('deletes a movie from its details and every list, and forgets its rating switch', () => {
    flushLoad();
    store.setRatingHidden(1, true);
    http.expectOne({ method: 'PUT', url: `${base}/settings` }).flush({});

    store.deleteMovie(1);
    http.expectOne({ method: 'DELETE', url: `${base}/movieDetails/1` }).flush({});
    for (const key of ['hero', 'popular', 'upcoming', 'latest']) {
      http.expectOne(`${base}/${key}`).flush({ results: key === 'popular' ? [{ id: 1 }] : [] });
    }
    const put = http.expectOne({ method: 'PUT', url: `${base}/popular` });
    expect(put.request.body.results).toEqual([]);
    put.flush({});
    http.expectOne({ method: 'PUT', url: `${base}/settings` }).flush({});

    expect(store.movies().length).toBe(0);
    expect(store.settings().hiddenRatingIds).toEqual([]);
  });

  it('hides and shows a single movie rating', () => {
    flushLoad();
    store.setRatingHidden(1, true);
    http.expectOne({ method: 'PUT', url: `${base}/settings` }).flush({});
    expect(store.isRatingHidden(1)).toBeTrue();
  });
});
