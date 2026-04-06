"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";
import ScrollProgress from "@/components/ScrollProgress";
import CustomCursor from "@/components/CustomCursor";
import { fetchMindshare, MindshareEntity } from "@/lib/api";

const TYPE_LABELS: Record<string, string> = {
  company: "Companies",
  model: "Models",
  person: "People",
};

function ChangeTag({ pct, trend }: { pct: number; trend: string }) {
  const sign = pct > 0 ? "+" : "";
  const color =
    trend === "up"
      ? "text-emerald-400"
      : trend === "down"
      ? "text-rose-400"
      : "text-callum-muted";

  return (
    <span className={`font-mono text-[13px] tabular-nums ${color}`}>
      {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"}{" "}
      {sign}{pct.toFixed(1)}%
    </span>
  );
}

function MindshareRow({
  entity,
  rank,
  max,
}: {
  entity: MindshareEntity;
  rank: number;
  max: number;
}) {
  const barWidth = max > 0 ? (entity.this_week / max) * 100 : 0;

  return (
    <div className="group relative flex items-center gap-4 border-b border-[var(--border)] px-0 py-4 transition-all">
      {/* Rank */}
      <span className="w-6 shrink-0 text-[11px] tabular-nums text-callum-muted opacity-40">
        {String(rank).padStart(2, "0")}
      </span>

      {/* Name + bar */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="font-serif text-[15px] font-medium tracking-tight">
            {entity.name}
          </span>
          <ChangeTag pct={entity.change_pct} trend={entity.trend} />
        </div>
        {/* Mention bar */}
        <div className="mt-2 h-[2px] w-full overflow-hidden rounded-full bg-[var(--border)]">
          <div
            className="h-full rounded-full bg-current opacity-20 transition-all duration-700 group-hover:opacity-40"
            style={{ width: `${barWidth}%` }}
          />
        </div>
      </div>

      {/* Article count */}
      <div className="shrink-0 text-right">
        <span className="font-mono text-[13px] tabular-nums">
          {entity.this_week}
        </span>
        <p className="text-[10px] uppercase tracking-[0.1em] text-callum-muted opacity-50">
          articles
        </p>
      </div>
    </div>
  );
}

export default function PulsePage() {
  const [data, setData] = useState<MindshareEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"company" | "model" | "person">("company");
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    fetchMindshare()
      .then((res) => {
        setData(res.entities);
        setLastUpdated(res.generated_at);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = data.filter((e) => e.type === activeTab);
  const max = filtered.reduce((m, e) => Math.max(m, e.this_week), 0);

  const tabs: Array<"company" | "model" | "person"> = ["company", "model", "person"];

  return (
    <div className="noise-overlay">
      <CustomCursor />
      <ScrollProgress />
      <Header />

      <main>
        <section className="mx-auto max-w-4xl px-6 pb-16 pt-32 sm:pt-40">
          {/* Header */}
          <p className="animate-reveal mb-6 text-[11px] font-medium uppercase tracking-[0.3em] text-callum-muted">
            The Pulse
          </p>
          <h1 className="animate-reveal-delay-1 font-serif text-5xl font-semibold leading-[1.1] tracking-tight sm:text-6xl md:text-7xl">
            AI mindshare,
            <br />
            <span className="italic hero-gradient-text">this week.</span>
          </h1>
          <p className="animate-reveal-delay-2 mt-6 max-w-xl text-[14px] leading-[1.8] text-callum-muted">
            Who&apos;s gaining and losing ground in AI coverage. Ranked by article
            mentions over the last 7 days, compared to the 7 days prior.
            Pure data. Zero opinion.
          </p>

          {lastUpdated && (
            <p className="mt-3 text-[11px] uppercase tracking-[0.15em] text-callum-muted opacity-40">
              Updated {new Date(lastUpdated).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
        </section>

        {/* Divider */}
        <div className="mx-auto max-w-4xl px-6">
          <div className="animate-line-grow h-px w-full bg-[var(--border)]" />
        </div>

        {/* Tabs + Leaderboard */}
        <section className="mx-auto max-w-4xl px-6 py-16">
          {/* Tab selector */}
          <div className="mb-10 flex gap-1 border-b border-[var(--border)]">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 pb-3 pt-1 text-[11px] font-medium uppercase tracking-[0.2em] transition-all ${
                  activeTab === tab
                    ? "border-b-2 border-current opacity-100"
                    : "opacity-40 hover:opacity-70"
                }`}
                style={{ marginBottom: activeTab === tab ? "-1px" : "0" }}
              >
                {TYPE_LABELS[tab]}
              </button>
            ))}
          </div>

          {/* Column headers */}
          <div className="mb-1 flex items-center gap-4 px-0">
            <span className="w-6 shrink-0" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.2em] text-callum-muted opacity-50">
                  Name
                </span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-callum-muted opacity-50">
                  vs last week
                </span>
              </div>
            </div>
            <div className="w-16 shrink-0 text-right">
              <span className="text-[10px] uppercase tracking-[0.2em] text-callum-muted opacity-50">
                7d
              </span>
            </div>
          </div>

          {/* Rows */}
          {loading ? (
            <div className="flex flex-col gap-0">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="border-b border-[var(--border)] py-4"
                  style={{ opacity: 1 - i * 0.1 }}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-3 w-4 animate-pulse rounded bg-[var(--border)]" />
                    <div className="h-4 flex-1 animate-pulse rounded bg-[var(--border)]" />
                    <div className="h-3 w-12 animate-pulse rounded bg-[var(--border)]" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-16 text-center text-[13px] text-callum-muted opacity-50">
              No data yet — check back once more articles have been collected.
            </p>
          ) : (
            <div>
              {filtered.map((entity, i) => (
                <MindshareRow
                  key={entity.name}
                  entity={entity}
                  rank={i + 1}
                  max={max}
                />
              ))}
            </div>
          )}

          {/* Legend */}
          <div className="mt-10 flex flex-wrap gap-6 border-t border-[var(--border)] pt-6">
            {[
              { symbol: "↑", color: "text-emerald-400", label: "Gaining mindshare" },
              { symbol: "↓", color: "text-rose-400", label: "Losing mindshare" },
              { symbol: "→", color: "text-callum-muted", label: "Stable (±2%)" },
            ].map(({ symbol, color, label }) => (
              <div key={label} className="flex items-center gap-2">
                <span className={`font-mono text-[13px] ${color}`}>{symbol}</span>
                <span className="text-[11px] uppercase tracking-[0.15em] text-callum-muted opacity-60">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
      <CookieBanner />
    </div>
  );
}
