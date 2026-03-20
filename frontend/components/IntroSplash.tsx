"use client";

import { useEffect, useState } from "react";

/**
 * Full-screen splash — three logo lines draw in sequentially,
 * wordmark fades in, then the entire overlay fades out.
 * Only shows on first visit per session. Fast and snappy.
 */
export default function IntroSplash() {
  const [show, setShow] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const seen = sessionStorage.getItem("callum-intro-seen");
    if (!seen) {
      setShow(true);
      // Start fade out after animations finish
      const timer = setTimeout(() => {
        setFadeOut(true);
        sessionStorage.setItem("callum-intro-seen", "true");
      }, 1600);
      // Remove from DOM
      const removeTimer = setTimeout(() => setShow(false), 2200);
      return () => {
        clearTimeout(timer);
        clearTimeout(removeTimer);
      };
    }
  }, []);

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-[var(--bg)] transition-opacity duration-500 ${
        fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center gap-5">
        {/* Animated logo lines */}
        <div className="flex flex-col items-center gap-[5px]">
          <div
            className="h-[2px] bg-[var(--text-primary)]"
            style={{
              animation: "introLogoLine1 0.4s cubic-bezier(0.22,1,0.36,1) 0.15s forwards",
              width: 0,
            }}
          />
          <div
            className="h-[2px] bg-[var(--text-primary)]"
            style={{
              animation: "introLogoLine2 0.35s cubic-bezier(0.22,1,0.36,1) 0.35s forwards",
              width: 0,
            }}
          />
          <div
            className="h-[2px] bg-[var(--text-primary)]"
            style={{
              animation: "introLogoLine3 0.3s cubic-bezier(0.22,1,0.36,1) 0.55s forwards",
              width: 0,
            }}
          />
        </div>

        {/* Wordmark */}
        <p
          className="font-serif text-2xl font-semibold tracking-[0.5em]"
          style={{
            animation: "introWordmark 0.7s cubic-bezier(0.22,1,0.36,1) 0.8s forwards",
            opacity: 0,
            letterSpacing: "0.5em",
          }}
        >
          Callum
        </p>
      </div>
    </div>
  );
}
