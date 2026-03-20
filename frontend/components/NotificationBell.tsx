"use client";

import { useEffect, useState } from "react";
import { subscribeToNotifications, unsubscribeFromNotifications } from "@/lib/api";
import { requestNotificationPermission } from "@/lib/firebase";

/**
 * Notification bell button in the header.
 *
 * Handles the full push notification subscription lifecycle:
 * 1. Check browser support
 * 2. Request permission
 * 3. Get FCM token + subscription info
 * 4. POST to /subscribe
 * 5. Persist state in localStorage
 *
 * Shows a tooltip if push notifications aren't supported.
 */

type SubscriptionState = "idle" | "subscribed" | "unsupported" | "denied";

export default function NotificationBell() {
  const [state, setState] = useState<SubscriptionState>("idle");
  const [showTooltip, setShowTooltip] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check saved state and browser support on mount
    if (typeof window === "undefined") return;

    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setState("unsupported");
      return;
    }

    if (Notification.permission === "denied") {
      setState("denied");
      return;
    }

    const saved = localStorage.getItem("callum-subscribed");
    if (saved === "true") {
      setState("subscribed");
    }
  }, []);

  const handleClick = async () => {
    if (state === "unsupported") {
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 3000);
      return;
    }

    if (state === "denied") {
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 3000);
      return;
    }

    setLoading(true);

    try {
      if (state === "subscribed") {
        // Unsubscribe
        const endpoint = localStorage.getItem("callum-push-endpoint");
        if (endpoint) {
          await unsubscribeFromNotifications(endpoint);
        }
        localStorage.removeItem("callum-subscribed");
        localStorage.removeItem("callum-push-endpoint");
        setState("idle");
      } else {
        // Subscribe
        const subscription = await requestNotificationPermission();

        if (!subscription) {
          setState("denied");
          return;
        }

        await subscribeToNotifications(subscription);
        localStorage.setItem("callum-subscribed", "true");
        localStorage.setItem("callum-push-endpoint", subscription.endpoint);
        setState("subscribed");
      }
    } catch (err) {
      console.error("Notification subscription error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={loading}
        className="p-2 opacity-70 transition-opacity hover:opacity-100 disabled:opacity-40"
        aria-label={
          state === "subscribed"
            ? "Unsubscribe from notifications"
            : "Subscribe to notifications"
        }
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill={state === "subscribed" ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute right-0 top-full mt-2 w-48 rounded-sm border border-[var(--border)] bg-[var(--bg)] p-3 text-xs text-callum-muted shadow-sm">
          {state === "unsupported"
            ? "Notifications are not supported in this browser"
            : "Notifications were blocked. Enable them in your browser settings."}
        </div>
      )}

      {/* Subscribed confirmation */}
      {state === "subscribed" && !loading && (
        <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-callum-accent" />
      )}
    </div>
  );
}
