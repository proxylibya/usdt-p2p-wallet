
/*
 * Enterprise-Grade Service Worker
 * Strategy: Stale-While-Revalidate for Assets, Network-First for API
 * Designed to handle high traffic loads by serving cached assets immediately.
 */

const CACHE_NAME = 'usdt-wallet-enterprise-v2';
const DYNAMIC_CACHE = 'usdt-wallet-dynamic-v2';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg'
];

// Install: Pre-cache critical core shell
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Silent fail for missing assets
      });
    })
  );
});

// Activate: Clean up old versions
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME && key !== DYNAMIC_CACHE) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Strategy
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // 1. API Requests (Simulated or Real): Network First, Fallback to nothing (don't cache stale financial data)
  if (url.pathname.includes('/api/') || url.href.includes('google')) {
    return;
  }

  // 2. Static Assets (JS, CSS, Fonts, Images): Stale-While-Revalidate
  // This is critical for high traffic: Users get instant load from cache, 
  // while we update the cache in the background for the next visit.
  event.respondWith(
    caches.open(CACHE_NAME).then(async cache => {
      const cachedResponse = await cache.match(event.request);
      
      const networkFetch = fetch(event.request).then(networkResponse => {
        // Update cache with new version if valid
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      }).catch(() => {
        // Fallback logic if network fails completely
        return cachedResponse; 
      });

      // Return cached response immediately if available, otherwise wait for network
      return cachedResponse || networkFetch;
    })
  );
});

// Optimized Push Notification Handler
self.addEventListener('push', event => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch (e) {
    data = { title: 'New Alert', body: event.data.text() };
  }

  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.svg',
    badge: '/icons/icon-192x192.svg',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/' },
    actions: [
      { action: 'open', title: 'View' },
      { action: 'close', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'USDT Wallet', options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'close') return;

  const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      // Focus existing tab if open
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
