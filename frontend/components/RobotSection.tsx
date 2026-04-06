"use client";

import { useEffect, useRef, useState } from "react";

const ROBOT_SCENE_URL =
  "https://prod.spline.design/PyzDhpQ9E5f1E3MT/scene.splinecode";

/**
 * Fixed 3D interactive robot in the bottom-right corner.
 * Uses Spline Viewer web component for reliable embedding
 * without WebGL context conflicts.
 * Theme-aware filter tinting for dark/light mode.
 */
export default function RobotSection() {
  const containerRef = useRef<HTMLDivElement>(null);
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

  // Load spline-viewer web component and detect when scene loads
  useEffect(() => {
    // Load the Spline viewer script
    const script = document.createElement("script");
    script.type = "module";
    script.src = "https://unpkg.com/@splinetool/viewer@1.9.82/build/spline-viewer.js";
    document.head.appendChild(script);

    // Watch for the spline-viewer to finish loading
    const container = containerRef.current;
    if (!container) return;

    const checkLoaded = () => {
      const viewer = container.querySelector("spline-viewer");
      if (viewer?.shadowRoot?.querySelector("canvas")) {
        setLoaded(true);
        return true;
      }
      return false;
    };

    // Poll briefly for the canvas to appear inside shadow DOM
    const interval = setInterval(() => {
      if (checkLoaded()) clearInterval(interval);
    }, 500);

    // Give up after 15s and show anyway
    const timeout = setTimeout(() => {
      clearInterval(interval);
      setLoaded(true);
    }, 15000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
      script.remove();
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
      {/* @ts-expect-error - spline-viewer is a web component */}
      <spline-viewer
        url={ROBOT_SCENE_URL}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          filter: isDark
            ? "saturate(0.8) brightness(0.75) hue-rotate(-10deg)"
            : "saturate(0.9) brightness(0.65) sepia(0.2) hue-rotate(10deg)",
          transition: "filter 0.6s ease",
        }}
      />
    </div>
  );
}
