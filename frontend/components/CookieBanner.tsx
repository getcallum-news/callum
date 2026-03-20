"use client";

import { useEffect, useState } from "react";

/**
 * Minimal privacy banner — slides up smoothly on first visit.
 * Dismissed permanently. No dark patterns, no cookie wall.
 */
export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("callum-banner-dismissed");
    if (!dismissed) {
      // Slight delay so it doesn't compete with page load animations
      const timer = setTimeout(() => setVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem("callum-banner-dismissed", "true");
    setVisible(false);
  };

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] bg-[var(--bg)] transition-all duration-700 ${
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-full opacity-0 pointer-events-none"
      }`}
    >
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-6 px-6 py-5">
        <p className="text-[11px] leading-relaxed tracking-wide text-callum-muted">
          Callum uses no tracking cookies. We only store your notification
          preference if you subscribe.
        </p>
        <button
          onClick={dismiss}
          className="shrink-0 border border-[var(--border)] px-5 py-2 text-[10px] font-medium uppercase tracking-[0.15em] transition-all duration-300 hover:bg-[var(--text-primary)] hover:text-[var(--bg)]"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
