/** The dashboard talks to the json-server in ./mock-server (npm run mock:server). */
export const environment = {
  production: false,
  /** True only in the hosted demo build: the API is simulated in the browser (see demo-api.interceptor). */
  demo: false,
  /** Mock login only: this is not real security, the credentials are visible in the page source. */
  mockUser: { username: 'admin', password: 'admin123', name: 'Admin' },
  /** TMDB is called directly from the browser. */
  tmdbApiBase: 'https://api.themoviedb.org/3',
  tmdbImageBase: 'https://image.tmdb.org/t/p',
  apiBaseUrl: 'http://localhost:3000',
  /** URL of the public movie app, used for "View on site" links. */
  siteUrl: 'http://localhost:4200'
};
