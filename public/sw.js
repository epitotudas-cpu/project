const CACHE_NAME = 'epitotudas-v6';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/site.webmanifest?v=20260912_v4',
  '/favicon.ico?v=20260912_v4',
  '/favicon-16x16.png?v=20260912_v4',
  '/favicon-32x32.png?v=20260912_v4',
  '/favicon-48x48.png?v=20260912_v4',
  '/apple-touch-icon.png?v=20260912_v4',
  '/android-chrome-192x192.png?v=20260912_v4',
  '/android-chrome-512x512.png?v=20260912_v4'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
