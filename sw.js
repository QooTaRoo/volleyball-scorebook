// Service Worker for Volleyball Scorebook
self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', e => {
  // Simple pass-through for now. 
  // Can be expanded with caching logic later if offline support is needed.
  e.respondWith(fetch(e.request));
});
