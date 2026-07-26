const CACHE_NAME = 'chapshop-v2';

const APP_FILES = [
  '/',
  'index.html',
  'about.html',
  'blog.html',
  'faq.html',
  'login.html',
  'track.html',
  'admin-dashboard.html',
  'merchant-dashboard.html',
  'call-center.html',
  'shipping-dashboard.html',
  'stock.html',
  'finance.html',
  'rider.html',
  'follow-up.html',
  'refund-management.html',
  'reviews.html',
  'merchants.html',
  'chapdrop-store.html',
  'core.js',
  'manifest.json',
  'manifest-admin.json',
  'manifest-merchant.json',
  'manifest-callcenter.json',
  'manifest-shipping.json',
  'manifest-stock.json',
  'manifest-finance.json',
  'manifest-rider.json'
];

const CDN_CACHE = [
  'https://cdn.tailwindcss.com',
  'https://code.iconify.design/3/3.1.0/iconify.min.js'
];

// Install — cache all app files
self.addEventListener('install', event => {
  console.log('[SW] Installing ChapShop Service Worker v2');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Caching app files');
      return cache.addAll(APP_FILES).catch(err => {
        console.warn('[SW] Some files failed to cache:', err);
        // Cache what we can, skip failures
        return Promise.allSettled(
          APP_FILES.map(file => cache.add(file).catch(() => null))
        );
      });
    })
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating ChapShop Service Worker v2');
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch — Network first, fallback to cache
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip Firebase/Auth requests (must always be online)
  if (event.request.url.includes('firebaseio.com') ||
      event.request.url.includes('googleapis.com') ||
      event.request.url.includes('firebaseapp.com') ||
      event.request.url.includes('identitytoolkit') ||
      event.request.url.includes('securetoken') ||
      event.request.url.includes('storage.googleapis.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache successful responses
        if (response.status === 200) {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, cloned);
          });
        }
        return response;
      })
      .catch(() => {
        // Network failed — try cache
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          // If HTML page request fails, return index.html as fallback
          if (event.request.headers.get('accept').includes('text/html')) {
            return caches.match('index.html');
          }
          return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
        });
      })
  );
});
