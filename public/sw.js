const CACHE_NAME = 'swu-dsm-faithlog-v2';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(['/']);
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Empty fetch handler is required for PWA installability,
  // but we don't intercept requests to avoid "response served by service worker has redirections" error on iOS.
});
