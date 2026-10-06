/** Hosted demo: no server, the mock API runs in the browser and changes are lost on reload. */
export const environment = {
  production: true,
  demo: true,
  /** Mock login only: this is not real security, the credentials are visible in the page source. */
  mockUser: { username: 'admin', password: 'admin123', name: 'Admin' },
  apiBaseUrl: 'http://demo.local',
  siteUrl: ''
};
