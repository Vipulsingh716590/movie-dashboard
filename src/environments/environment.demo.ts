/** Hosted demo: no server, the mock API runs in the browser and changes are lost on reload. */
export const environment = {
  production: true,
  demo: true,
  /** Mock login only: this is not real security, the credentials are visible in the page source. */
  mockUser: { username: 'admin', password: 'admin123', name: 'Admin' },
  /**
   * TMDB goes through this site's own Netlify proxy (see netlify.toml), because some Indian networks (Jio, for one)
   * block api.themoviedb.org and image.tmdb.org in the browser. Netlify's servers fetch TMDB instead.
   */
  tmdbApiBase: '/tmdb-api',
  tmdbImageBase: '/tmdb-img',
  apiBaseUrl: 'http://demo.local',
  siteUrl: ''
};
