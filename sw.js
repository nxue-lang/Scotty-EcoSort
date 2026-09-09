'use strict';
const CACHE = 'scotty-sort-v1';
const HOME = new URL('./', self.location).href;
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll([HOME, new URL('index.html', HOME).href])).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('scotty-sort-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  if (event.request.mode === 'navigate') event.respondWith(fetch(event.request).then(response => {
    if (response.ok && !response.redirected) {
      const copy = response.clone(); event.waitUntil(caches.open(CACHE).then(cache => cache.put(HOME, copy)));
    }
    return response;
  }).catch(() => caches.match(HOME)));
});
