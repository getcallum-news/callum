"use client";

import { useRef, useCallback } from "react";

/**
 * Magnetic button effect — element subtly pulls toward cursor
 * when hovering nearby, snaps back on leave.
 */
export default function MagneticButton({
  children,
  className = "",
  as: Component = "div",
  strength = 0.3,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  strength?: number;
  [key: string]: unknown;
}) {
  const ref = useRef<HTMLElement>(null);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const el = ref.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = (e.clientX - centerX) * strength;
      const deltaY = (e.clientY - centerY) * strength;

      el.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    },
    [strength]
  );

  const handleMouseLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "translate(0px, 0px)";
  }, []);

  return (
    <Component
      ref={ref}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transition: "transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
        willChange: "transform",
      }}
      {...props}
    >
      {children}
    </Component>
  );
}
