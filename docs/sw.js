/* global clients */
// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/**
 * Eidovara Service Worker — Offline-first PWA with advanced caching
 * Version: 1.0.0
 */

// Scope-relative base so the worker works both at the eidovara.org apex and
// on the GitHub Pages project mirror (/project---soul/) subpath.
const BASE = new URL('./', self.registration ? self.registration.scope : self.location);
const assetUrl = name => new URL(name, BASE).toString();

const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `eidovara-${CACHE_VERSION}`;
const STATIC_CACHE = `${CACHE_NAME}-static`;
const RUNTIME_CACHE = `${CACHE_NAME}-runtime`;
const IMAGE_CACHE = `${CACHE_NAME}-images`;
const OFFLINE_URL = assetUrl('offline.html');

const STATIC_ASSETS = [
  'index.html',
  'offline.html',
  '500.html',
  'product.html',
  'download.html',
  'assist.html',
  'help.html',
  'faq.html',
  'status.html',
  'legal.html',
  'terms.html',
  'age.html',
  'licensing.html',
  'privacy.html',
  'security.html',
  'version-history.html',
  'roadmap.html',
  'tokens.css',
  'site.css',
  'brand.css',
  'site.js',
  'assist.js',
  'manifest.json',
  'eidovara-icon.png',
  'eidovara-mark.png',
  'soul-consciousness-studios-mark.png',
  'eidovara-og.png',
  'eidovara-wallpaper-light.jpg',
  'eidovara-wallpaper-dark.jpg',
  'eidovara-wallpaper-product.jpg'
].map(assetUrl);

const CACHE_STRATEGIES = {
  static: 'cache-first',
  html: 'network-first',
  images: 'cache-first',
  api: 'network-only',
  fonts: 'cache-first'
};

const MAX_RUNTIME_ENTRIES = 50;
const MAX_IMAGE_ENTRIES = 100;

// ==========================================================================
// INSTALL EVENT
// ==========================================================================
self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => cache.addAll(STATIC_ASSETS)),
      caches.open(IMAGE_CACHE),
      caches.open(RUNTIME_CACHE)
    ]).then(() => self.skipWaiting())
  );
});

// ==========================================================================
// ACTIVATE EVENT
// ==========================================================================
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => !name.startsWith(CACHE_NAME))
          .map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// ==========================================================================
// FETCH EVENT
// ==========================================================================
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests (except for allowed CDNs)
  if (url.origin !== location.origin && !isAllowedCrossOrigin(url)) return;

  // Skip API requests (network only)
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/v1/')) return;

  // Determine request type and strategy
  const isHTML = request.headers.get('accept')?.includes('text/html');
  const isImage = request.destination === 'image' || /\.(png|jpg|jpeg|gif|webp|svg|ico|avif)$/i.test(url.pathname);
  const isFont = request.destination === 'font' || /\.(woff|woff2|ttf|otf|eot)$/i.test(url.pathname);
  const isCSS = request.destination === 'style' || url.pathname.endsWith('.css');
  const isJS = request.destination === 'script' || url.pathname.endsWith('.js');

  let strategy;
  if (isHTML) strategy = CACHE_STRATEGIES.html;
  else if (isImage) strategy = CACHE_STRATEGIES.images;
  else if (isFont) strategy = CACHE_STRATEGIES.fonts;
  else if (isCSS || isJS) strategy = CACHE_STRATEGIES.static;
  else strategy = CACHE_STRATEGIES.static;

  event.respondWith(handleRequest(request, strategy, url));
});

// ==========================================================================
// REQUEST HANDLING
// ==========================================================================
async function handleRequest(request, strategy, url) {
  switch (strategy) {
    case 'cache-first':
      return cacheFirst(request, url.pathname.match(/\.(css|js)$/) ? STATIC_CACHE : isImageRequest(request) ? IMAGE_CACHE : RUNTIME_CACHE);
    case 'network-first':
      return networkFirst(request, RUNTIME_CACHE);
    case 'network-only':
      return fetch(request).catch(() => offlineFallback(request));
    default:
      return fetch(request);
  }
}

// Cache First Strategy
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) {
    // Stale-while-revalidate: update in background
    fetchAndCache(request, cacheName).catch(() => {});
    return cached;
  }
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cloned = response.clone();
      await cache.put(request, cloned);
      await enforceCacheLimit(cacheName, cacheName === IMAGE_CACHE ? MAX_IMAGE_ENTRIES : MAX_RUNTIME_ENTRIES);
    }
    return response;
  } catch {
    return offlineFallback(request);
  }
}

// Network First Strategy
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cloned = response.clone();
      await cache.put(request, cloned);
      await enforceCacheLimit(cacheName, MAX_RUNTIME_ENTRIES);
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    return offlineFallback(request);
  }
}

// Fetch and cache in background (stale-while-revalidate)
async function fetchAndCache(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
  } catch { /* ignore */ }
}

// Offline fallback
function offlineFallback(request) {
  if (request.mode === 'navigate' || request.destination === 'document') {
    return caches.match(OFFLINE_URL).then(res => res || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/html' } }));
  }
  if (request.destination === 'image') {
    return new Response('', { status: 503, headers: { 'Content-Type': 'image/svg+xml' } });
  }
  return new Response('Offline', { status: 503 });
}

// Check if request is for an image
function isImageRequest(request) {
  return request.destination === 'image' || /\.(png|jpg|jpeg|gif|webp|svg|ico|avif)$/i.test(new URL(request.url).pathname);
}

// Check if cross-origin is allowed
function isAllowedCrossOrigin(url) {
  const allowed = ['https://eidovara.org', 'https://api.eidovara.org', 'https://github.com'];
  return allowed.some(origin => url.origin === origin);
}

// Enforce cache size limit
async function enforceCacheLimit(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxEntries) {
    const toDelete = keys.slice(0, keys.length - maxEntries);
    await Promise.all(toDelete.map(key => cache.delete(key)));
  }
}

// ==========================================================================
// MESSAGE HANDLING
// ==========================================================================
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
  if (event.data === 'clearCache') {
    event.waitUntil(
      caches.keys().then(names => Promise.all(names.filter(n => n.startsWith(CACHE_NAME)).map(n => caches.delete(n))))
    );
  }
});

// ==========================================================================
// BACKGROUND SYNC (for future use)
// ==========================================================================
self.addEventListener('sync', event => {
  if (event.tag === 'analytics-sync') {
    event.waitUntil(syncAnalytics());
  }
});

async function syncAnalytics() {
  // Send queued analytics when back online
  const cache = await caches.open(RUNTIME_CACHE);
  const requests = await cache.keys();
  const analyticsRequests = requests.filter(r => r.url.includes('/analytics') || r.url.includes('/collect'));
  for (const req of analyticsRequests) {
    try {
      await fetch(req);
      await cache.delete(req);
    } catch { /* keep for next sync */ }
  }
}

// ==========================================================================
// PERIODIC SYNC (for future use)
// ==========================================================================
self.addEventListener('periodicsync', event => {
  if (event.tag === 'content-update') {
    event.waitUntil(updateContent());
  }
});

async function updateContent() {
  // Check for content updates and refresh cache
  const cache = await caches.open(STATIC_CACHE);
  for (const asset of STATIC_ASSETS) {
    try {
      const response = await fetch(asset, { cache: 'no-cache' });
      if (response.ok) await cache.put(asset, response.clone());
    } catch { /* ignore */ }
  }
}

// ==========================================================================
// PUSH NOTIFICATIONS (for future use)
// ==========================================================================
self.addEventListener('push', event => {
  if (!event.data) return;
    const data = event.data.json();
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: assetUrl('eidovara-icon.png'),
        badge: assetUrl('eidovara-icon.png'),
      data: data.url,
      actions: data.actions || [],
      requireInteraction: false,
      silent: false
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'open' && event.notification.data) {
    event.waitUntil(clients.openWindow(event.notification.data));
  }
});