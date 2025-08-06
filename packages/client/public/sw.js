// Service Worker for handling push notifications

self.addEventListener('install', (event) => {
  console.log('Service Worker installing');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating');
  event.waitUntil(self.clients.claim());
});

// Handle push events
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);
  
  if (!event.data) {
    console.log('Push event has no data');
    return;
  }

  try {
    const data = event.data.json();
    console.log('Push data:', data);

    const options = {
      body: data.body || 'You have a new notification',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: data.tag || 'default',
      data: data.data || {},
      requireInteraction: false,
      silent: false,
      actions: data.actions || []
    };

    event.waitUntil(
      self.registration.showNotification(
        data.title || 'Whisper Comment',
        options
      )
    );
  } catch (error) {
    console.error('Error parsing push data:', error);
    
    // Fallback notification
    event.waitUntil(
      self.registration.showNotification(
        'Whisper Comment',
        {
          body: 'You have a new notification',
          icon: '/favicon.ico',
          badge: '/favicon.ico'
        }
      )
    );
  }
});

// Handle notification click events
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  // Handle action clicks
  if (event.action) {
    console.log('Action clicked:', event.action);
    // Handle specific actions if needed
    return;
  }

  // Default click behavior - focus or open the app
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      // Check if there's already a window/tab open
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If no window is open, open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});

// Handle notification close events
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event);
  // Track notification dismissal if needed
});

// Handle background sync (optional, for offline support)
self.addEventListener('sync', (event) => {
  console.log('Background sync:', event);
  // Handle background sync if needed
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  console.log('Message received in SW:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});