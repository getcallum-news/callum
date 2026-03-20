"use client";

import { useCallback, useRef } from "react";

/**
 * Wrapper that adds a material-design-style ripple effect on click.
 * Works with any child element — buttons, links, divs.
 */

interface RippleButtonProps {
  children: React.ReactNode;
  className?: string;
}

export default function RippleButton({
  children,
  className = "",
}: RippleButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = containerRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const ripple = document.createElement("span");
    ripple.className = "ripple-effect";
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;

    el.appendChild(ripple);

    ripple.addEventListener("animationend", () => {
      ripple.remove();
    });
  }, []);

  return (
    <div
      ref={containerRef}
      className={`ripple-container ${className}`}
      onClick={handleClick}
    >
      {children}
    </div>
  );
}
