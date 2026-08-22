// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
// Eidovara Service Worker - Offline-first caching for PWA

const CACHE_NAME = 'eidovara-v1.0.0';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/product.html',
  '/download.html',
  '/assist.html',
  '/help.html',
  '/faq.html',
  '/status.html',
  '/legal.html',
  '/terms.html',
  '/age.html',
  '/licensing.html',
  '/privacy.html',
  '/security.html',
  '/version-history.html',
  '/roadmap.html',
  '/tokens.css',
  '/site.css',
  '/brand.css',
  '/site.js',
  '/assist.js',
  '/eidovara-icon.png',
  '/eidovara-mark.png',
  '/soul-consciousness-studios-mark.png',
  '/eidovara-og.png',
  '/eidovara-wallpaper-light.jpg',
  '/eidovara-wallpaper-dark.jpg',
  '/eidovara-wallpaper-product.jpg',
  '/manifest.json',
];

const CACHE_STRATEGIES = {
  // Static assets: cache first, network fallback
  static: 'cache-first',
  // HTML pages: network first, cache fallback
  html: 'network-first',
  // API requests: network only, no caching
  api: 'network-only',
};

self.addEventListener('install', event => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests
  if (url.origin !== location.origin) return;

  // Skip API requests (network only)
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/v1/')) {
    return;
  }

  // Determine strategy based on request type
  const isHTML = request.headers.get('accept')?.includes('text/html');
  const isStaticAsset = /\.(css|js|png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|json|xml)$/i.test(
    url.pathname
  );

  let strategy;
  if (isHTML) strategy = CACHE_STRATEGIES.html;
  else if (isStaticAsset) strategy = CACHE_STRATEGIES.static;
  else strategy = CACHE_STRATEGIES.static;

  event.respondWith(handleRequest(request, strategy));
});

async function handleRequest(request, strategy) {
  const cache = await caches.open(CACHE_NAME);

  switch (strategy) {
    case 'cache-first': {
      const cached = await cache.match(request);
      if (cached) return cached;
      try {
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      } catch {
        return new Response('Offline', { status: 503 });
      }
    }
    case 'network-first':
      try {
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      } catch {
        const cached = await cache.match(request);
        if (cached) return cached;
        return new Response('Offline', { status: 503 });
      }

    default:
      return fetch(request);
  }
}

// Handle messages from client
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
