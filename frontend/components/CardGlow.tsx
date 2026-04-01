"use client";

import { useCallback, useRef, ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
}

/**
 * Wraps a card and adds a mouse-tracking radial gradient glow
 * that follows the cursor within the card (GitHub-style).
 */
export default function CardGlow({ children, className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = useCallback((e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    el.style.setProperty("--glow-x", `${x}%`);
    el.style.setProperty("--glow-y", `${y}%`);
    el.style.setProperty("--glow-opacity", "1");
  }, []);

  const onLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--glow-opacity", "0");
  }, []);

  return (
    <div
      ref={ref}
      className={`card-glow-wrap ${className}`}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={
        {
          position: "relative",
          "--glow-x": "50%",
          "--glow-y": "50%",
          "--glow-opacity": "0",
        } as React.CSSProperties
      }
    >
      {children}
      {/* Glow overlay */}
      <div
        className="card-glow-effect"
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "inherit",
          pointerEvents: "none",
          opacity: "var(--glow-opacity)" as any,
          transition: "opacity 0.4s ease",
          background:
            "radial-gradient(600px circle at var(--glow-x) var(--glow-y), var(--glow-color, rgba(120,140,255,0.07)), transparent 40%)",
          zIndex: 1,
        }}
      />
      {/* Border glow */}
      <div
        className="card-glow-border"
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "inherit",
          pointerEvents: "none",
          opacity: "var(--glow-opacity)" as any,
          transition: "opacity 0.4s ease",
          background:
            "radial-gradient(400px circle at var(--glow-x) var(--glow-y), var(--glow-border-color, rgba(120,140,255,0.15)), transparent 40%)",
          WebkitMask:
            "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          padding: 1,
          zIndex: 2,
        }}
      />
    </div>
  );
}
