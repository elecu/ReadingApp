# Backend (Cloudflare Worker)

This worker handles two independent, optional features:
1. Google OAuth (authorization code) for Google Drive backup, storing refresh tokens in Cloudflare KV. The frontend exchanges a session ID for access tokens on demand, so refresh survives page reloads without third-party cookies.
2. Cloud-AI quest-object generation (`/quest/objects`) — a shared, cached endpoint that turns a book's title/author/synopsis into a short list of tangible quest objects using a real language model, for books where the on-device models (which are much smaller and run entirely in the browser) fall short.

Both are gated by `backendUrl` in `config.js`: leave it empty and the app runs fully on-device/offline, same as if this backend didn't exist.

## Free stack choice
- Cloudflare Workers + KV (free tier) for both features.
- Cloudflare Workers AI (free tier, see below) for quest-object generation.

## Required Google OAuth setup
Create a Google OAuth "Web application" client and add this redirect URI:
- `https://YOUR_WORKER_DOMAIN/auth/callback`

## Worker environment variables
Set these in your Worker settings:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `APP_ORIGIN` — one origin, or a comma-separated list (e.g. `https://yourname.github.io,capacitor://localhost,https://localhost`) if you also ship this app wrapped for the Play Store / App Store, since a wrapped app runs from its own origin.
- `BASE_URL` (example: `https://YOUR_WORKER_DOMAIN`)
- `QUEST_APP_KEY` (optional) — a secret string the frontend must send as the `X-App-Key` header to use `/quest/objects`. Left unset, the check is skipped (the route still works, just unprotected against generic bots). This is a light deterrent, not real security: since `config.js` is public (this is a static site with no build step), anyone reading the repo can find the same value. Its purpose is to filter automated scanners hitting the endpoint blindly, not to stop a targeted attacker. Set the same value as `questAppKey` in `config.js`.
- `QUEST_DAILY_CAP` (optional, default `150`) — max number of **new** (cache-miss) quest-object generations per UTC day, across all users combined. Cache hits (a book someone else already generated) don't count against this. This is the real cost/abuse safeguard, since the endpoint itself has no per-user login — one shared credential serves every user of the app, same as the OAuth Client ID above serves everyone but each person authenticates with their own Google account for Drive; `/quest/objects` has no per-user identity at all.

Bind a KV namespace as:
- `BOOKQUEST_KV` (same namespace serves OAuth sessions and the quest-object cache/budget counter, under different key prefixes)

Bind Workers AI as:
- `AI` — enable Workers AI on your Cloudflare account (separate opt-in from Workers+KV; as of writing this requires billing details on file even though the quest-object usage here should stay within the free daily allocation) and add the binding named `AI` to this Worker.

## Deploy notes
1) Create a Worker and KV namespace in Cloudflare.
2) Enable Workers AI on the account and bind it as `AI` (only needed if you want cloud quest-object generation; skip this and leave `QUEST_APP_KEY`/`QUEST_DAILY_CAP` unset if you only want Drive backup).
3) Upload `backend/worker.js` as the Worker script.
4) Add the environment variables and KV/AI bindings.
5) In `config.js`, set `backendUrl` to the worker URL (and `questAppKey` if you set `QUEST_APP_KEY`).

## Frontend config
Edit `config.js`:
```
window.BOOKQUEST_CONFIG = {
  googleClientId: "YOUR_CLIENT_ID",
  backendUrl: "https://YOUR_WORKER_DOMAIN",
  questAppKey: "YOUR_QUEST_APP_KEY"
};
```

After deploy, click "Connect Google Drive" once. The app will store a session ID
and refresh access tokens automatically on reload.

## Privacy note on `/quest/objects`
This sends a book's **title, author, and synopsis text** (already fetched for free from Google Books/Open Library/Wikipedia — public book metadata) to Cloudflare Workers AI to generate the quest-object list. It does **not** send anything about the user's reading sessions, progress, notes, or Drive-synced data. Users can turn this off per-device in Settings ("Cloud AI" toggle); the app falls back to its on-device chain either way.
