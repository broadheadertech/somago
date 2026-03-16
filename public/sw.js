// Somago Service Worker — App Shell Caching + Offline Fallback
const CACHE_NAME = "somago-v3"; // Bump version to invalidate old caches
const APP_SHELL = [
  "/offline.html",
  "/manifest.json",
];

// Install — pre-cache app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch — network-first for navigation, cache-first for static assets
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and cross-origin
  if (request.method !== "GET") return;
  if (url.origin !== self.location.origin) return;

  // Skip auth routes — NEVER interfere with Clerk
  if (url.pathname.startsWith("/sign-in") || url.pathname.startsWith("/sign-up")) return;

  // Skip API calls — never cache
  if (url.pathname.startsWith("/api")) return;

  // Network-first for navigation (HTML pages)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Only cache 200 OK responses (not errors, redirects)
          if (response.ok && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match("/offline.html"))
    );
    return;
  }

  // Cache-first for static assets (CSS, JS, fonts, images)
  if (
    url.pathname.match(/\.(css|js|woff2?|ttf|eot|png|jpg|jpeg|svg|webp|avif|ico)$/) ||
    url.pathname.startsWith("/_next/static")
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Default: network only (don't cache dynamic content)
  event.respondWith(fetch(request).catch(() => caches.match(request)));
});
