/**
 * Firebase Cloud Messaging service worker.
 *
 * Handles push notifications when the app is in the background
 * (tab not focused or browser minimized). When the user clicks a
 * notification, it opens the app.
 */

/* eslint-disable no-undef */
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

// Firebase config is injected at build time via env vars.
// For the service worker, we initialize with minimal config —
// the messaging sender ID is the only required field.
firebase.initializeApp({
  apiKey: "placeholder",
  projectId: "placeholder",
  messagingSenderId: "placeholder",
  appId: "placeholder",
});

const messaging = firebase.messaging();

// Handle background messages (when app is not focused)
messaging.onBackgroundMessage((payload) => {
  const data = payload.data || {};
  const title = data.title || "Callum — New AI News";
  const options = {
    body: data.body || "New articles just arrived.",
    icon: data.icon || "/icon-192.png",
    data: {
      url: data.url || "/",
    },
  };

  self.registration.showNotification(title, options);
});

// Open the app when user clicks the notification
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const rawUrl = event.notification.data?.url || "/";
  // Validate URL to prevent open redirect — only allow same-origin or relative paths
  const safeUrl = rawUrl.startsWith("/") || rawUrl.startsWith(self.location.origin)
    ? rawUrl
    : "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        // If the app is already open, focus it
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            return client.focus();
          }
        }
        // Otherwise, open a new window
        return clients.openWindow(safeUrl);
      })
  );
});
