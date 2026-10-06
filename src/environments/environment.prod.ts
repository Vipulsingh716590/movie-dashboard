export const environment = {
  production: true,
  /** True only in the hosted demo build: the API is simulated in the browser (see demo-api.interceptor). */
  demo: false,
  /** Mock login only: this is not real security, the credentials are visible in the page source. */
  mockUser: { username: 'admin', password: 'admin123', name: 'Admin' },
  apiBaseUrl: 'http://localhost:3000',
  siteUrl: 'http://localhost:4200'
};
