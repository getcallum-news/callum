"use client";

import { useEffect, useState } from "react";

/**
 * Light mode atmosphere — floating dust motes catching sunlight.
 * Only renders in light mode. Loaded with ssr: false.
 */

interface Mote {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  driftDuration: number;
  driftDelay: number;
  driftX: number;
  driftY: number;
}

function generateMotes(count: number): Mote[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 2 + Math.random() * 4,
    opacity: 0.12 + Math.random() * 0.2,
    driftDuration: 15 + Math.random() * 25,
    driftDelay: Math.random() * 10,
    driftX: -20 + Math.random() * 40,
    driftY: -30 + Math.random() * 20,
  }));
}

const MOTES = generateMotes(30);

export default function SunlitDust() {
  const [isLight, setIsLight] = useState(
    () => !document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsLight(!document.documentElement.classList.contains("dark"));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  if (!isLight) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 1 }}
    >
      {/* Dust motes */}
      {MOTES.map((mote) => (
        <div
          key={mote.id}
          className="absolute rounded-full"
          style={{
            left: `${mote.x}%`,
            top: `${mote.y}%`,
            width: mote.size,
            height: mote.size,
            background: "radial-gradient(circle, rgba(180,160,120,0.5) 0%, rgba(180,160,120,0) 70%)",
            opacity: mote.opacity,
            animation: `dust-float ${mote.driftDuration}s ease-in-out ${mote.driftDelay}s infinite`,
            ["--drift-x" as string]: `${mote.driftX}px`,
            ["--drift-y" as string]: `${mote.driftY}px`,
          }}
        />
      ))}

      {/* Soft warm light beam from top-right */}
      <div
        className="absolute"
        style={{
          top: 0,
          right: "5%",
          width: "40vw",
          height: "60vh",
          background: "linear-gradient(165deg, rgba(220,200,160,0.08) 0%, transparent 60%)",
          filter: "blur(30px)",
        }}
      />
    </div>
  );
}
