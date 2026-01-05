// BookQuest service worker (simple cache-first)
const CACHE = "bookquest-cache-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(ASSETS);
    self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k === CACHE ? null : caches.delete(k))));
    self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  // Only handle GET
  if (req.method !== "GET") return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req, { ignoreSearch: true });
    if (cached) return cached;

    try {
      const res = await fetch(req);
      // Cache same-origin assets
      const url = new URL(req.url);
      if (url.origin === self.location.origin && res.ok) {
        cache.put(req, res.clone());
      }
      return res;
    } catch {
      // fallback: index for navigation
      if (req.mode === "navigate") {
        const idx = await cache.match("./index.html");
        if (idx) return idx;
      }
      throw new Error("Network error");
    }
  })());
});
