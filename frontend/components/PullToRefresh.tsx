"use client";

import { useRef, useState, useCallback, useEffect } from "react";

/**
 * Elastic pull-to-refresh for mobile.
 * Dragging down stretches the page with an elastic feel,
 * shows a spinner, then snaps back and refreshes.
 */
export default function PullToRefresh({
  onRefresh,
  children,
}: {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const startY = useRef(0);
  const currentY = useRef(0);

  const threshold = 80;
  const maxPull = 140;
  const elasticFactor = 0.4;

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (window.scrollY > 5 || isRefreshing) return;
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    },
    [isRefreshing]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isPulling || isRefreshing) return;

      currentY.current = e.touches[0].clientY;
      const diff = currentY.current - startY.current;

      if (diff > 0 && window.scrollY <= 0) {
        // Elastic resistance — gets harder to pull the further you go
        const distance = Math.min(diff * elasticFactor, maxPull);
        setPullDistance(distance);
      }
    },
    [isPulling, isRefreshing]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;
    setIsPulling(false);

    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      setPullDistance(threshold * 0.6);

      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [isPulling, pullDistance, onRefresh]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: true });
    el.addEventListener("touchend", handleTouchEnd);

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const progress = Math.min(pullDistance / threshold, 1);

  return (
    <div ref={containerRef} className="relative">
      {/* Pull indicator */}
      <div
        aria-hidden={pullDistance === 0}
        className="pointer-events-none absolute left-0 right-0 top-0 z-10 flex items-center justify-center overflow-hidden"
        style={{
          height: pullDistance > 0 ? `${pullDistance}px` : "0px",
          opacity: pullDistance > 0 ? 1 : 0,
          transition: isPulling ? "none" : "height 0.4s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.3s ease",
        }}
      >
        <div
          className="flex flex-col items-center gap-2"
          style={{
            opacity: progress,
            transform: `scale(${0.5 + progress * 0.5})`,
            transition: isPulling ? "none" : "all 0.3s ease",
          }}
        >
          {/* Rotating arrow / spinner */}
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-callum-muted"
            style={{
              transform: isRefreshing
                ? "rotate(360deg)"
                : `rotate(${progress * 180}deg)`,
              transition: isRefreshing
                ? "transform 0.8s linear infinite"
                : isPulling
                ? "none"
                : "transform 0.3s ease",
              animation: isRefreshing ? "spin 0.8s linear infinite" : "none",
            }}
          >
            {isRefreshing ? (
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            ) : (
              <path d="M12 5v14M5 12l7 7 7-7" />
            )}
          </svg>

          <span className="text-[10px] uppercase tracking-[0.2em] text-callum-muted">
            {isRefreshing
              ? "Refreshing"
              : progress >= 1
              ? "Release"
              : "Pull to refresh"}
          </span>
        </div>
      </div>

      {/* Content with elastic translation */}
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isPulling
            ? "none"
            : "transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
