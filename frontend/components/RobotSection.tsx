"use client";

import { useEffect, useState, useRef } from "react";

const ROBOT_SCENE_URL =
  "https://prod.spline.design/PyzDhpQ9E5f1E3MT/scene.splinecode";

/**
 * Interactive 3D robot section for the home page.
 * Uses Spline iframe viewer for maximum compatibility.
 * Theme-aware: warm amber tint in light mode, cool blue in dark mode.
 */
export default function RobotSection() {
  const [isDark, setIsDark] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
    const obs = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => obs.disconnect();
  }, []);

  return (
    <section className="relative mx-auto max-w-5xl px-6 py-16 sm:py-24">
      {/* Section label */}
      <div className="mb-8 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-callum-muted">
          Meet Whobee
        </p>
        <h2
          className="mt-3 font-serif text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl"
          style={{
            background: isDark
              ? "linear-gradient(135deg, #c8d0ff, #8090ff)"
              : "linear-gradient(135deg, #fdba74, #f59e0b)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          Your AI news companion
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-callum-muted">
          Drag to interact. Whobee reads through thousands of articles so you
          get only what matters.
        </p>
      </div>

      {/* Robot container */}
      <div
        className="relative mx-auto overflow-hidden rounded-2xl"
        style={{
          height: "min(60vh, 500px)",
          maxWidth: 700,
          boxShadow: isDark
            ? "inset 0 0 80px rgba(80, 100, 255, 0.08), 0 0 60px rgba(80, 100, 255, 0.05)"
            : "inset 0 0 80px rgba(245, 158, 11, 0.1), 0 0 60px rgba(245, 158, 11, 0.06)",
          border: isDark
            ? "1px solid rgba(120, 140, 255, 0.1)"
            : "1px solid rgba(245, 158, 11, 0.15)",
          transition: "box-shadow 0.6s ease, border-color 0.6s ease",
        }}
      >
        {/* Theme color overlay */}
        <div
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            background: isDark
              ? "linear-gradient(135deg, rgba(60, 80, 200, 0.06), rgba(100, 60, 180, 0.04))"
              : "linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(234, 88, 12, 0.05))",
            mixBlendMode: "color",
            transition: "background 0.6s ease",
          }}
        />

        {/* Bottom fade */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-24"
          style={{
            background: isDark
              ? "linear-gradient(to top, #0d0d0d, transparent)"
              : "linear-gradient(to top, #0a0806, transparent)",
          }}
        />

        {/* Loading state */}
        <div
          className="absolute inset-0 z-20 flex items-center justify-center transition-opacity duration-700"
          style={{
            opacity: loaded ? 0 : 1,
            pointerEvents: loaded ? "none" : "auto",
          }}
        >
          <div className="flex items-center gap-3 text-callum-muted">
            <svg
              className="h-5 w-5 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l2-2.647z"
              />
            </svg>
            <span className="text-xs font-medium uppercase tracking-[0.15em]">
              Loading 3D scene...
            </span>
          </div>
        </div>

        {/* Spline 3D scene via iframe */}
        <iframe
          ref={iframeRef}
          src={`https://my.spline.design/PyzDhpQ9E5f1E3MT/`}
          frameBorder="0"
          width="100%"
          height="100%"
          className="absolute inset-0 z-0"
          style={{
            filter: isDark
              ? "saturate(0.85) hue-rotate(-10deg)"
              : "saturate(1.1) sepia(0.15) hue-rotate(15deg) brightness(0.95)",
            transition: "filter 0.6s ease",
          }}
          onLoad={() => setLoaded(true)}
          allow="autoplay"
        />
      </div>
    </section>
  );
}
