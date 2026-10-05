# MovieFlix Dashboard (Angular)

An admin dashboard for a Netflix-style movie site. It is a **separate project**: the
[movie-app](https://github.com/Vipulsingh716590/movie-app) was only the reference for the data model, the look and the code
structure. Nothing in that repo is changed or needed to run this one.

## Run
```
npm install
npm start          # mock API (port 3000) + dashboard: http://localhost:4300
```
`npm test` runs the unit tests, `npm run build:prod` builds it. If the API is already running, `npx ng serve` starts only the dashboard.

## What it does
| Page | What you can do |
|------|-----------------|
| **Overview** | KPIs (movies, average rating, average runtime, genres), rating distribution, genre donut, movies per decade, movies per site section, top rated, and a quick "Show ratings" switch. |
| **Movies** | Search (English or Hindi title), filter by genre or section, sort, edit title / overview / release date / rating, and hide the rating of a single movie. |
| **Display settings** | Master switch for all ratings, clear per-movie overrides, show or hide the hero banner and the Popular / Upcoming / Now playing sections, reset to defaults, live preview. |

Every switch is saved straight away and rolled back with an error toast if the API is down.

## Data
`mock-server/db.json` is this project's own copy of the movie catalogue (same shape as the movie app's mock API) plus a `settings` object:

```json
"settings": { "showRatings": true, "hiddenRatingIds": [], "showHeroBanner": true, "showPopular": true, "showUpcoming": true, "showLatest": true }
```
It is served by json-server (`npm run mock:server`). A site that wants to follow these switches reads `GET /settings`.
Connecting the movie app that way is a separate step and not part of this project.

Editing a movie patches `movieDetails/:id` **and** the copies in the `hero` / `popular` / `upcoming` / `latest` lists, so every list agrees.

## Structure (same layout as the movie app)
```
src/app
├── core
│   ├── interceptors/   error (API errors -> toast), demo-api (hosted demo only)
│   ├── models/         movie, site-settings
│   ├── services/       movie-api (HTTP), movie-store (signals + derived stats), toast
│   └── utils/          analytics (pure stat functions, unit tested)
├── features
│   ├── overview/       lazy route + page
│   ├── movies/         lazy route + page + components/movie-editor
│   └── settings/       lazy route + page
└── shared
    ├── components/     sidebar, stat-card, bar-chart, donut-chart, toggle-switch, rating-badge, toast-container, loading-state
    └── pipes/          runtime
```
Design choices: standalone components, lazy-loaded routes with default-exported route files, signals for state (one `MovieStore`
for every page), optimistic updates with rollback, charts drawn with plain HTML/SVG (no chart library, so the bundle stays small
and the charts are accessible), keyboard-accessible `role="switch"` toggles, responsive layout.

## Hosted demo (Netlify)
`npm run build:demo` builds a demo that needs no API: `demo-api.interceptor` answers the requests from an in-memory copy of
`mock-server/db.json`, routing uses `#` URLs, and `scripts/bundle-demo.mjs` packs everything into one file (`dist/demo/index.html`).
Changes in the demo stay in the browser tab and reset on reload.

On Netlify: **Add new site -> Import from Git**, pick this repo. `netlify.toml` supplies the build command and publish folder.
Don't host the real dashboard publicly until it has a login (see below), since it edits the API.

## Ideas for next steps
1. **Login / roles.** Today anyone who can reach the dashboard can change the data. Add auth (JWT or an identity provider) and an `admin`/`editor` role guard on the routes before deploying it.
2. **Real backend.** Replace json-server with a real API/database; `MovieApiService` is the only file that changes.
3. **Add and delete movies**, with a TMDB search-and-import so an admin does not type everything by hand.
4. **Hide or feature a movie** (not just its rating), and reorder the hero banner and sections by drag and drop.
5. **Real analytics.** Views, trailer plays, searches (including searches with no result) and watch-time per movie, from tracking events, with date-range filters.
6. **Audit log and undo** of every change (who changed what, when).
7. **Scheduling**: show a section or flip a switch at a set date (for example a release day).
8. **Bulk actions** in the table (select many, hide ratings, assign sections) and CSV export.
9. **Dark/light theme and Hindi labels**, since the movie site already supports Hindi search.
10. **E2E tests** (Playwright) and a Netlify deploy of the dashboard behind authentication.
