const CACHE_NAME = 'epitotudas-v8';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/article-default.jpg',
  '/hero-bg.jpg',
  '/hero-construction.jpg',
  '/site-tile.png',
  '/logo.png',
  '/site.webmanifest?v=20260912_v5',
  '/favicon.ico?v=20260912_v5',
  '/favicon-16x16.png?v=20260912_v5',
  '/favicon-32x32.png?v=20260912_v5',
  '/favicon-48x48.png?v=20260912_v5',
  '/apple-touch-icon.png?v=20260912_v5',
  '/android-chrome-192x192.png?v=20260912_v5',
  '/android-chrome-512x512.png?v=20260912_v5'
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
  // Only intercept GET requests with http or https protocol
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http://') && !event.request.url.startsWith('https://')) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cachedMatch = await caches.match(event.request);
        if (cachedMatch) return cachedMatch;
        const indexMatch = await caches.match('/index.html');
        if (indexMatch) return indexMatch;
        const rootMatch = await caches.match('/');
        if (rootMatch) return rootMatch;
        return Response.error();
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) return response;
      return fetch(event.request).catch(async () => {
        if (event.request.destination === 'image') {
          const fallbackImage = await caches.match('/article-default.jpg');
          if (fallbackImage) return fallbackImage;
        }
        return Response.error();
      });
    })
  );
});

