# MovieFlix Dashboard (Angular)

An admin dashboard for a Netflix-style movie site. It is a **separate project**: the
[movie-app](https://github.com/Vipulsingh716590/movie-app) was only the reference for the data model, the look and the code
structure. Nothing in that repo is changed or needed to run this one.

## Run
```
npm install
npm start          # mock API (port 3000) + dashboard: http://localhost:4300
```
Sign in with the **mock login: `admin` / `admin123`** (see [Mock login](#mock-login)).
`npm test` runs the unit tests, `npm run build:prod` builds it. If the API is already running, `npx ng serve` starts only the dashboard.

## What it does
| Page | What you can do |
|------|-----------------|
| **Overview** | KPIs (movies, average rating, average runtime, genres, movies missing a poster or a trailer), rating distribution, genre donut, movies per decade, movies per site section, top rated, and a quick "Show ratings" switch. |
| **Movies** | **Add** a movie by hand or by searching TMDB (poster, cast, genres, runtime and trailer are filled in, and can be changed before saving). **Edit** title / overview / release date / rating / poster link. **Delete** a movie (with a confirmation). Search (English or Hindi title), filter by genre, section or "poster missing", sort, and hide the rating of a single movie. Movies without a poster show a letter tile instead of a blank. |
| **Trailers** | See which movies have a trailer and which are missing one. Paste any YouTube link (`watch?v=`, `youtu.be/`, `/embed/`, `/shorts/`) or an 11-character video id, preview it in a player, open it on YouTube, replace or remove it. With a TMDB key, "Find on TMDB" suggests one movie's official trailer, and **Find all missing on TMDB** (also on the Movies page as "Fill missing from TMDB") looks up every movie without a poster or trailer and lists the matches. Nothing is saved until you tick what to use and apply; a match with a different release year is left unticked so a wrong film is not applied by accident. |
| **Display settings** | Master switch for all ratings, clear per-movie overrides, show or hide the hero banner and the Popular / Upcoming / Now playing sections, the TMDB key, reset to defaults, live preview. |

Every change is saved straight away and rolled back (or reloaded from the server) with an error toast if the API is down.

## Phones and tablets
The dashboard is responsive from 320 px up. On phones (under 900 px) the sidebar becomes a slim top bar plus a bottom tab bar within thumb reach; the Movies and Trailers tables (under 760 px) and the TMDB review list (under 700 px) turn into cards with a label in front of each value, so nothing needs sideways scrolling; dialogs fill the screen width; fields are 16 px (so iPhones do not zoom in when you tap one) and buttons and switches are at least 44 px high. It was checked at 320, 360, 375, 390, 412, 420, 480, 600, 768, 1024 and 1280 px.

## Mock login
A sign-in page guards every screen. The user is `admin` and the password is `admin123`, set in `src/environments/environment*.ts`
(`mockUser`). **This is a mock: the password is visible in the page source, so it keeps casual visitors out but is not security.**
Replace `AuthService` with a real login (JWT or an identity provider) before putting real data behind it. The session lasts for the browser tab.

## TMDB import
"Add movie" and "Find on TMDB" use [TMDB](https://www.themoviedb.org/)'s API. Create a free account, get a **v3 API key** (Settings, then API)
and save it in **Display settings**. The key is kept in your browser only (localStorage) and is sent only to TMDB. It is never part of the project.
Without a key everything else works and movies can be added by hand.

## Data
`mock-server/db.json` is this project's own copy of the movie catalogue (same shape as the movie app's mock API) plus a `settings` object:

```json
"settings": { "showRatings": true, "hiddenRatingIds": [], "showHeroBanner": true, "showPopular": true, "showUpcoming": true, "showLatest": true }
```
It is served by json-server (`npm run mock:server`). A site that wants to follow these switches reads `GET /settings`.
Connecting the movie app that way is a separate step and not part of this project.

Adding, editing and deleting a movie write to `movieDetails` **and** to the `hero` / `popular` / `upcoming` / `latest` / `searchResults` lists that hold copies (`searchResults` is the list of search-only films, shown as "Search only"), so every list agrees.

## Structure (same layout as the movie app)
```
src/app
├── core
│   ├── guards/         auth (login required)
│   ├── interceptors/   error (API errors -> toast), demo-api (hosted demo only)
│   ├── models/         movie, site-settings
│   ├── services/       movie-api (HTTP), movie-store (signals + derived stats), tmdb, auth, toast
│   └── utils/          analytics, youtube (link parsing), tmdb-map (all pure and unit tested)
├── features
│   ├── login/          mock sign-in
│   ├── overview/       lazy route + page
│   ├── movies/         lazy route + page + components/movie-editor, movie-add
│   ├── trailers/       lazy route + page
│   └── settings/       lazy route + page
└── shared
    ├── components/     sidebar, poster, stat-card, bar-chart, donut-chart, toggle-switch, rating-badge,
    │                   confirm-dialog, trailer-preview, toast-container, loading-state
    └── pipes/          runtime
```
Design choices: standalone components, lazy-loaded routes with default-exported route files, signals for state (one `MovieStore`
for every page), optimistic updates with rollback, charts drawn with plain HTML/SVG (no chart library, so the bundle stays small
and the charts are accessible), keyboard-accessible `role="switch"` toggles and dialogs that close with Esc, responsive layout.

## Hosted demo (Netlify)
`npm run build:demo` builds a demo that needs no API: `demo-api.interceptor` answers the requests from an in-memory copy of
`mock-server/db.json` (embedded in the page by the bundler), routing uses `#` URLs, and `scripts/bundle-demo.mjs` packs everything into one file
(`dist/movie-dashboard/browser/index.html`). Changes in the demo stay in the browser tab and reset on reload. The mock login works the same.

On Netlify: **Add new site -> Import from Git**, pick this repo. `netlify.toml` supplies the build command (`npm run build:demo`), Node 22 and the publish folder
(Netlify's Angular plugin needs both, see the comments there). Don't host the real dashboard publicly until it has a real login, since it edits the API.

## Ideas for next steps
1. **Real login and roles** (admin / editor), replacing the mock one.
2. **Real backend.** Replace json-server with a real API/database; `MovieApiService` is the only file that changes.
3. **Real analytics.** Views, trailer plays, searches (including searches with no result) and watch-time per movie, from tracking events, with date-range filters.
4. **Connect the movie app** to `/settings` so the switches here control the live site (needs a small change in the movie app).
5. **Check trailers automatically**: flag links YouTube reports as unavailable, and refresh a movie's data from TMDB.
6. **Bulk actions** in the table (select many, hide ratings, assign sections) and CSV export.
7. **Audit log and undo** of every change (who changed what, when).
8. **Scheduling**: show a section or flip a switch at a set date (for example a release day).
9. **Reorder the hero banner** by drag and drop.
10. **E2E tests** (Playwright) and a Netlify deploy of the dashboard behind a real login.
