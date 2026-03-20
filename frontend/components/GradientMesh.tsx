"use client";

import { useEffect, useState } from "react";

/**
 * Animated gradient mesh background for the hero section.
 * Renders different color palettes for dark/light mode.
 * Uses CSS animations for smooth, slow-moving gradients.
 */
export default function GradientMesh() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));

    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>
      {/* Primary mesh layer — slow drift */}
      <div
        className="absolute inset-0"
        style={{
          background: isDark
            ? `
              radial-gradient(ellipse at 20% 50%, rgba(60,40,140,0.25) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 20%, rgba(30,80,160,0.2) 0%, transparent 50%),
              radial-gradient(ellipse at 50% 80%, rgba(100,40,120,0.15) 0%, transparent 50%),
              radial-gradient(ellipse at 70% 60%, rgba(20,100,120,0.12) 0%, transparent 40%)
            `
            : `
              radial-gradient(ellipse at 25% 40%, rgba(220,180,100,0.18) 0%, transparent 50%),
              radial-gradient(ellipse at 75% 30%, rgba(240,190,130,0.14) 0%, transparent 50%),
              radial-gradient(ellipse at 50% 75%, rgba(200,160,100,0.1) 0%, transparent 45%),
              radial-gradient(ellipse at 30% 70%, rgba(180,200,160,0.07) 0%, transparent 40%)
            `,
          animation: "meshDrift 14s ease-in-out infinite alternate",
          transition: "background 0.6s ease",
        }}
      />

      {/* Secondary mesh layer — counter drift for depth */}
      <div
        className="absolute inset-0"
        style={{
          background: isDark
            ? `
              radial-gradient(ellipse at 60% 30%, rgba(80,60,180,0.12) 0%, transparent 45%),
              radial-gradient(ellipse at 30% 70%, rgba(40,120,180,0.1) 0%, transparent 40%)
            `
            : `
              radial-gradient(ellipse at 60% 25%, rgba(210,170,90,0.08) 0%, transparent 45%),
              radial-gradient(ellipse at 40% 65%, rgba(190,150,80,0.06) 0%, transparent 40%)
            `,
          animation: "meshDriftReverse 18s ease-in-out infinite alternate",
          transition: "background 0.6s ease",
        }}
      />

      {/* Soft vignette for depth */}
      <div
        className="absolute inset-0"
        style={{
          background: isDark
            ? "radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(13,13,13,0.6) 100%)"
            : "radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(240,236,228,0.5) 100%)",
          transition: "background 0.6s ease",
        }}
      />
    </div>
  );
}
