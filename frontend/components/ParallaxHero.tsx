"use client";

import { useEffect, useRef } from "react";

/**
 * Parallax wrapper for the hero section.
 * Text layers move at different speeds on scroll, creating depth.
 * The grain texture stays fixed while content shifts.
 */
export default function ParallaxHero({
  children,
}: {
  children: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const layersRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    let rafId: number;
    let lastScrollY = 0;

    const onScroll = () => {
      lastScrollY = window.scrollY;
    };

    const animate = () => {
      const container = containerRef.current;
      if (!container) {
        rafId = requestAnimationFrame(animate);
        return;
      }

      const layers = container.querySelectorAll<HTMLElement>("[data-parallax]");
      layers.forEach((layer) => {
        const speed = parseFloat(layer.dataset.parallax || "0.5");
        const yOffset = -(lastScrollY * speed);
        layer.style.transform = `translate3d(0, ${yOffset}px, 0)`;
      });

      rafId = requestAnimationFrame(animate);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    rafId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative overflow-hidden">
      {children}
    </div>
  );
}
