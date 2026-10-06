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

  it('hides and shows a single movie rating', () => {
    flushLoad();
    store.setRatingHidden(1, true);
    http.expectOne({ method: 'PUT', url: `${base}/settings` }).flush({});
    expect(store.isRatingHidden(1)).toBeTrue();
  });
});
