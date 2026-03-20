"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Subtle animated starry night sky for dark mode.
 * Stars twinkle gently, with occasional shooting stars.
 * Only renders in dark mode. Loaded with ssr: false.
 */

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  twinkleDuration: number;
  twinkleDelay: number;
}

interface ShootingStar {
  id: number;
  startX: number;
  startY: number;
  angle: number;
  length: number;
  duration: number;
}

function generateStars(count: number): Star[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 0.5 + Math.random() * 1.8,
    opacity: 0.15 + Math.random() * 0.5,
    twinkleDuration: 3 + Math.random() * 5,
    twinkleDelay: Math.random() * 8,
  }));
}

const STARS = generateStars(120);

export default function StarryNight() {
  const [isDark, setIsDark] = useState(
    () => document.documentElement.classList.contains("dark")
  );
  const [shootingStar, setShootingStar] = useState<ShootingStar | null>(null);
  const shootingIdRef = useRef(0);

  // Watch for theme changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // Occasional shooting stars
  useEffect(() => {
    if (!isDark) return;

    let intervalId: ReturnType<typeof setInterval>;

    const spawnShootingStar = () => {
      shootingIdRef.current += 1;
      setShootingStar({
        id: shootingIdRef.current,
        startX: 10 + Math.random() * 60,
        startY: 5 + Math.random() * 30,
        angle: 25 + Math.random() * 20,
        length: 80 + Math.random() * 120,
        duration: 0.6 + Math.random() * 0.4,
      });

      setTimeout(() => setShootingStar(null), 1500);
    };

    const firstTimeout = setTimeout(() => {
      spawnShootingStar();
      intervalId = setInterval(spawnShootingStar, 8000 + Math.random() * 12000);
    }, 5000 + Math.random() * 5000);

    return () => {
      clearTimeout(firstTimeout);
      if (intervalId) clearInterval(intervalId);
    };
  }, [isDark]);

  if (!isDark) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
    >
      {/* Static + twinkling stars */}
      <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <defs>
          <filter id="star-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="0.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {STARS.map((star) => (
          <circle
            key={star.id}
            cx={`${star.x}%`}
            cy={`${star.y}%`}
            r={star.size}
            fill="white"
            filter={star.size > 1.2 ? "url(#star-glow)" : undefined}
            style={{
              opacity: star.opacity,
              animation: `twinkle ${star.twinkleDuration}s ease-in-out ${star.twinkleDelay}s infinite`,
            }}
          />
        ))}
      </svg>

      {/* Shooting star */}
      {shootingStar && (
        <div
          key={shootingStar.id}
          className="absolute"
          style={{
            left: `${shootingStar.startX}%`,
            top: `${shootingStar.startY}%`,
            width: shootingStar.length,
            height: 1,
            transform: `rotate(${shootingStar.angle}deg)`,
            transformOrigin: "0 0",
            background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.7) 30%, white 100%)`,
            opacity: 0,
            animation: `shooting-star ${shootingStar.duration}s ease-out forwards`,
          }}
        />
      )}

      {/* Very subtle nebula-like gradient patches */}
      <div
        className="absolute"
        style={{
          top: "5%",
          right: "10%",
          width: "30vw",
          height: "25vh",
          background: "radial-gradient(ellipse, rgba(80,60,140,0.04) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      <div
        className="absolute"
        style={{
          top: "40%",
          left: "5%",
          width: "25vw",
          height: "20vh",
          background: "radial-gradient(ellipse, rgba(40,80,140,0.03) 0%, transparent 70%)",
          filter: "blur(50px)",
        }}
      />
    </div>
  );
}
