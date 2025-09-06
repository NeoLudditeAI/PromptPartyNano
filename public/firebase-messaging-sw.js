// public/firebase-messaging-sw.js
// Firebase Cloud Messaging Service Worker for background notifications

// Import Firebase scripts for service worker
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js');

// Firebase configuration - matches your app config
const firebaseConfig = {
  apiKey: "AIzaSyCGbj5ZHPhKglhhOvvUW6KxLTQXXNyHXQ4",
  authDomain: "prompt-party-aa0d1.firebaseapp.com",
  projectId: "prompt-party-aa0d1",
  storageBucket: "prompt-party-aa0d1.firebasestorage.app", 
  messagingSenderId: "336336272678",
  appId: "1:336336272678:web:17818bd866cc8d79b195e7"
};

// Initialize Firebase in service worker
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging
const messaging = firebase.messaging();

// Handle background messages when app is closed/background
messaging.onBackgroundMessage((payload) => {
  console.log('[FCM SW] Background message received:', payload);

  // Extract notification data
  const notificationTitle = payload.notification?.title || 'Prompt Party';
  const notificationOptions = {
    body: payload.notification?.body || 'Something happened in your game!',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png', 
    tag: 'prompt-party-fcm',
    requireInteraction: false,
    silent: false,
    data: {
      gameId: payload.data?.gameId,
      type: payload.data?.type,
      url: payload.data?.url || '/',
      timestamp: Date.now()
    }
  };

  // Show notification
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks in FCM service worker
self.addEventListener('notificationclick', (event) => {
  console.log('[FCM SW] Notification clicked:', event);
  
  event.notification.close();

  // Handle the click
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // Focus existing window if available
      for (const client of clientList) {
        if (client.url.includes(self.location.origin)) {
          if (event.notification.data?.gameId) {
            client.navigate(urlToOpen);
          }
          return client.focus();
        }
      }
      
      // Open new window
      return self.clients.openWindow(urlToOpen);
    })
  );
});

console.log('[FCM SW] Firebase messaging service worker loaded');
