"use client";

import { useEffect, useRef, useState } from "react";

const ROBOT_SCENE_URL =
  "https://prod.spline.design/PyzDhpQ9E5f1E3MT/scene.splinecode";

/**
 * Fixed 3D interactive robot in the bottom-right corner.
 * Uses Spline runtime directly to avoid React wrapper issues.
 * Theme-aware filter tinting for dark/light mode.
 */
export default function RobotSection() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<any>(null);
  const [isDark, setIsDark] = useState(true);
  const [loaded, setLoaded] = useState(false);

  // Track theme
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

  // Load Spline scene via runtime
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let cancelled = false;

    (async () => {
      try {
        const { Application } = await import("@splinetool/runtime");
        if (cancelled) return;

        const app = new Application(canvas);
        appRef.current = app;
        await app.load(ROBOT_SCENE_URL);

        if (!cancelled) {
          setLoaded(true);
        }
      } catch (err) {
        console.warn("Spline failed to load:", err);
      }
    })();

    return () => {
      cancelled = true;
      if (appRef.current) {
        try { appRef.current.dispose(); } catch {}
        appRef.current = null;
      }
    };
  }, []);

  return (
    <div
      className="pointer-events-none fixed z-[1]"
      style={{
        right: 0,
        bottom: 0,
        width: "min(45vw, 500px)",
        height: "min(55vh, 550px)",
        // Fade edges into background
        mask: "radial-gradient(ellipse 85% 80% at 75% 65%, black 30%, transparent 75%)",
        WebkitMask: "radial-gradient(ellipse 85% 80% at 75% 65%, black 30%, transparent 75%)",
        opacity: loaded ? 1 : 0,
        transition: "opacity 1.2s ease",
      }}
    >
      <canvas
        ref={canvasRef}
        className="pointer-events-auto"
        style={{
          width: "100%",
          height: "100%",
          filter: isDark
            ? "saturate(0.7) brightness(0.6) hue-rotate(-15deg)"
            : "saturate(0.9) brightness(0.55) sepia(0.25) hue-rotate(15deg)",
          transition: "filter 0.6s ease",
        }}
      />
    </div>
  );
}
