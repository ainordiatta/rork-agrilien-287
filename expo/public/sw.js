// AgriLien Service Worker — PWA Offline Support
const CACHE_VERSION = 'v1';
const STATIC_CACHE = `agrilien-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `agrilien-runtime-${CACHE_VERSION}`;
const TILE_CACHE = `agrilien-tiles-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/favicon.png',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
];

const TILE_DOMAINS = [
  'tile.openstreetmap.org',
  'a.tile.openstreetmap.org',
  'b.tile.openstreetmap.org',
  'c.tile.openstreetmap.org',
];

// ─── Install ───────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Ignore individual failures during install
      });
    })
  );
  self.skipWaiting();
});

// ─── Activate ──────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            return (
              name.startsWith('agrilien-') &&
              name !== STATIC_CACHE &&
              name !== RUNTIME_CACHE &&
              name !== TILE_CACHE
            );
          })
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// ─── Fetch ─────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-GET requests et les extensions browser
  if (request.method !== 'GET') return;
  if (url.protocol === 'chrome-extension:') return;

  // Tuiles Leaflet / OpenStreetMap — Cache First (longue durée)
  if (TILE_DOMAINS.some((d) => url.hostname.includes(d))) {
    event.respondWith(tileFirst(request));
    return;
  }

  // API tRPC / Rork — Network First, pas de cache
  if (url.pathname.startsWith('/trpc') || url.hostname.includes('rork.com')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Assets statiques (_expo/, icons, etc.) — Cache First
  if (
    url.pathname.startsWith('/_expo/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|woff2?|ttf)$/)
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Navigation (HTML pages) — Network First avec fallback offline
  if (request.mode === 'navigate') {
    event.respondWith(navigationHandler(request));
    return;
  }

  // Tout le reste — Network First
  event.respondWith(networkFirst(request));
});

// ─── Stratégies ────────────────────────────────────────────────────────────

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Hors ligne', { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response('Hors ligne', { status: 503 });
  }
}

async function tileFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(TILE_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Tuile non disponible hors ligne', { status: 503 });
  }
}

async function navigationHandler(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Essayer le cache d'abord
    const cached = await caches.match(request);
    if (cached) return cached;
    // Sinon, la page offline
    const offlinePage = await caches.match('/offline.html');
    return offlinePage || new Response('<h1>Hors ligne</h1>', {
      headers: { 'Content-Type': 'text/html' },
    });
  }
}
