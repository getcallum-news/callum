"use client";

import { useMemo, useState } from "react";

export interface LinePoint {
  date: string; // YYYY-MM-DD
  count: number;
}

interface LineChartProps {
  data: LinePoint[];
  height?: number;
  /** Optional accent color for the line. Defaults to currentColor. */
  color?: string;
  /** Whether to show axis labels. */
  showAxis?: boolean;
}

/**
 * Minimal SVG line chart with hover tooltip.
 *
 * Designed to match the Callum aesthetic — thin lines, muted tones,
 * no external chart library. Renders a filled area under the line plus
 * a hover indicator that snaps to the nearest data point.
 */
export default function LineChart({
  data,
  height = 160,
  color,
  showAxis = true,
}: LineChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const width = 600; // viewBox width — SVG scales responsively
  const padL = 36;
  const padR = 16;
  const padT = 16;
  const padB = showAxis ? 28 : 12;

  const innerW = width - padL - padR;
  const innerH = height - padT - padB;

  const { points, max, linePath, areaPath } = useMemo(() => {
    if (data.length === 0) {
      return { points: [], max: 0, linePath: "", areaPath: "" };
    }
    const max = Math.max(1, ...data.map((d) => d.count));
    const stepX = data.length > 1 ? innerW / (data.length - 1) : 0;

    const pts = data.map((d, i) => ({
      x: padL + i * stepX,
      y: padT + innerH - (d.count / max) * innerH,
      date: d.date,
      count: d.count,
    }));

    const linePath = pts
      .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
      .join(" ");

    const areaPath =
      pts.length > 0
        ? `${linePath} L${pts[pts.length - 1].x.toFixed(2)},${(padT + innerH).toFixed(
            2
          )} L${pts[0].x.toFixed(2)},${(padT + innerH).toFixed(2)} Z`
        : "";

    return { points: pts, max, linePath, areaPath };
  }, [data, innerH, innerW, padL, padT]);

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-[11px] uppercase tracking-[0.15em] text-callum-muted opacity-50"
        style={{ height }}
      >
        No data yet
      </div>
    );
  }

  const gradId = `lc-grad-${data[0]?.date ?? "g"}`;

  const handleMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const xRatio = (e.clientX - rect.left) / rect.width;
    const xInSvg = xRatio * width;
    // Find nearest point
    let nearest = 0;
    let best = Infinity;
    for (let i = 0; i < points.length; i++) {
      const d = Math.abs(points[i].x - xInSvg);
      if (d < best) {
        best = d;
        nearest = i;
      }
    }
    setHoverIdx(nearest);
  };

  const stroke = color ?? "currentColor";
  const hover = hoverIdx != null ? points[hoverIdx] : null;

  // Y-axis ticks: 0, mid, max
  const yTicks = [0, Math.round(max / 2), max];

  const formatDate = (iso: string) => {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ height }}
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIdx(null)}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.18" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Horizontal gridlines */}
        {yTicks.map((t) => {
          const y = padT + innerH - (t / max) * innerH;
          return (
            <line
              key={t}
              x1={padL}
              y1={y}
              x2={width - padR}
              y2={y}
              stroke="currentColor"
              strokeOpacity="0.08"
              strokeDasharray="2 4"
            />
          );
        })}

        {/* Area */}
        <path d={areaPath} fill={`url(#${gradId})`} />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke={stroke}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points (only dots on hover + endpoints) */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={hoverIdx === i ? 3.5 : 0}
            fill={stroke}
          />
        ))}

        {/* Y-axis labels */}
        {showAxis &&
          yTicks.map((t) => {
            const y = padT + innerH - (t / max) * innerH;
            return (
              <text
                key={`yt-${t}`}
                x={padL - 8}
                y={y + 3}
                fontSize="9"
                fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                textAnchor="end"
                fill="currentColor"
                fillOpacity="0.4"
              >
                {t}
              </text>
            );
          })}

        {/* X-axis labels — first, middle, last */}
        {showAxis &&
          [0, Math.floor(data.length / 2), data.length - 1].map((idx) => {
            if (!points[idx]) return null;
            return (
              <text
                key={`xt-${idx}`}
                x={points[idx].x}
                y={height - 8}
                fontSize="9"
                fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                textAnchor="middle"
                fill="currentColor"
                fillOpacity="0.4"
              >
                {formatDate(data[idx].date)}
              </text>
            );
          })}

        {/* Hover vertical line */}
        {hover && (
          <line
            x1={hover.x}
            y1={padT}
            x2={hover.x}
            y2={padT + innerH}
            stroke="currentColor"
            strokeOpacity="0.25"
            strokeDasharray="2 3"
          />
        )}
      </svg>

      {/* Tooltip */}
      {hover && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 rounded border border-[var(--border)] bg-[var(--bg)] px-2 py-1 text-[10px] uppercase tracking-[0.1em] shadow-sm"
          style={{
            left: `${(hover.x / width) * 100}%`,
            top: 4,
          }}
        >
          <span className="font-mono opacity-60">{formatDate(hover.date)}</span>
          <span className="mx-1 opacity-30">·</span>
          <span className="font-mono">{hover.count}</span>
        </div>
      )}
    </div>
  );
}
