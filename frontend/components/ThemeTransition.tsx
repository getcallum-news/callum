"use client";

import { useEffect, useRef, useState } from "react";

interface ThemeTransitionProps {
  toLight: boolean;
  onComplete: () => void;
}

/**
 * Full-screen cinematic theme transition.
 *
 * The trick to a seamless switch: the overlay's final color before
 * fading matches the destination theme's background exactly. The
 * theme switches underneath while the overlay is fully opaque at
 * that matching color — so the fade-out is invisible.
 *
 * Sunrise: dark → warm glow → sun rises → overlay turns #f0ece4 →
 *   theme switches to light underneath → overlay fades out (same color = invisible).
 *
 * Moonrise: light → deep blue → moon + stars → overlay turns #0d0d0d →
 *   theme switches to dark underneath → overlay fades out (same color = invisible).
 */
export default function ThemeTransition({ toLight, onComplete }: ThemeTransitionProps) {
  const [phase, setPhase] = useState(0);
  // phase 0: mount
  // phase 1: animation plays (sun/moon + sky)
  // phase 2: overlay matches destination color, theme switches underneath
  // phase 3: overlay fades out (seamless because colors match)
  const hasCompleted = useRef(false);
  const themeSwitched = useRef(false);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 30);
    const t2 = setTimeout(() => setPhase(2), 800);
    const t3 = setTimeout(() => setPhase(3), 1100);
    const t4 = setTimeout(() => {
      if (!hasCompleted.current) {
        hasCompleted.current = true;
        onComplete();
      }
    }, 1700);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [onComplete]);

  // Switch theme at phase 2 — overlay is fully opaque and matches destination
  useEffect(() => {
    if (phase >= 2 && !themeSwitched.current) {
      themeSwitched.current = true;
      if (toLight) {
        document.documentElement.classList.remove("dark");
        document.documentElement.classList.add("light");
        localStorage.setItem("callum-theme", "light");
      } else {
        document.documentElement.classList.remove("light");
        document.documentElement.classList.add("dark");
        localStorage.setItem("callum-theme", "dark");
      }
    }
  }, [phase, toLight]);

  const starsRef = useRef(
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 60 + 5,
      size: 1 + Math.random() * 2,
      delay: Math.random() * 0.4,
      twinkle: 2 + Math.random() * 3,
    }))
  );

  if (toLight) {
    // ─── SUNRISE ───
    // Phase 0: solid dark
    // Phase 1: warm sky + sun rising
    // Phase 2: solid #f0ece4 (matches light theme bg) — theme switches now
    // Phase 3: fade out overlay
    return (
      <div
        className="fixed inset-0 z-[9998] overflow-hidden"
        style={{
          opacity: phase >= 3 ? 0 : 1,
          transition: "opacity 0.6s ease",
          pointerEvents: phase >= 3 ? "none" : "auto",
        }}
      >
        {/* Sky background — transitions through warm tones to solid white */}
        <div
          className="absolute inset-0"
          style={{
            background:
              phase === 0 ? "#0d0d0d"
              : phase === 1 ? "linear-gradient(to top, #ff9e57 0%, #ffc87a 30%, #ffecd2 60%, #f0ece4 100%)"
              : "#f0ece4",
            transition: phase === 1
              ? "background 0.7s cubic-bezier(0.22, 1, 0.36, 1)"
              : "background 0.3s ease",
          }}
        />

        {/* Warm horizon glow */}
        <div
          className="absolute bottom-0 left-1/2"
          style={{
            width: phase >= 1 ? "250vw" : "0",
            height: phase >= 1 && phase < 2 ? "70vh" : "0",
            transform: "translateX(-50%)",
            background: "radial-gradient(ellipse at 50% 100%, rgba(255,180,60,0.5) 0%, rgba(255,140,40,0.2) 40%, transparent 70%)",
            transition: "all 0.8s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />

        {/* Sun */}
        <div
          className="absolute left-1/2"
          style={{
            bottom: phase === 0 ? "-15%" : phase === 1 ? "35%" : "50%",
            transform: "translateX(-50%)",
            transition: "bottom 0.9s cubic-bezier(0.22, 1, 0.36, 1)",
            opacity: phase >= 2 ? 0 : 1,
            ...(phase >= 2 ? { transition: "bottom 0.9s cubic-bezier(0.22,1,0.36,1), opacity 0.3s ease" } : {}),
          }}
        >
          {/* Soft outer glow */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              width: phase >= 1 ? 280 : 0,
              height: phase >= 1 ? 280 : 0,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(255,200,80,0.3) 0%, rgba(255,160,50,0.1) 40%, transparent 70%)",
              transition: "all 0.8s cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          />

          {/* Sun body */}
          <div
            style={{
              position: "relative",
              width: phase >= 1 ? 70 : 10,
              height: phase >= 1 ? 70 : 10,
              borderRadius: "50%",
              background: "radial-gradient(circle at 40% 40%, #fffbe8 0%, #ffd97a 40%, #ffb347 70%, #ff8c42 100%)",
              boxShadow: phase >= 1
                ? "0 0 50px rgba(255,200,80,0.7), 0 0 100px rgba(255,180,60,0.3), 0 0 200px rgba(255,140,40,0.15)"
                : "0 0 5px rgba(255,200,80,0.2)",
              transition: "all 0.8s cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          />
        </div>
      </div>
    );
  }

  // ─── MOONRISE / NIGHTFALL ───
  // Phase 0: solid light
  // Phase 1: deep blue sky + moon + stars
  // Phase 2: solid #0d0d0d (matches dark theme bg) — theme switches now
  // Phase 3: fade out overlay
  return (
    <div
      className="fixed inset-0 z-[9998] overflow-hidden"
      style={{
        opacity: phase >= 3 ? 0 : 1,
        transition: "opacity 0.6s ease",
        pointerEvents: phase >= 3 ? "none" : "auto",
      }}
    >
      {/* Sky background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            phase === 0 ? "#f0ece4"
            : phase === 1 ? "linear-gradient(to bottom, #0a0a1a 0%, #1a1a3e 30%, #0d0d1a 60%, #0d0d0d 100%)"
            : "#0d0d0d",
          transition: phase === 1
            ? "background 0.7s cubic-bezier(0.22, 1, 0.36, 1)"
            : "background 0.3s ease",
        }}
      />

      {/* Stars */}
      {starsRef.current.map(({ id, x, y, size, delay, twinkle }) => (
        <div
          key={id}
          className="absolute rounded-full"
          style={{
            left: `${x}%`,
            top: `${y}%`,
            width: size,
            height: size,
            backgroundColor: "#fff",
            opacity: phase === 1 ? 0.6 : 0,
            transform: phase >= 1 ? "scale(1)" : "scale(0)",
            transition: `all 0.4s ease ${delay + 0.15}s`,
            animation: phase === 1 ? `twinkle ${twinkle}s ease-in-out ${delay}s infinite` : "none",
          }}
        />
      ))}

      {/* Moon */}
      <div
        className="absolute left-1/2"
        style={{
          top: phase === 0 ? "-15%" : phase === 1 ? "22%" : "22%",
          transform: "translateX(-50%)",
          transition: "top 0.8s cubic-bezier(0.22, 1, 0.36, 1)",
          opacity: phase >= 2 ? 0 : 1,
          ...(phase >= 2 ? { transition: "top 0.8s cubic-bezier(0.22,1,0.36,1), opacity 0.3s ease" } : {}),
        }}
      >
        {/* Moon glow */}
        <div
          style={{
            position: "absolute",
            inset: -40,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(180,190,230,0.2) 0%, rgba(150,160,210,0.08) 40%, transparent 70%)",
            opacity: phase === 1 ? 1 : 0,
            transition: "opacity 0.5s ease 0.15s",
          }}
        />

        {/* Moon body */}
        <div style={{ position: "relative" }}>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #e8e4dc 0%, #d4d0c8 50%, #c0bab0 100%)",
              boxShadow: phase === 1
                ? "0 0 30px rgba(180,190,230,0.25), 0 0 60px rgba(180,190,230,0.1)"
                : "none",
              transition: "box-shadow 0.5s ease 0.15s",
            }}
          />
          <div className="absolute rounded-full" style={{ width: 12, height: 12, top: 15, left: 20, background: "rgba(0,0,0,0.06)" }} />
          <div className="absolute rounded-full" style={{ width: 8, height: 8, top: 32, left: 12, background: "rgba(0,0,0,0.04)" }} />
          <div className="absolute rounded-full" style={{ width: 6, height: 6, top: 20, left: 38, background: "rgba(0,0,0,0.05)" }} />
        </div>
      </div>
    </div>
  );
}
