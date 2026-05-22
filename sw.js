const CACHE_NAME = 'dialed-v1';
const APP_SHELL = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/app.js',
  '/js/config.js',
  '/js/db.js',
  '/js/silhouette.js',
  '/js/setup.js',
  '/js/components.js',
  '/js/testing.js',
  '/js/presets.js',
  '/js/export.js',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@300;400;500;600;700&family=IBM+Plex+Sans:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // Firebase and font requests: network first
  if (event.request.url.includes('firestore') ||
      event.request.url.includes('googleapis') ||
      event.request.url.includes('gstatic')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // App shell: cache first
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return response;
      });
    })
  );
});
