// Custom Service Worker for Push Notifications
// This file extends the next-pwa generated service worker

self.addEventListener('push', (event) => {
  if (!event.data) return

  try {
    const data = event.data.json()

    const options = {
      body: data.body || '',
      icon: data.icon || '/icons/icon-192x192.svg',
      badge: '/icons/icon-192x192.svg',
      tag: data.tag || 'default',
      data: {
        url: data.url || '/',
        ...data.data,
      },
      requireInteraction: data.requireInteraction || false,
      actions: data.actions || [],
      vibrate: [100, 50, 100],
    }

    event.waitUntil(
      self.registration.showNotification(data.title || 'Hagu', options)
    )
  } catch (error) {
    console.error('Error processing push notification:', error)
  }
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const url = event.notification.data?.url || '/'

  // Handle action clicks
  if (event.action) {
    switch (event.action) {
      case 'complete':
        // Handle habit/task completion action
        event.waitUntil(
          clients.matchAll({ type: 'window' }).then((clientList) => {
            // Post message to client to handle completion
            clientList.forEach((client) => {
              client.postMessage({
                type: 'NOTIFICATION_ACTION',
                action: 'complete',
                data: event.notification.data,
              })
            })
          })
        )
        return
      case 'snooze':
        // Handle snooze action (could schedule another notification)
        return
      case 'dismiss':
        // Just close the notification
        return
    }
  }

  // Default: open or focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window/tab open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus()
          if (url !== '/') {
            client.navigate(url)
          }
          return
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )
})

// Handle push subscription change
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    self.registration.pushManager
      .subscribe({
        userVisibleOnly: true,
        applicationServerKey: self.VAPID_PUBLIC_KEY,
      })
      .then((subscription) => {
        // Send new subscription to server
        return fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscription),
        })
      })
  )
})
