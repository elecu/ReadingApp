# BookQuest

BookQuest is a Progressive Web App (PWA) for logging reading sessions and turning that data into statistics, charts and gamification elements (levels, XP, streaks, achievements and reading "quests").

## What it does

- Logs reading sessions (pages read, minutes spent, active book).
- Computes metrics: pages/minute, estimated time to finish a book, daily streaks, XP and levels.
- Dashboard with charts (bars drawn on `<canvas>`, no external charting libraries) across configurable date ranges (7 days, 30 days, 3 months, 6 months, 1 year, all time).
- Generates reading "quests" tied to reading progress, using a heuristic generator and an optional on-device AI mode (WebLLM / Transformers.js) that runs entirely in the browser, with no server involved.
- Exports visual summaries (PNG) of progress, quotes and book completion.
- Multi-language support (English/Spanish) via a custom i18n system.
- Local persistence (localStorage) with optional backup to Google Drive (app data folder) via OAuth.

## How it's built

- **Frontend**: plain HTML, CSS and JavaScript (no frameworks, no build step). All app logic lives in [app.js](app.js), markup in [index.html](index.html), styling in [style.css](style.css).
- **Data**: app state (books, sessions, achievements, settings) is stored as JSON in `localStorage` and, if enabled, synced to a JSON file in the user's Google Drive app data folder.
- **Minimal backend**: a Cloudflare Worker ([backend/worker.js](backend/worker.js)) handles the Google OAuth authorization-code flow and stores refresh tokens in Cloudflare KV, so the frontend can refresh access tokens without relying on third-party cookies.
- **On-device AI (optional)**: integrates WebLLM and Transformers.js to generate quest content directly in the user's browser, without sending any data to a server.
- **PWA**: installable via [manifest.json](manifest.json), with an icon and basic offline support.
- **Tests**: unit tests in Node (`tests/`) covering time/progress calculation logic.

## Project structure

```
index.html        App markup and layout
app.js             App logic (state, calculations, charts, AI, Drive sync)
style.css          Styles
i18n.es.js         Spanish translations
config.js          OAuth client and backend URL configuration
manifest.json      PWA manifest
backend/           Cloudflare Worker for Google Drive OAuth
tests/             Unit tests (Node)
```

## Running locally

No dependencies to install. Just serve the static files, e.g.:

```
npx serve .
```

then open `index.html` in the browser. Google Drive sync is optional and requires configuring `config.js` and deploying the worker (see [backend/README.md](backend/README.md)).
