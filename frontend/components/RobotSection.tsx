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
    const container = containerRef.current;
    if (!canvas || !container) return;

    let cancelled = false;

    // Wait a frame so the container has layout dimensions
    requestAnimationFrame(() => {
      if (cancelled) return;
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const w = Math.round(rect.width * dpr);
      const h = Math.round(rect.height * dpr);
      if (w === 0 || h === 0) return;
      canvas.width = w;
      canvas.height = h;

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
    });

    const onResize = () => {
      const r = container.getBoundingClientRect();
      const d = window.devicePixelRatio || 1;
      canvas.width = Math.round(r.width * d);
      canvas.height = Math.round(r.height * d);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
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
        width: "min(45vw, 500px)",
        height: "min(55vh, 550px)",
        // Fade edges into background
        mask: "radial-gradient(ellipse 90% 85% at 70% 60%, black 40%, transparent 80%)",
        WebkitMask: "radial-gradient(ellipse 90% 85% at 70% 60%, black 40%, transparent 80%)",
        opacity: loaded ? 1 : 0,
        transition: "opacity 1.2s ease",
      }}
    >
      <canvas
        ref={canvasRef}
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
