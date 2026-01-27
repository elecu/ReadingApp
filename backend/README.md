# Backend (Cloudflare Worker)

This worker handles Google OAuth (authorization code) and stores refresh tokens in
Cloudflare KV. The frontend exchanges a session ID for access tokens on demand,
so refresh survives page reloads without third-party cookies.

## Free stack choice
- Cloudflare Workers + KV (free tier).

## Required Google OAuth setup
Create a Google OAuth "Web application" client and add this redirect URI:
- `https://YOUR_WORKER_DOMAIN/auth/callback`

## Worker environment variables
Set these in your Worker settings:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `APP_ORIGIN` (example: `https://yourname.github.io`)
- `BASE_URL` (example: `https://YOUR_WORKER_DOMAIN`)

Bind a KV namespace as:
- `BOOKQUEST_KV`

## Deploy notes
1) Create a Worker and KV namespace in Cloudflare.
2) Upload `backend/worker.js` as the Worker script.
3) Add the environment variables and KV binding.
4) In `config.js`, set `backendUrl` to the worker URL.

## Frontend config
Edit `config.js`:
```
window.BOOKQUEST_CONFIG = {
  googleClientId: "YOUR_CLIENT_ID",
  backendUrl: "https://YOUR_WORKER_DOMAIN"
};
```

After deploy, click "Connect Google Drive" once. The app will store a session ID
and refresh access tokens automatically on reload.
