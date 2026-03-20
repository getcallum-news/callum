"use client";

import { useEffect, useState } from "react";
import { fetchStats } from "@/lib/api";

/**
 * Minimal dot-based world map showing where AI news originates.
 * Pulsing dots at source locations. Interactive hover tooltips.
 */

// Source HQ locations mapped to percentage positions on map
const SOURCE_LOCATIONS: Record<string, { x: number; y: number; city: string }> = {
  "TechCrunch":    { x: 12, y: 38, city: "West Coast" },
  "VentureBeat":   { x: 12, y: 38, city: "West Coast" },
  "Wired":         { x: 12, y: 38, city: "West Coast" },
  "Hacker News":   { x: 12, y: 38, city: "West Coast" },
  "The Verge":     { x: 24, y: 36, city: "East Coast" },
  "Ars Technica":  { x: 24, y: 36, city: "East Coast" },
  "MIT News":      { x: 24, y: 36, city: "East Coast" },
  "arXiv":         { x: 24, y: 36, city: "East Coast" },
};

interface Tooltip {
  source: string;
  city: string;
  count: number;
  x: number;
  y: number;
}

export default function SourceMap() {
  const [sources, setSources] = useState<Record<string, number>>({});
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    fetchStats()
      .then((data) => {
        setSources(data.sources || {});
        setTimeout(() => setVisible(true), 300);
      })
      .catch(() => {});
  }, []);

  if (Object.keys(sources).length === 0) return null;

  // Group sources by city
  const locationGroups: Record<string, { city: string; x: number; y: number; sources: { name: string; count: number }[] }> = {};

  for (const [source, loc] of Object.entries(SOURCE_LOCATIONS)) {
    if (sources[source]) {
      const key = loc.city;
      if (!locationGroups[key]) {
        locationGroups[key] = { city: loc.city, x: loc.x, y: loc.y, sources: [] };
      }
      locationGroups[key].sources.push({ name: source, count: sources[source] });
    }
  }

  const totalArticles = Object.values(sources).reduce((a, b) => a + b, 0);

  // Generate dot grid for world map outline (simple approach)
  const dots: { x: number; y: number; opacity: number }[] = [];
  // Create a sparse dot grid that hints at continents
  const continentZones = [
    // North America
    { xMin: 8, xMax: 26, yMin: 20, yMax: 55, density: 0.4 },
    // South America
    { xMin: 20, xMax: 32, yMin: 55, yMax: 90, density: 0.3 },
    // Europe
    { xMin: 44, xMax: 56, yMin: 18, yMax: 42, density: 0.4 },
    // Africa
    { xMin: 44, xMax: 58, yMin: 38, yMax: 75, density: 0.3 },
    // Asia
    { xMin: 55, xMax: 88, yMin: 15, yMax: 55, density: 0.35 },
    // Australia
    { xMin: 78, xMax: 90, yMin: 62, yMax: 80, density: 0.3 },
  ];

  for (const zone of continentZones) {
    for (let x = zone.xMin; x <= zone.xMax; x += 2) {
      for (let y = zone.yMin; y <= zone.yMax; y += 2) {
        if (Math.random() < zone.density) {
          dots.push({ x, y, opacity: 0.08 + Math.random() * 0.07 });
        }
      }
    }
  }

  return (
    <section
      className={`mx-auto max-w-4xl px-6 py-16 transition-all duration-1000 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-[11px] font-medium uppercase tracking-[0.3em] text-callum-muted">
          Where the news comes from
        </h2>
        <span className="text-[11px] tracking-wide text-callum-muted">
          {totalArticles} articles from {Object.keys(locationGroups).length} cities
        </span>
      </div>

      <div
        className="relative overflow-hidden border border-[var(--border)] bg-[var(--bg)]"
        style={{ aspectRatio: "2/1" }}
        onMouseLeave={() => setTooltip(null)}
      >
        {/* Dot grid map */}
        <svg viewBox="0 0 100 50" className="absolute inset-0 h-full w-full">
          {/* Background dots representing continents */}
          {dots.map((dot, i) => (
            <circle
              key={i}
              cx={dot.x}
              cy={dot.y}
              r="0.4"
              fill="var(--text-primary)"
              fillOpacity={dot.opacity}
            />
          ))}

          {/* Grid lines */}
          {[12.5, 25, 37.5].map((y) => (
            <line
              key={`h-${y}`}
              x1="0" y1={y} x2="100" y2={y}
              stroke="var(--text-primary)"
              strokeOpacity="0.03"
              strokeWidth="0.1"
              strokeDasharray="0.5 1.5"
            />
          ))}
          {[25, 50, 75].map((x) => (
            <line
              key={`v-${x}`}
              x1={x} y1="0" x2={x} y2="50"
              stroke="var(--text-primary)"
              strokeOpacity="0.03"
              strokeWidth="0.1"
              strokeDasharray="0.5 1.5"
            />
          ))}
        </svg>

        {/* Source location dots — positioned as percentages */}
        {Object.entries(locationGroups).map(([key, loc]) => {
          const count = loc.sources.reduce((a, b) => a + b.count, 0);
          const size = Math.max(8, Math.min(20, (count / totalArticles) * 80));

          return (
            <div
              key={key}
              className="absolute cursor-pointer"
              style={{
                left: `${loc.x}%`,
                top: `${loc.y}%`,
                transform: "translate(-50%, -50%)",
              }}
              onMouseEnter={() =>
                setTooltip({
                  source: loc.sources.map((s) => s.name).join(", "),
                  city: loc.city,
                  count,
                  x: loc.x,
                  y: loc.y,
                })
              }
              onMouseLeave={() => setTooltip(null)}
            >
              {/* Pulse ring */}
              <div
                className="absolute rounded-full"
                style={{
                  width: size * 3,
                  height: size * 3,
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                  border: "1px solid var(--text-primary)",
                  opacity: 0.15,
                  animation: "pulse-ring 3s ease-out infinite",
                }}
              />

              {/* Core dot */}
              <div
                className="rounded-full transition-all duration-300"
                style={{
                  width: size,
                  height: size,
                  backgroundColor: "var(--text-primary)",
                  opacity: 0.7,
                  boxShadow: "0 0 12px rgba(245, 240, 232, 0.3)",
                }}
              />

              {/* City label */}
              <p
                className="absolute whitespace-nowrap text-[9px] font-medium uppercase tracking-[0.1em] text-callum-muted"
                style={{
                  left: "50%",
                  top: "100%",
                  transform: "translateX(-50%)",
                  marginTop: 6,
                }}
              >
                {loc.city}
              </p>
            </div>
          );
        })}

        {/* Tooltip */}
        {tooltip && (
          <div
            className="pointer-events-none absolute z-10 border border-[var(--border)] bg-[var(--bg)] px-4 py-3"
            style={{
              left: `${tooltip.x}%`,
              top: `${tooltip.y}%`,
              transform: "translate(-50%, -130%)",
            }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em]">
              {tooltip.city}
            </p>
            <p className="mt-1 text-[10px] text-callum-muted">
              {tooltip.source}
            </p>
            <p className="mt-1 text-[10px] text-callum-muted">
              {tooltip.count} article{tooltip.count !== 1 ? "s" : ""}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
