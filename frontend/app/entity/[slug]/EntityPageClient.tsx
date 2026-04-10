"use client";

import Link from "next/link";
import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";
import ScrollProgress from "@/components/ScrollProgress";
import CustomCursor from "@/components/CustomCursor";
import LineChart from "@/components/LineChart";
import {
  EntityDetailResponse,
  fetchEntityDetail,
} from "@/lib/api";

const TYPE_LABEL: Record<string, string> = {
  company: "Company",
  model: "Model",
  person: "Person",
};

const TYPE_LABEL_PLURAL: Record<string, string> = {
  company: "companies",
  model: "models",
  person: "people",
};

const RANGE_OPTIONS: Array<{ days: number; label: string }> = [
  { days: 14, label: "14d" },
  { days: 30, label: "30d" },
  { days: 60, label: "60d" },
  { days: 90, label: "90d" },
];

function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  const now = Date.now();
  const s = Math.max(0, Math.floor((now - then) / 1000));
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return `${Math.floor(s / 604800)}w ago`;
}

function ChangeTag({ pct, trend }: { pct: number; trend: string }) {
  const sign = pct > 0 ? "+" : "";
  const color =
    trend === "up"
      ? "text-emerald-400"
      : trend === "down"
      ? "text-rose-400"
      : "text-callum-muted";
  return (
    <span className={`font-mono text-[14px] tabular-nums ${color}`}>
      {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"}{" "}
      {sign}
      {pct.toFixed(1)}%
    </span>
  );
}

export default function EntityPageClient({
  initialData,
}: {
  initialData: EntityDetailResponse;
}) {
  const [data, setData] = useState<EntityDetailResponse>(initialData);
  const [rangeDays, setRangeDays] = useState<number>(initialData.window_days);
  const [loadingRange, setLoadingRange] = useState<boolean>(false);

  const accent =
    data.trend === "up"
      ? "#34d399"
      : data.trend === "down"
      ? "#fb7185"
      : undefined;

  const changeRange = async (days: number) => {
    if (days === rangeDays || loadingRange) return;
    setLoadingRange(true);
    setRangeDays(days);
    try {
      const next = await fetchEntityDetail(data.slug, days);
      setData(next);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRange(false);
    }
  };

  return (
    <div className="noise-overlay">
      <CustomCursor />
      <ScrollProgress />
      <Header />

      <main>
        {/* ───────── Hero ───────── */}
        <section className="mx-auto max-w-5xl px-6 pb-12 pt-32 sm:pt-40">
          <div className="mb-6 flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.3em] opacity-75">
            <Link href="/pulse" className="hover-underline opacity-80 hover:opacity-100">
              The Pulse
            </Link>
            <span className="opacity-50">/</span>
            <span className="opacity-80">{TYPE_LABEL[data.type]}</span>
          </div>

          <h1 className="animate-reveal font-serif text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl">
            {data.name}
          </h1>

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-[13px] opacity-90">
            <ChangeTag pct={data.change_pct} trend={data.trend} />
            <span className="opacity-40">·</span>
            <span>
              <span className="font-mono text-[15px] font-medium tabular-nums">
                {data.this_week}
              </span>{" "}
              mentions this week
            </span>
            <span className="opacity-40">·</span>
            <span>
              <span className="font-mono text-[15px] font-medium tabular-nums">
                #{data.rank}
              </span>{" "}
              in {TYPE_LABEL_PLURAL[data.type]}
            </span>
          </div>
        </section>

        {/* Divider */}
        <div className="mx-auto max-w-5xl px-6">
          <div className="h-px w-full bg-[var(--border)]" />
        </div>

        {/* ───────── Mindshare chart ───────── */}
        <section className="mx-auto max-w-5xl px-6 py-12">
          <div className="mb-4 flex items-baseline justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] opacity-65">
                Mindshare history
              </p>
              <p className="mt-1 font-serif text-[20px] font-medium tracking-tight">
                Last {rangeDays} days
              </p>
            </div>

            {/* Range selector */}
            <div className="flex gap-1">
              {RANGE_OPTIONS.map((opt) => (
                <button
                  key={opt.days}
                  onClick={() => changeRange(opt.days)}
                  className={`rounded-sm border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em] backdrop-blur-sm transition-all ${
                    rangeDays === opt.days
                      ? "border-current bg-[var(--bg)]/70 opacity-100"
                      : "border-[var(--border)] bg-[var(--bg)]/40 opacity-60 hover:opacity-90"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div
            className={`rounded-sm border border-[var(--border)] bg-[var(--bg)]/75 p-6 backdrop-blur-md transition-opacity duration-300 ${
              loadingRange ? "opacity-50" : "opacity-100"
            }`}
          >
            <LineChart data={data.series} height={260} color={accent} />
          </div>
        </section>

        {/* ───────── Key stats grid ───────── */}
        <section className="mx-auto max-w-5xl px-6 pb-12">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-[var(--border)] bg-[var(--border)] backdrop-blur-md sm:grid-cols-4">
            {[
              {
                label: "Total mentions",
                value: data.total_mentions.toLocaleString(),
                sub: `Last ${rangeDays} days`,
              },
              {
                label: "Peak day",
                value: data.peak.toString(),
                sub: "mentions",
              },
              {
                label: "Avg / day",
                value: data.avg_per_day.toFixed(1),
                sub: "mentions",
              },
              {
                label: "Rank",
                value: `#${data.rank}`,
                sub: `in ${TYPE_LABEL_PLURAL[data.type]}`,
              },
            ].map((stat) => (
              <div key={stat.label} className="bg-[var(--bg)]/85 p-5 backdrop-blur-md">
                <p className="text-[10px] uppercase tracking-[0.2em] opacity-65">
                  {stat.label}
                </p>
                <p className="mt-2 font-serif text-[32px] font-medium leading-none tracking-tight">
                  {stat.value}
                </p>
                <p className="mt-2 text-[11px] opacity-60">
                  {stat.sub}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ───────── Two-column: Events + Related ───────── */}
        <section className="mx-auto max-w-5xl px-6 pb-12">
          <div className="grid gap-10 lg:grid-cols-[2fr_1fr]">
            {/* Events timeline */}
            <div>
              <h2 className="mb-6 text-[11px] font-medium uppercase tracking-[0.3em] opacity-70">
                Notable days
              </h2>
              {data.events.length === 0 ? (
                <p className="text-[13px] opacity-65">
                  No notable days in this window yet.
                </p>
              ) : (
                <ol className="relative border-l border-[var(--border)] pl-6">
                  {data.events.map((ev, i) => (
                    <li key={i} className="relative mb-6 last:mb-0">
                      <span
                        className="absolute -left-[29px] top-5 flex h-2.5 w-2.5 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg)]"
                        aria-hidden
                      >
                        <span className="h-1 w-1 rounded-full bg-current" />
                      </span>
                      <a
                        href={ev.article_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group block rounded-sm border border-[var(--border)] bg-[var(--bg)]/80 p-4 backdrop-blur-md transition-colors hover:border-current/40"
                      >
                        <p className="font-mono text-[10px] uppercase tracking-[0.15em] opacity-70">
                          {formatDate(ev.date)} · {ev.mentions}{" "}
                          {ev.mentions === 1 ? "mention" : "mentions"}
                        </p>
                        <p className="mt-1.5 font-serif text-[17px] leading-[1.4] tracking-tight group-hover:underline">
                          {ev.article_title}
                        </p>
                        {ev.article_source && (
                          <p className="mt-1.5 text-[11px] uppercase tracking-[0.1em] opacity-60">
                            {ev.article_source}
                          </p>
                        )}
                      </a>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            {/* Related entities */}
            <div>
              <h2 className="mb-6 text-[11px] font-medium uppercase tracking-[0.3em] opacity-70">
                Related
              </h2>
              {data.related.length === 0 ? (
                <p className="text-[13px] opacity-65">
                  Nothing co-occurs yet.
                </p>
              ) : (
                <ul className="flex flex-col gap-2 rounded-sm border border-[var(--border)] bg-[var(--bg)]/80 p-2 backdrop-blur-md">
                  {data.related.map((rel) => (
                    <li key={rel.slug}>
                      <Link
                        href={`/entity/${rel.slug}`}
                        className="group flex items-center justify-between gap-3 rounded-sm px-3 py-3 transition-colors hover:bg-[var(--border)]"
                      >
                        <div className="min-w-0">
                          <p className="font-serif text-[15px] font-medium tracking-tight">
                            {rel.name}
                          </p>
                          <p className="mt-0.5 text-[10px] uppercase tracking-[0.15em] opacity-60">
                            {TYPE_LABEL[rel.type]}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="font-mono text-[13px] tabular-nums">
                            {rel.co_occurrences}
                          </p>
                          <p className="text-[9px] uppercase tracking-[0.15em] opacity-55">
                            together
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

        {/* ───────── Recent articles ───────── */}
        <section className="mx-auto max-w-5xl px-6 pb-24">
          <h2 className="mb-6 text-[11px] font-medium uppercase tracking-[0.3em] opacity-70">
            Recent articles
          </h2>
          {data.recent_articles.length === 0 ? (
            <p className="text-[13px] opacity-65">
              No recent articles mention {data.name} yet.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {data.recent_articles.map((a) => (
                <li key={a.id}>
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start gap-4 rounded-sm border border-[var(--border)] bg-[var(--bg)]/80 p-5 backdrop-blur-md transition-colors hover:border-current/40"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.15em] opacity-75">
                        {a.source && <span>{a.source}</span>}
                        {a.source && a.published_at && (
                          <span className="opacity-50">·</span>
                        )}
                        {a.published_at && <span>{timeAgo(a.published_at)}</span>}
                      </div>
                      <h3 className="mt-2 font-serif text-[18px] font-medium leading-[1.35] tracking-tight group-hover:underline">
                        {a.title}
                      </h3>
                      {a.summary && (
                        <p className="mt-2 line-clamp-2 text-[13px] leading-[1.7] opacity-80">
                          {a.summary}
                        </p>
                      )}
                    </div>
                    <span className="mt-1 shrink-0 text-[14px] opacity-50 transition-all group-hover:translate-x-1 group-hover:opacity-90">
                      →
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <Footer />
      <CookieBanner />
    </div>
  );
}
