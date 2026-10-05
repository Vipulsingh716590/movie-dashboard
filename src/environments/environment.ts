/** The dashboard talks to the json-server in ./mock-server (npm run mock:server). */
export const environment = {
  production: false,
  /** True only in the hosted demo build: the API is simulated in the browser (see demo-api.interceptor). */
  demo: false,
  apiBaseUrl: 'http://localhost:3000',
  /** URL of the public movie app, used for "View on site" links. */
  siteUrl: 'http://localhost:4200'
};
