"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Subtle custom cursor — small dot follows precisely,
 * outer ring trails with elastic easing. Ring grows on interactive elements.
 * Only on desktop (hidden on touch). Default cursor always stays visible.
 */
export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    // Skip on touch devices or small screens
    if (window.matchMedia("(hover: none)").matches) return;
    if (window.innerWidth < 768) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

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
      }
    };

    let rafId: number;
    const followRing = () => {
      ringX += (mouseX - ringX) * 0.1;
      ringY += (mouseY - ringY) * 0.1;
      ring.style.left = `${ringX}px`;
      ring.style.top = `${ringY}px`;
      rafId = requestAnimationFrame(followRing);
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
    rafId = requestAnimationFrame(followRing);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseover", onMouseOver);
      document.removeEventListener("mouseout", onMouseOut);
      cancelAnimationFrame(rafId);
    };
  }, [active]);

  return (
    <>
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
