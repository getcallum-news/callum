"use client";

import { useEffect, useRef, useCallback, ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
  /** Max displacement in px */
  strength?: number;
  /** Radius of influence in px */
  radius?: number;
}

/**
 * Wraps text and splits it into individual letters that
 * repel away from the cursor, creating a magnetic field effect.
 */
export default function MagneticText({
  children,
  className = "",
  strength = 18,
  radius = 150,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lettersRef = useRef<HTMLSpanElement[]>([]);
  const rectsRef = useRef<DOMRect[]>([]);
  const rafRef = useRef<number>(0);
  const mouseRef = useRef({ x: -9999, y: -9999 });

  // Cache letter positions
  const cachePositions = useCallback(() => {
    rectsRef.current = lettersRef.current.map((el) =>
      el.getBoundingClientRect()
    );
  }, []);

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) return;

    const container = containerRef.current;
    if (!container) return;

    lettersRef.current = Array.from(
      container.querySelectorAll<HTMLSpanElement>("[data-magnetic]")
    );

    cachePositions();
    window.addEventListener("resize", cachePositions);
    window.addEventListener("scroll", cachePositions, { passive: true });

    const onMouse = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    const onLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 };
    };
    window.addEventListener("mousemove", onMouse, { passive: true });
    window.addEventListener("mouseleave", onLeave);

    function animate() {
      const { x: mx, y: my } = mouseRef.current;
      const letters = lettersRef.current;
      const rects = rectsRef.current;

      for (let i = 0; i < letters.length; i++) {
        const rect = rects[i];
        if (!rect) continue;
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = cx - mx;
        const dy = cy - my;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < radius) {
          const force = (1 - dist / radius) ** 2;
          const moveX = (dx / dist) * force * strength;
          const moveY = (dy / dist) * force * strength;
          letters[i].style.transform = `translate(${moveX}px, ${moveY}px)`;
        } else {
          letters[i].style.transform = "translate(0, 0)";
        }
      }
      rafRef.current = requestAnimationFrame(animate);
    }

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("resize", cachePositions);
      window.removeEventListener("scroll", cachePositions);
    };
  }, [cachePositions, radius, strength]);

  function splitNode(node: ReactNode): ReactNode {
    if (typeof node === "string") {
      return node.split("").map((char, i) =>
        char === " " ? (
          <span key={i}>&nbsp;</span>
        ) : (
          <span
            key={i}
            data-magnetic
            style={{
              display: "inline-block",
              transition: "transform 0.25s cubic-bezier(0.22, 1, 0.36, 1)",
              willChange: "transform",
            }}
          >
            {char}
          </span>
        )
      );
    }
    if (Array.isArray(node)) {
      return node.map((child, i) => (
        <span key={i}>{splitNode(child)}</span>
      ));
    }
    if (
      node &&
      typeof node === "object" &&
      "props" in node &&
      node.props?.children
    ) {
      const { children: inner, ...restProps } = node.props;
      return { ...node, props: { ...restProps, children: splitNode(inner) } };
    }
    return node;
  }

  return (
    <div ref={containerRef} className={className}>
      {splitNode(children)}
    </div>
  );
}
