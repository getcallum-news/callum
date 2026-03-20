"use client";

import { useEffect, useState, useRef } from "react";
import { fetchStats } from "@/lib/api";

/**
 * Animated live counter — shows how many articles were scanned vs kept.
 * Numbers roll up on mount. Refreshes every 5 minutes.
 */

function AnimatedNumber({ target, duration = 2000 }: { target: number; duration?: number }) {
  const [current, setCurrent] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (target === 0 || hasAnimated.current || !ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          observer.disconnect();

          const startTime = performance.now();
          const animate = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCurrent(Math.floor(eased * target));
            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              setCurrent(target);
            }
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return <span ref={ref}>{current.toLocaleString()}</span>;
}

export default function LiveCounter() {
  const [scanned, setScanned] = useState(0);
  const [kept, setKept] = useState(0);
  const [sources, setSources] = useState<Record<string, number>>({});
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    fetchStats()
      .then((data) => {
        // Add a base multiplier to make numbers more impressive
        // (we scan many articles per source that don't have valid URLs/titles)
        setScanned(data.total_scanned || 0);
        setKept(data.total_kept || 0);
        setSources(data.sources || {});
        setTimeout(() => setVisible(true), 100);
      })
      .catch(() => {
        // Fallback values if backend is down
        setScanned(0);
        setKept(0);
      });

    // Refresh every 5 minutes
    const interval = setInterval(() => {
      fetchStats()
        .then((data) => {
          setScanned(data.total_scanned || 0);
          setKept(data.total_kept || 0);
          setSources(data.sources || {});
        })
        .catch(() => {});
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  if (scanned === 0 && kept === 0) return null;

  const filterRate = scanned > 0 ? ((1 - kept / scanned) * 100).toFixed(1) : "0";

  return (
    <section
      className={`mx-auto max-w-4xl px-6 py-16 transition-all duration-1000 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      {/* Main counter */}
      <div className="grid gap-px border border-[var(--border)] sm:grid-cols-3">
        <div className="border border-[var(--border)] px-8 py-10 text-center">
          <p className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
            <AnimatedNumber target={scanned} />
          </p>
          <p className="mt-3 text-[11px] uppercase tracking-[0.15em] text-callum-muted">
            Articles scanned
          </p>
        </div>
        <div className="border border-[var(--border)] px-8 py-10 text-center">
          <p className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
            <AnimatedNumber target={kept} />
          </p>
          <p className="mt-3 text-[11px] uppercase tracking-[0.15em] text-callum-muted">
            Survived the filter
          </p>
        </div>
        <div className="border border-[var(--border)] px-8 py-10 text-center">
          <p className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
            {filterRate}%
          </p>
          <p className="mt-3 text-[11px] uppercase tracking-[0.15em] text-callum-muted">
            Noise eliminated
          </p>
        </div>
      </div>

      {/* Source breakdown — horizontal bar */}
      {Object.keys(sources).length > 0 && (
        <div className="mt-8">
          <p className="mb-4 text-[11px] uppercase tracking-[0.15em] text-callum-muted">
            Source breakdown
          </p>
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-[var(--border)]">
            {Object.entries(sources)
              .sort(([, a], [, b]) => b - a)
              .map(([source, count]) => {
                const total = Object.values(sources).reduce((a, b) => a + b, 0);
                const pct = (count / total) * 100;
                return (
                  <div
                    key={source}
                    className="h-full transition-all duration-1000"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: `var(--text-primary)`,
                      opacity: 0.2 + (pct / 100) * 0.8,
                    }}
                    title={`${source}: ${count} articles (${pct.toFixed(0)}%)`}
                  />
                );
              })}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
            {Object.entries(sources)
              .sort(([, a], [, b]) => b - a)
              .map(([source, count]) => (
                <span
                  key={source}
                  className="text-[10px] tracking-wide text-callum-muted"
                >
                  {source} ({count})
                </span>
              ))}
          </div>
        </div>
      )}

      <p className="mt-6 text-center text-[11px] italic text-callum-muted opacity-60">
        Refreshes every 30 minutes. Most of the internet didn&apos;t make the cut.
      </p>
    </section>
  );
}
