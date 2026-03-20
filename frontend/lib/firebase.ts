/**
 * Firebase Cloud Messaging setup.
 *
 * Initializes Firebase and provides a function to request notification
 * permission + get the push subscription details needed for the backend.
 */

import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/** Get or initialize the Firebase app (singleton). */
function getFirebaseApp() {
  if (getApps().length === 0) {
    return initializeApp(firebaseConfig);
  }
  return getApps()[0];
}

/**
 * Request notification permission and return subscription info.
 *
 * Returns the subscription details needed for the backend's /subscribe
 * endpoint, or null if permission was denied or something went wrong.
 */
export async function requestNotificationPermission(): Promise<{
  endpoint: string;
  p256dh: string;
  auth: string;
} | null> {
  try {
    // Ask the user for permission
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return null;
    }

    // Register the service worker
    const registration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js"
    );

    // Initialize Firebase messaging
    const app = getFirebaseApp();
    const messaging = getMessaging(app);

    // Get the FCM token — this also sets up the push subscription
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_KEY;
    await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    // Get the underlying PushSubscription from the service worker
    const pushSubscription = await registration.pushManager.getSubscription();
    if (!pushSubscription) {
      return null;
    }

    // Extract the keys we need for Web Push
    const p256dhKey = pushSubscription.getKey("p256dh");
    const authKey = pushSubscription.getKey("auth");

    if (!p256dhKey || !authKey) {
      return null;
    }

    // Convert ArrayBuffer keys to base64url strings
    const p256dh = btoa(
      String.fromCharCode(...new Uint8Array(p256dhKey))
    );
    const auth = btoa(
      String.fromCharCode(...new Uint8Array(authKey))
    );

    return {
      endpoint: pushSubscription.endpoint,
      p256dh,
      auth,
    };
  } catch (error) {
    console.error("Failed to set up push notifications:", error);
    return null;
  }
}
