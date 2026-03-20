"use client";

import { useEffect, useState } from "react";
import { fetchArticles, fetchStats, fetchTrending } from "@/lib/api";
import type { Article } from "./NewsCard";
import ScrollReveal from "./ScrollReveal";

const CATEGORY_LABELS: Record<string, string> = {
  research: "Research",
  industry: "Industry",
  tools: "Tools",
  safety: "Safety",
};

const CATEGORY_TAG_CLASS: Record<string, string> = {
  research: "category-tag category-tag-research",
  industry: "category-tag category-tag-industry",
  tools: "category-tag category-tag-tools",
  safety: "category-tag category-tag-safety",
};

const CATEGORY_GRADIENT: Record<string, string> = {
  research: "linear-gradient(135deg, rgba(140,100,240,0.25) 0%, rgba(100,60,200,0.1) 100%)",
  industry: "linear-gradient(135deg, rgba(80,140,255,0.25) 0%, rgba(60,100,200,0.1) 100%)",
  tools: "linear-gradient(135deg, rgba(60,180,160,0.25) 0%, rgba(40,140,120,0.1) 100%)",
  safety: "linear-gradient(135deg, rgba(240,160,60,0.25) 0%, rgba(200,120,40,0.1) 100%)",
};

const CATEGORY_BAR_COLOR: Record<string, string> = {
  research: "#b794f6",
  industry: "#7cb3ff",
  tools: "#5ec4b0",
  safety: "#f0a03c",
};

const SARCASTIC_MOODS = [
  { label: "Cautiously Optimistic", desc: "Everyone's excited but nobody wants to say it out loud." },
  { label: "Chaotically Bullish", desc: "Three breakthroughs dropped this week and the vibes are unhinged." },
  { label: "Professionally Alarmed", desc: "A lot of researchers writing a lot of concerned blog posts." },
  { label: "Quietly Revolutionary", desc: "The papers that will matter most barely made headlines." },
  { label: "Hype-Adjacent", desc: "Big announcements, vague benchmarks, incredible PR." },
];

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getWeekLabel(): string {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay()); // Sunday
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return `${start.toLocaleDateString("en-US", { month: "long", day: "numeric" })} — ${end.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`;
}

interface TrendingTopic {
  topic: string;
  count: number;
  category: string | null;
}

export default function RewindContent() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [stats, setStats] = useState<{ total_scanned: number; total_kept: number; sources: Record<string, number> } | null>(null);
  const [trending, setTrending] = useState<TrendingTopic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchArticles({ page: 1, limit: 50 }),
      fetchStats(),
      fetchTrending(),
    ])
      .then(([articlesData, statsData, trendingData]) => {
        setArticles(articlesData.articles);
        setStats(statsData);
        setTrending(trendingData.topics.slice(0, 8));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Category breakdown
  const categoryCounts = articles.reduce<Record<string, number>>((acc, a) => {
    if (a.category) acc[a.category] = (acc[a.category] || 0) + 1;
    return acc;
  }, {});
  const totalCategorized = Object.values(categoryCounts).reduce((a, b) => a + b, 0);

  // Top sources
  const sourceCounts = articles.reduce<Record<string, number>>((acc, a) => {
    if (a.source) acc[a.source] = (acc[a.source] || 0) + 1;
    return acc;
  }, {});
  const topSources = Object.entries(sourceCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Top 5 stories (highest relevance)
  const topStories = [...articles]
    .sort((a, b) => b.relevance_score - a.relevance_score)
    .slice(0, 5);

  // Pick a weekly mood based on day of year for consistency
  const moodIndex = Math.floor(new Date().getTime() / (7 * 24 * 60 * 60 * 1000)) % SARCASTIC_MOODS.length;
  const mood = SARCASTIC_MOODS[moodIndex];

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-6 pb-20">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton mb-6 h-32 rounded-[14px]" />
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 pb-20 space-y-20">

      {/* Week label + mood */}
      <ScrollReveal>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          {/* Week */}
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-callum-muted mb-1">Week of</p>
            <p className="font-serif text-2xl font-semibold">{getWeekLabel()}</p>
          </div>

          {/* Mood badge */}
          <div className="card-enhanced rounded-[14px] p-5 sm:text-right">
            <p className="text-[10px] uppercase tracking-[0.2em] text-callum-muted mb-1">This week&apos;s vibe</p>
            <p className="font-serif text-lg font-semibold">{mood.label}</p>
            <p className="mt-1 text-[12px] italic text-callum-muted">{mood.desc}</p>
          </div>
        </div>
      </ScrollReveal>

      {/* Gradient divider */}
      <div className="gradient-divider w-full" />

      {/* Top 5 Stories */}
      <ScrollReveal>
        <section>
          <p className="mb-8 text-[11px] uppercase tracking-[0.3em] text-callum-muted">
            Top Stories This Week
          </p>
          <div className="space-y-4">
            {topStories.map((article, i) => (
              <a
                key={article.id}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="card-enhanced group flex gap-5 items-start rounded-[14px] overflow-hidden transition-all duration-300 block"
              >
                {/* Category color strip */}
                <div
                  className="w-1 self-stretch flex-shrink-0 transition-all duration-300 group-hover:w-1.5"
                  style={{
                    background: CATEGORY_GRADIENT[article.category || ""] ||
                      "linear-gradient(180deg, rgba(120,120,120,0.2) 0%, transparent 100%)",
                  }}
                />
                <div className="py-5 pr-5 flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-serif text-3xl font-semibold text-callum-muted opacity-30 leading-none">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {article.category && (
                      <span className={CATEGORY_TAG_CLASS[article.category] || "category-tag"}>
                        {CATEGORY_LABELS[article.category]}
                      </span>
                    )}
                    {article.published_at && (
                      <span className="text-[11px] text-callum-muted opacity-50">{timeAgo(article.published_at)}</span>
                    )}
                  </div>
                  <h3 className="font-serif text-xl font-semibold leading-[1.3] tracking-tight group-hover:tracking-normal transition-all duration-300 line-clamp-2">
                    {article.title}
                  </h3>
                  {article.source && (
                    <p className="mt-2 text-[11px] uppercase tracking-[0.1em] text-callum-muted opacity-60">
                      {article.source}
                    </p>
                  )}
                </div>
              </a>
            ))}
          </div>
        </section>
      </ScrollReveal>

      {/* Gradient divider */}
      <div className="gradient-divider w-full" />

      {/* Category Breakdown */}
      <ScrollReveal delay={0.1}>
        <section>
          <p className="mb-8 text-[11px] uppercase tracking-[0.3em] text-callum-muted">
            What We Covered
          </p>
          <div className="space-y-4">
            {Object.entries(categoryCounts)
              .sort(([, a], [, b]) => b - a)
              .map(([cat, count]) => {
                const pct = totalCategorized > 0 ? (count / totalCategorized) * 100 : 0;
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={CATEGORY_TAG_CLASS[cat] || "category-tag"}>
                        {CATEGORY_LABELS[cat] || cat}
                      </span>
                      <span className="text-[12px] text-callum-muted">
                        {count} articles · {pct.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-[var(--border)] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${pct}%`,
                          background: CATEGORY_BAR_COLOR[cat] || "var(--text-primary)",
                          opacity: 0.7,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>

          {stats && (
            <p className="mt-6 text-[12px] italic text-callum-muted opacity-50">
              From {stats.total_kept.toLocaleString()} articles that survived Callum&apos;s filter this week. The other {(stats.total_scanned - stats.total_kept).toLocaleString()} didn&apos;t make it. Brutal, but fair.
            </p>
          )}
        </section>
      </ScrollReveal>

      {/* Gradient divider */}
      <div className="gradient-divider w-full" />

      {/* Top Sources */}
      <ScrollReveal delay={0.1}>
        <section>
          <p className="mb-8 text-[11px] uppercase tracking-[0.3em] text-callum-muted">
            Most Active Sources
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {topSources.map(([source, count], i) => (
              <div
                key={source}
                className="card-enhanced rounded-[14px] p-5 flex items-center justify-between group transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <span className="font-serif text-2xl font-semibold text-callum-muted opacity-25">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="font-medium text-[14px] uppercase tracking-[0.08em]">{source}</span>
                </div>
                <span className="text-[12px] text-callum-muted">
                  {count} {count === 1 ? "story" : "stories"}
                </span>
              </div>
            ))}
          </div>
        </section>
      </ScrollReveal>

      {/* Gradient divider */}
      {trending.length > 0 && <div className="gradient-divider w-full" />}

      {/* Trending Topics */}
      {trending.length > 0 && (
        <ScrollReveal delay={0.1}>
          <section>
            <p className="mb-8 text-[11px] uppercase tracking-[0.3em] text-callum-muted">
              What Everyone Kept Talking About
            </p>
            <div className="flex flex-wrap gap-3">
              {trending.map((topic, i) => (
                <span
                  key={topic.topic}
                  className={`${CATEGORY_TAG_CLASS[topic.category || ""] || "category-tag"} text-[11px] px-4 py-2 transition-all duration-300`}
                  style={{
                    fontSize: `${Math.max(10, 14 - i)}px`,
                    opacity: Math.max(0.5, 1 - i * 0.08),
                  }}
                >
                  {topic.topic}
                  <span className="ml-2 opacity-50">×{topic.count}</span>
                </span>
              ))}
            </div>
          </section>
        </ScrollReveal>
      )}

      {/* Gradient divider */}
      <div className="gradient-divider w-full" />

      {/* Closing line */}
      <ScrollReveal delay={0.1}>
        <div className="py-8 text-center">
          <p className="font-serif text-2xl font-semibold italic leading-relaxed tracking-tight sm:text-3xl text-callum-muted opacity-60">
            &ldquo;That&apos;s the week. It was a lot. It always is.&rdquo;
          </p>
          <p className="mt-4 text-[11px] uppercase tracking-[0.2em] text-callum-muted opacity-40">
            — See you next Sunday. We&apos;ll have read everything. As usual.
          </p>
        </div>
      </ScrollReveal>

    </div>
  );
}
