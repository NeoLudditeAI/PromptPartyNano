// public/sw.js - Prompt Party Service Worker
// Handles push notifications, caching, and background sync

const CACHE_NAME = 'prompt-party-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  // Core app shell will be cached dynamically
];

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[SW] Service worker installed successfully');
        // Take control immediately
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache app shell:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Service worker activated successfully');
      // Take control of all clients immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip non-HTTP requests
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          console.log('[SW] Serving from cache:', event.request.url);
          return response;
        }

        // Otherwise fetch from network and cache
        return fetch(event.request).then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response (can only be consumed once)
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              // Only cache app resources, not external APIs
              if (event.request.url.startsWith(self.location.origin)) {
                console.log('[SW] Caching new resource:', event.request.url);
                cache.put(event.request, responseToCache);
              }
            });

          return response;
        }).catch(() => {
          // Return a custom offline page if we have one cached
          if (event.request.destination === 'document') {
            return caches.match('/offline.html');
          }
        });
      })
  );
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push event received:', event);

  // Default notification if no data
  let notificationData = {
    title: 'Prompt Party',
    body: 'Something happened in your game!',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: 'prompt-party-notification',
    requireInteraction: false,
    silent: false
  };

  // Parse push data if available
  if (event.data) {
    try {
      const pushData = event.data.json();
      notificationData = {
        ...notificationData,
        ...pushData,
        // Ensure we have required fields
        title: pushData.title || notificationData.title,
        body: pushData.body || notificationData.body,
        // Action buttons removed due to TypeScript compatibility
        // Will handle clicks via main notification click event
        // Add data for click handling
        data: {
          gameId: pushData.gameId,
          type: pushData.type, // 'turn' or 'reaction'
          url: pushData.url || '/'
        }
      };
    } catch (error) {
      console.error('[SW] Failed to parse push data:', error);
    }
  }

  // Show the notification
  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
      .then(() => {
        console.log('[SW] Notification displayed successfully');
      })
      .catch((error) => {
        console.error('[SW] Failed to show notification:', error);
      })
  );
});

// Notification click event - handle user interaction
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);
  
  // Close the notification
  event.notification.close();

  // Handle action buttons
  if (event.action === 'close') {
    return; // Just close, no further action
  }

  // Default action or 'open-game' action
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    // First, try to focus an existing window
    self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // Look for an existing window to focus
      for (const client of clientList) {
        if (client.url.includes(self.location.origin)) {
          console.log('[SW] Focusing existing window');
          // Navigate to the game if we have a specific URL
          if (event.notification.data?.gameId) {
            client.navigate(urlToOpen);
          }
          return client.focus();
        }
      }
      
      // No existing window found, open a new one
      console.log('[SW] Opening new window');
      return self.clients.openWindow(urlToOpen);
    }).catch((error) => {
      console.error('[SW] Failed to handle notification click:', error);
    })
  );
});

// Background sync event - handle when connection is restored
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync event:', event.tag);
  
  if (event.tag === 'prompt-party-sync') {
    event.waitUntil(
      // Handle any queued actions when back online
      handleBackgroundSync()
    );
  }
});

// Helper function for background sync
async function handleBackgroundSync() {
  try {
    console.log('[SW] Performing background sync...');
    // In the future, we could sync pending turns, reactions, etc.
    // For now, just log that sync is working
    console.log('[SW] Background sync completed');
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Global error handler
self.addEventListener('error', (event) => {
  console.error('[SW] Service worker error:', event.error);
});

// Unhandled promise rejection handler
self.addEventListener('unhandledrejection', (event) => {
  console.error('[SW] Unhandled promise rejection:', event.reason);
  event.preventDefault();
});

console.log('[SW] Service worker script loaded successfully');
