const CACHE_NAME = 'vigor-kiosk-v1';
const STATIC_CACHE_URLS = [
  '/kiosk',
  '/manifest.json',
  // Add other static assets as needed
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        // Force the waiting service worker to become the active service worker
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Ensure the new service worker takes control immediately
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle requests to our domain
  if (url.origin !== location.origin) {
    return;
  }

  // Handle kiosk routes
  if (url.pathname.startsWith('/kiosk')) {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          // If not in cache, try to fetch from network
          return fetch(request)
            .then((response) => {
              // Don't cache non-successful responses
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }

              // Clone the response before caching
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(request, responseToCache);
                });

              return response;
            })
            .catch(() => {
              // If network fails, return offline page or cached kiosk page
              return caches.match('/kiosk');
            });
        })
    );
    return;
  }

  // Handle API requests - don't cache, but provide offline fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .catch(() => {
          // Return a custom offline response for API calls
          return new Response(
            JSON.stringify({
              error: 'Device is offline',
              message: 'Please check your internet connection and try again.',
              offline: true
            }),
            {
              status: 503,
              statusText: 'Service Unavailable',
              headers: {
                'Content-Type': 'application/json'
              }
            }
          );
        })
    );
    return;
  }

  // For all other requests, try network first, then cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone the response before caching
        const responseToCache = response.clone();
        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(request, responseToCache);
          });

        return response;
      })
      .catch(() => {
        // If network fails, try to serve from cache
        return caches.match(request);
      })
  );
});

// Handle background sync for offline check-ins (future enhancement)
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-checkin') {
    console.log('Background sync: processing offline check-ins');
    event.waitUntil(processOfflineCheckins());
  }
});

// Process offline check-ins when connection is restored
async function processOfflineCheckins() {
  try {
    // Get offline check-ins from IndexedDB (future implementation)
    // For now, just log that sync is working
    console.log('Processing offline check-ins...');
    
    // In a full implementation, this would:
    // 1. Retrieve queued check-ins from IndexedDB
    // 2. Send them to the API
    // 3. Remove successful ones from the queue
    // 4. Notify the UI of the results
  } catch (error) {
    console.error('Error processing offline check-ins:', error);
  }
}

// Handle push notifications (future enhancement)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'New notification',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: data.tag || 'default',
      data: data.data || {},
      actions: data.actions || []
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Vigor Kiosk', options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow('/kiosk')
  );
});

// Vigor Kiosk Service Worker loaded
