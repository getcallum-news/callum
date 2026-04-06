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
  const containerRef = useRef<HTMLDivElement>(null);
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
        console.warn("Spline load error:", err);
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
      ref={containerRef}
      className="fixed z-[2]"
      style={{
        right: 0,
        bottom: 0,
        width: 500,
        height: 550,
        maxWidth: "45vw",
        maxHeight: "55vh",
        // Fade edges into background
        mask: "radial-gradient(ellipse 90% 85% at 70% 60%, black 40%, transparent 80%)",
        WebkitMask: "radial-gradient(ellipse 90% 85% at 70% 60%, black 40%, transparent 80%)",
        opacity: loaded ? 1 : 0,
        transition: "opacity 1.2s ease",
      }}
    >
      <canvas
        ref={canvasRef}
        width={500}
        height={550}
        style={{
          width: "100%",
          height: "100%",
          pointerEvents: "auto",
          filter: isDark
            ? "saturate(0.8) brightness(0.75) hue-rotate(-10deg)"
            : "saturate(0.9) brightness(0.65) sepia(0.2) hue-rotate(10deg)",
          transition: "filter 0.6s ease",
        }}
      />
    </div>
  );
}
