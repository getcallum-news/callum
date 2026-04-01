"use client";

import { useEffect, useRef, useState } from "react";

const TRAIL_LENGTH = 24;
const TRAIL_FADE_SPEED = 0.06;

/**
 * Custom cursor with elastic ring + glowing particle trail.
 * Trail is rendered on a <canvas> for zero-layout-thrash performance.
 */
export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const trailCanvasRef = useRef<HTMLCanvasElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(hover: none)").matches) return;
    if (window.innerWidth < 768) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    const canvas = trailCanvasRef.current;
    if (!dot || !ring || !canvas) return;

    const ctx = canvas.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio, 2);

    function resizeCanvas() {
      canvas!.width = window.innerWidth * dpr;
      canvas!.height = window.innerHeight * dpr;
      canvas!.style.width = window.innerWidth + "px";
      canvas!.style.height = window.innerHeight + "px";
      ctx.scale(dpr, dpr);
    }
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Trail buffer
    const trail: { x: number; y: number; alpha: number }[] = [];
    for (let i = 0; i < TRAIL_LENGTH; i++) {
      trail.push({ x: -100, y: -100, alpha: 0 });
    }

    let mouseX = -100;
    let mouseY = -100;
    let ringX = -100;
    let ringY = -100;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.left = `${mouseX}px`;
      dot.style.top = `${mouseY}px`;

      if (!active) {
        setActive(true);
        ringX = mouseX;
        ringY = mouseY;
        for (const p of trail) {
          p.x = mouseX;
          p.y = mouseY;
        }
      }
    };

    // Detect theme
    let isDark = document.documentElement.classList.contains("dark");
    const observer = new MutationObserver(() => {
      isDark = document.documentElement.classList.contains("dark");
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    let rafId: number;
    const animate = () => {
      // Ring follow
      ringX += (mouseX - ringX) * 0.1;
      ringY += (mouseY - ringY) * 0.1;
      ring.style.left = `${ringX}px`;
      ring.style.top = `${ringY}px`;

      // Update trail — shift and add new point
      for (let i = trail.length - 1; i > 0; i--) {
        trail[i].x = trail[i - 1].x;
        trail[i].y = trail[i - 1].y;
        trail[i].alpha = trail[i - 1].alpha * (1 - TRAIL_FADE_SPEED);
      }
      trail[0].x = mouseX;
      trail[0].y = mouseY;
      trail[0].alpha = 0.5;

      // Draw trail
      ctx.clearRect(0, 0, canvas!.width / dpr, canvas!.height / dpr);

      for (let i = trail.length - 1; i >= 1; i--) {
        const p = trail[i];
        if (p.alpha < 0.01) continue;

        const size = 3 * (1 - i / trail.length);
        const color = isDark
          ? `rgba(180, 190, 255, ${p.alpha})`
          : `rgba(120, 90, 50, ${p.alpha})`;
        const glow = isDark
          ? `rgba(120, 140, 255, ${p.alpha * 0.5})`
          : `rgba(180, 140, 60, ${p.alpha * 0.3})`;

        // Outer glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, size + 6, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      }

      rafId = requestAnimationFrame(animate);
    };

    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.closest("a") ||
        target.closest("button") ||
        target.closest("[role='button']")
      ) {
        ring.classList.add("hovering");
      }
    };

    const onMouseOut = () => {
      ring.classList.remove("hovering");
    };

    window.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseover", onMouseOver);
    document.addEventListener("mouseout", onMouseOut);
    rafId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseover", onMouseOver);
      document.removeEventListener("mouseout", onMouseOut);
      window.removeEventListener("resize", resizeCanvas);
      observer.disconnect();
      cancelAnimationFrame(rafId);
    };
  }, [active]);

  return (
    <>
      {/* Trail canvas */}
      <canvas
        ref={trailCanvasRef}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9997,
          pointerEvents: "none",
          opacity: active ? 1 : 0,
        }}
      />
      <div
        ref={dotRef}
        className="cursor-dot"
        style={{ opacity: active ? 1 : 0 }}
      />
      <div
        ref={ringRef}
        className="cursor-ring"
        style={{ opacity: active ? 0.3 : 0 }}
      />
    </>
  );
}
