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
  /** Whether to render the stats summary row below the chart. */
  showStats?: boolean;
  /** Whether to overlay a 7-day moving average. */
  showMovingAvg?: boolean;
}

/**
 * Detailed SVG line chart with hover tooltip.
 *
 * Renders a filled area + line, visible data points, optional 7-day moving
 * average overlay, peak marker, and a stats summary (total / peak / avg).
 * No external chart library — designed to match the Callum aesthetic.
 */
export default function LineChart({
  data,
  height = 220,
  color,
  showAxis = true,
  showStats = true,
  showMovingAvg = true,
}: LineChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const width = 600; // viewBox width — SVG scales responsively
  const padL = 40;
  const padR = 20;
  const padT = 20;
  const padB = showAxis ? 32 : 12;

  const innerW = width - padL - padR;
  const innerH = height - padT - padB;

  const stats = useMemo(() => {
    if (data.length === 0) return { total: 0, peak: 0, avg: 0, peakIdx: -1 };
    let total = 0;
    let peak = 0;
    let peakIdx = 0;
    for (let i = 0; i < data.length; i++) {
      total += data[i].count;
      if (data[i].count > peak) {
        peak = data[i].count;
        peakIdx = i;
      }
    }
    return {
      total,
      peak,
      avg: total / data.length,
      peakIdx,
    };
  }, [data]);

  const movingAvg = useMemo(() => {
    if (!showMovingAvg || data.length < 3) return [];
    const window = Math.min(7, data.length);
    const out: number[] = [];
    for (let i = 0; i < data.length; i++) {
      const start = Math.max(0, i - window + 1);
      const slice = data.slice(start, i + 1);
      const sum = slice.reduce((s, p) => s + p.count, 0);
      out.push(sum / slice.length);
    }
    return out;
  }, [data, showMovingAvg]);

  const { points, max, niceMax, linePath, areaPath, avgPath } = useMemo(() => {
    if (data.length === 0) {
      return { points: [], max: 0, niceMax: 1, linePath: "", areaPath: "", avgPath: "" };
    }
    const rawMax = Math.max(1, ...data.map((d) => d.count));
    // Round up to a "nice" number so ticks are clean integers.
    const niceMax = niceCeil(rawMax);
    const stepX = data.length > 1 ? innerW / (data.length - 1) : 0;

    const pts = data.map((d, i) => ({
      x: padL + i * stepX,
      y: padT + innerH - (d.count / niceMax) * innerH,
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

    const avgPath =
      movingAvg.length > 0
        ? movingAvg
            .map((v, i) => {
              const x = padL + i * stepX;
              const y = padT + innerH - (v / niceMax) * innerH;
              return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
            })
            .join(" ")
        : "";

    return { points: pts, max: rawMax, niceMax, linePath, areaPath, avgPath };
  }, [data, innerH, innerW, padL, padT, movingAvg]);

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
  const hoverAvg = hoverIdx != null && movingAvg.length > 0 ? movingAvg[hoverIdx] : null;

  // 5 Y-axis ticks evenly spaced.
  const yTicks = useMemo(() => {
    const out: number[] = [];
    const steps = 4;
    for (let i = 0; i <= steps; i++) {
      out.push(Math.round((niceMax * i) / steps));
    }
    return Array.from(new Set(out));
  }, [niceMax]);

  // X-axis ticks: ~7 labels max so they don't overlap.
  const xTickIndices = useMemo(() => {
    if (data.length <= 7) return data.map((_, i) => i);
    const stride = Math.ceil(data.length / 6);
    const idxs: number[] = [];
    for (let i = 0; i < data.length; i += stride) idxs.push(i);
    if (idxs[idxs.length - 1] !== data.length - 1) idxs.push(data.length - 1);
    return idxs;
  }, [data]);

  const formatDate = (iso: string) => {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };
  const formatFullDate = (iso: string) => {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const peakPt = stats.peakIdx >= 0 ? points[stats.peakIdx] : null;

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
            <stop offset="0%" stopColor={stroke} stopOpacity="0.22" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Horizontal gridlines */}
        {yTicks.map((t) => {
          const y = padT + innerH - (t / niceMax) * innerH;
          return (
            <line
              key={`grid-${t}`}
              x1={padL}
              y1={y}
              x2={width - padR}
              y2={y}
              stroke="currentColor"
              strokeOpacity="0.07"
              strokeDasharray="2 4"
            />
          );
        })}

        {/* Vertical gridlines for x ticks */}
        {showAxis &&
          xTickIndices.map((idx) => {
            const p = points[idx];
            if (!p) return null;
            return (
              <line
                key={`vgrid-${idx}`}
                x1={p.x}
                y1={padT}
                x2={p.x}
                y2={padT + innerH}
                stroke="currentColor"
                strokeOpacity="0.04"
              />
            );
          })}

        {/* Area */}
        <path d={areaPath} fill={`url(#${gradId})`} />

        {/* Moving average (dashed, subtle) */}
        {avgPath && (
          <path
            d={avgPath}
            fill="none"
            stroke={stroke}
            strokeWidth="1"
            strokeOpacity="0.45"
            strokeDasharray="3 3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke={stroke}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Always-visible data points */}
        {points.map((p, i) => (
          <circle
            key={`pt-${i}`}
            cx={p.x}
            cy={p.y}
            r={hoverIdx === i ? 4 : 2}
            fill={hoverIdx === i ? stroke : "var(--bg)"}
            stroke={stroke}
            strokeWidth="1.25"
          />
        ))}

        {/* Peak marker */}
        {peakPt && stats.peak > 0 && (
          <g>
            <circle
              cx={peakPt.x}
              cy={peakPt.y}
              r="5"
              fill="none"
              stroke={stroke}
              strokeOpacity="0.5"
              strokeWidth="1"
            />
            <text
              x={peakPt.x}
              y={peakPt.y - 9}
              fontSize="9"
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
              textAnchor="middle"
              fill="currentColor"
              fillOpacity="0.55"
            >
              peak {stats.peak}
            </text>
          </g>
        )}

        {/* Y-axis labels */}
        {showAxis &&
          yTicks.map((t) => {
            const y = padT + innerH - (t / niceMax) * innerH;
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

        {/* X-axis labels */}
        {showAxis &&
          xTickIndices.map((idx) => {
            const p = points[idx];
            if (!p) return null;
            return (
              <text
                key={`xt-${idx}`}
                x={p.x}
                y={height - 10}
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
            strokeOpacity="0.3"
            strokeDasharray="2 3"
          />
        )}
      </svg>

      {/* Tooltip */}
      {hover && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 whitespace-nowrap rounded border border-[var(--border)] bg-[var(--bg)] px-2.5 py-1.5 text-[10px] uppercase tracking-[0.1em] shadow-lg"
          style={{
            left: `${(hover.x / width) * 100}%`,
            top: 4,
          }}
        >
          <div className="flex items-center gap-2">
            <span className="font-mono opacity-60">{formatFullDate(hover.date)}</span>
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="font-mono text-[11px]">{hover.count}</span>
            <span className="opacity-40">mentions</span>
            {hoverAvg !== null && (
              <span className="opacity-40">
                · 7d avg {hoverAvg.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Stats summary */}
      {showStats && (
        <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-[var(--border)] pt-3 text-[10px] uppercase tracking-[0.15em] text-callum-muted">
          <Stat label="Total" value={stats.total.toLocaleString()} />
          <Stat label="Peak" value={stats.peak.toLocaleString()} />
          <Stat label="Avg / day" value={stats.avg.toFixed(1)} />
          <Stat label="Days" value={String(data.length)} />
          {showMovingAvg && (
            <span className="ml-auto flex items-center gap-2 opacity-60">
              <svg width="20" height="6">
                <line
                  x1="0"
                  y1="3"
                  x2="20"
                  y2="3"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
              </svg>
              7d moving avg
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="opacity-50">{label}</span>
      <span className="font-mono text-[12px] normal-case tracking-normal text-[var(--fg)]">
        {value}
      </span>
    </div>
  );
}

/** Round up to a clean number for axis ticks (e.g. 13 → 16, 47 → 50). */
function niceCeil(n: number): number {
  if (n <= 4) return 4;
  if (n <= 8) return 8;
  if (n <= 10) return 10;
  const pow = Math.pow(10, Math.floor(Math.log10(n)));
  const base = n / pow;
  let nice: number;
  if (base <= 1) nice = 1;
  else if (base <= 2) nice = 2;
  else if (base <= 2.5) nice = 2.5;
  else if (base <= 5) nice = 5;
  else nice = 10;
  return Math.ceil(nice * pow);
}
