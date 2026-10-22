
const CACHE = 'dernek-music-v15';
const ASSETS = ['./', './index.html', './sw.js'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key.startsWith('dernek-music-') && key !== CACHE)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const isPage = event.request.mode === 'navigate' ||
    new URL(event.request.url).pathname.endsWith('/index.html');

  event.respondWith(
    (isPage
      ? fetch(event.request).then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then(cache => cache.put('./index.html', copy));
          }
          return response;
        }).catch(() => caches.match('./index.html'))
      : caches.match(event.request).then(cached => {
          if (cached) return cached;
          return fetch(event.request).then(response => {
            if (response.ok && new URL(event.request.url).origin === location.origin) {
              const copy = response.clone();
              caches.open(CACHE).then(cache => cache.put(event.request, copy));
            }
            return response;
          }).catch(() => caches.match('./index.html'));
        })
    )
  );
});
