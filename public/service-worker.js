// JustMechanic Service Worker for Push Notifications
const CACHE_NAME = 'justmechanic-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache');
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');

  let notificationData = {
    title: 'JustMechanic',
    body: 'You have a new notification',
    icon: '/icon-192.png',
    badge: '/icon-72.png',
    tag: 'default',
    requireInteraction: false,
  };

  // Parse notification data if available
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || notificationData.title,
        body: data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        tag: data.tag || notificationData.tag,
        requireInteraction: data.requireInteraction || notificationData.requireInteraction,
        data: data.data || {},
        actions: data.actions || [],
        vibrate: data.vibrate || [200, 100, 200],
      };
    } catch (error) {
      console.error('Error parsing notification data:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      data: notificationData.data,
      actions: notificationData.actions,
      vibrate: notificationData.vibrate,
    })
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');

  event.notification.close();

  // Handle notification action clicks
  if (event.action) {
    console.log('Action clicked:', event.action);
    // Handle specific actions here
  }

  // Open or focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url === self.registration.scope && 'focus' in client) {
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Background sync event (for offline functionality)
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync');
  
  if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  }
});

async function syncMessages() {
  // Sync offline messages when connection is restored
  console.log('Syncing offline messages...');
  // Implementation would go here
}

// Message event (for communication with main app)
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  // Send test notification
  if (event.data && event.data.type === 'TEST_NOTIFICATION') {
    self.registration.showNotification('Test Notification', {
      body: 'This is a test notification from JustMechanic',
      icon: '/icon-192.png',
      badge: '/icon-72.png',
      vibrate: [200, 100, 200],
    });
  }
});

console.log('Service Worker: Loaded');
