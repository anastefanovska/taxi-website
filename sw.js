const VERSION = 'pt-v1';
const CORE = [
  'story.html',
  'css/story.css',
  'js/prices.js',
  'js/config.js',
  'js/i18n.js',
  'js/story-text.js',
  'js/story.js',
  'js/story-map.js',
  'assets/data/balkans.json',
  'assets/icons/favicon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function networkFirst(request) {
  return fetch(request).then((response) => {
    if (response.ok) {
      const copy = response.clone();
      caches.open(VERSION).then((cache) => cache.put(request, copy));
    }
    return response;
  }).catch(() => caches.match(request));
}

function cacheFirst(request) {
  return caches.match(request).then((hit) => hit || fetch(request).then((response) => {
    if (response.ok || response.type === 'opaque') {
      const copy = response.clone();
      caches.open(VERSION).then((cache) => cache.put(request, copy));
    }
    return response;
  }));
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;

  if (sameOrigin && (request.mode === 'navigate' || /\.(html|css|js)$/.test(url.pathname))) {
    event.respondWith(networkFirst(request));
    return;
  }
  if (sameOrigin || url.hostname === 'images.unsplash.com' || url.hostname === 'cdn.jsdelivr.net' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(cacheFirst(request));
  }
});
