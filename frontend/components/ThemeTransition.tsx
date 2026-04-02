"use client";

import { useEffect, useRef, useState } from "react";

interface ThemeTransitionProps {
  toLight: boolean;
  onComplete: () => void;
}

/**
 * Theme transition overlays.
 *
 * dark → light: Warm amber sweep from left to right with glowing
 *   streaks that match the shader's shooting-star aesthetic.
 *
 * light → dark: Original moonrise — deep blue sky, stars, moon.
 */
export default function ThemeTransition({ toLight, onComplete }: ThemeTransitionProps) {
  const [phase, setPhase] = useState(0);
  const hasCompleted = useRef(false);
  const themeSwitched = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  // Switch theme at phase 2 — overlay is fully opaque
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

  // ─── Canvas animation for dark → light (warm sweep) ───
  useEffect(() => {
    if (!toLight) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    // Generate streaks — randomized shooting stars
    const streaks = Array.from({ length: 18 }, () => ({
      y: Math.random() * h,
      speed: 0.8 + Math.random() * 1.5,
      length: 80 + Math.random() * 250,
      thickness: 1 + Math.random() * 2.5,
      delay: Math.random() * 0.3,
      opacity: 0.3 + Math.random() * 0.7,
      hue: 30 + Math.random() * 20, // orange-amber range
    }));

    let startTime: number | null = null;
    let rafId: number;
    const totalDuration = 1050;

    const animate = (now: number) => {
      if (!startTime) startTime = now;
      const elapsed = now - startTime;
      const t = Math.min(elapsed / totalDuration, 1);

      // Smooth ease-in-out
      const eased = t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;

      ctx.clearRect(0, 0, w, h);

      // Base: dark background
      ctx.fillStyle = "#0d0d0d";
      ctx.fillRect(0, 0, w, h);

      // Left-to-right warm wash — the sweep
      const sweepX = eased * (w + 300);

      // Soft leading edge glow
      const glowWidth = 400;
      const glowGrad = ctx.createLinearGradient(
        Math.max(0, sweepX - glowWidth), 0,
        sweepX, 0
      );
      glowGrad.addColorStop(0, "transparent");
      glowGrad.addColorStop(0.3, "rgba(245, 130, 20, 0.06)");
      glowGrad.addColorStop(0.7, "rgba(245, 158, 11, 0.15)");
      glowGrad.addColorStop(1, "rgba(255, 180, 50, 0.25)");
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, w, h);

      // Main warm fill behind the sweep
      const fillGrad = ctx.createLinearGradient(0, 0, sweepX, 0);
      fillGrad.addColorStop(0, "rgba(10, 8, 6, 1)");
      fillGrad.addColorStop(0.6, "rgba(25, 15, 8, 1)");
      fillGrad.addColorStop(0.85, "rgba(50, 25, 10, 1)");
      fillGrad.addColorStop(1, "rgba(10, 8, 6, 1)");
      ctx.fillStyle = fillGrad;
      ctx.fillRect(0, 0, sweepX, h);

      // Vertical warm light band at the sweep edge
      const bandWidth = 120;
      const bandGrad = ctx.createLinearGradient(
        sweepX - bandWidth, 0,
        sweepX + 30, 0
      );
      bandGrad.addColorStop(0, "transparent");
      bandGrad.addColorStop(0.4, "rgba(255, 180, 60, 0.3)");
      bandGrad.addColorStop(0.7, "rgba(255, 200, 80, 0.5)");
      bandGrad.addColorStop(0.9, "rgba(255, 220, 120, 0.35)");
      bandGrad.addColorStop(1, "transparent");
      ctx.fillStyle = bandGrad;
      ctx.fillRect(0, 0, w, h);

      // Draw streaks
      for (const s of streaks) {
        const streakProgress = Math.max(0, Math.min(1, (t - s.delay) / (1 - s.delay)));
        if (streakProgress <= 0) continue;

        const streakEased = 1 - Math.pow(1 - streakProgress, 2.5);
        const sx = streakEased * (w + s.length) * s.speed;
        const headX = Math.min(sx, w + s.length);
        const tailX = Math.max(headX - s.length * streakEased, -s.length);

        if (headX < 0) continue;

        const grad = ctx.createLinearGradient(tailX, s.y, headX, s.y);
        grad.addColorStop(0, "transparent");
        grad.addColorStop(0.3, `hsla(${s.hue}, 90%, 65%, ${s.opacity * 0.2 * (1 - streakProgress * 0.5)})`);
        grad.addColorStop(0.8, `hsla(${s.hue}, 95%, 75%, ${s.opacity * 0.7 * (1 - streakProgress * 0.3)})`);
        grad.addColorStop(1, `hsla(${s.hue}, 100%, 90%, ${s.opacity * (1 - streakProgress * 0.4)})`);

        // Streak glow
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.beginPath();
        ctx.moveTo(tailX, s.y);
        ctx.lineTo(headX, s.y);
        ctx.lineWidth = s.thickness + 4;
        ctx.strokeStyle = `hsla(${s.hue}, 80%, 60%, ${s.opacity * 0.15 * (1 - streakProgress * 0.5)})`;
        ctx.stroke();

        // Streak core
        ctx.beginPath();
        ctx.moveTo(tailX, s.y);
        ctx.lineTo(headX, s.y);
        ctx.lineWidth = s.thickness;
        ctx.strokeStyle = grad;
        ctx.stroke();

        // Bright head dot
        const dotAlpha = s.opacity * 0.8 * (1 - streakProgress * 0.5);
        if (dotAlpha > 0.05) {
          ctx.beginPath();
          ctx.arc(headX, s.y, s.thickness + 1, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${s.hue}, 100%, 85%, ${dotAlpha})`;
          ctx.fill();
        }
        ctx.restore();
      }

      if (t < 1) {
        rafId = requestAnimationFrame(animate);
      }
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [toLight]);

  // ─── SUNRISE (dark → light): Canvas sweep ───
  if (toLight) {
    return (
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-[9998]"
        style={{
          width: "100vw",
          height: "100vh",
          opacity: phase >= 3 ? 0 : 1,
          transition: "opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
          pointerEvents: phase >= 3 ? "none" : "auto",
        }}
      />
    );
  }

  // ─── MOONRISE (light → dark): Original moon + stars ───
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
            phase === 0 ? "#0a0806"
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
