// Minimal service worker — app-shell is NOT cached (app always loads latest
// version from network, as intended). The only job here is to show a clear
// "no internet" page instead of a blank screen / OS error when the initial
// navigation request fails due to no network connection.

const OFFLINE_CACHE = "alsouq-offline-v1";
const OFFLINE_URL = "offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(OFFLINE_CACHE).then((cache) => cache.add(OFFLINE_URL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Only intercept top-level page navigations (opening/reloading the app).
  // All other requests (Firebase, images, etc.) pass through untouched.
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.open(OFFLINE_CACHE).then((cache) => cache.match(OFFLINE_URL))
      )
    );
  }
});
