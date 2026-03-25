"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchTrending, fetchArticles } from "@/lib/api";
import type { Article } from "./NewsCard";
import ScrollReveal from "./ScrollReveal";
import MagneticButton from "./MagneticButton";
import RippleButton from "./RippleButton";

interface Topic {
  topic: string;
  count: number;
  category: string | null;
}

const CATEGORY_TAG_CLASS: Record<string, string> = {
  research: "category-tag category-tag-research",
  industry: "category-tag category-tag-industry",
  tools: "category-tag category-tag-tools",
  safety: "category-tag category-tag-safety",
};

const CATEGORY_LABELS: Record<string, string> = {
  research: "Research",
  industry: "Industry",
  tools: "Tools",
  safety: "Safety",
};

const TIME_WINDOWS = [
  { hours: 12, label: "12h" },
  { hours: 24, label: "24h" },
  { hours: 48, label: "48h" },
  { hours: 72, label: "72h" },
] as const;

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

const CATEGORY_GRADIENT: Record<string, string> = {
  research: "linear-gradient(135deg, rgba(140,100,240,0.25) 0%, rgba(100,60,200,0.1) 100%)",
  industry: "linear-gradient(135deg, rgba(80,140,255,0.25) 0%, rgba(60,100,200,0.1) 100%)",
  tools: "linear-gradient(135deg, rgba(60,180,160,0.25) 0%, rgba(40,140,120,0.1) 100%)",
  safety: "linear-gradient(135deg, rgba(240,160,60,0.25) 0%, rgba(200,120,40,0.1) 100%)",
};

export default function TrendingContent() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [hours, setHours] = useState(24);
  const [loading, setLoading] = useState(true);
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
  const [topicArticles, setTopicArticles] = useState<Record<string, Article[]>>({});
  const [loadingArticles, setLoadingArticles] = useState<string | null>(null);
  const [trendingStories, setTrendingStories] = useState<Article[]>([]);
  const [loadingStories, setLoadingStories] = useState(true);

  const loadTrending = useCallback(async (h: number) => {
    setLoading(true);
    setLoadingStories(true);
    try {
      const data = await fetchTrending();
      setTopics(data.topics);

      // Fetch articles for top 3 topics in parallel to show trending stories
      const topTopics = data.topics.slice(0, 3);
      if (topTopics.length > 0) {
        const results = await Promise.all(
          topTopics.map((t) => fetchArticles({ q: t.topic, limit: 4 }))
        );

        // Merge, deduplicate by id, and take top 10
        const seen = new Set<string>();
        const merged: Article[] = [];
        for (const res of results) {
          for (const article of res.articles) {
            if (!seen.has(article.id)) {
              seen.add(article.id);
              merged.push(article);
            }
          }
        }
        // Sort by most recent
        merged.sort((a, b) => {
          const da = a.published_at ? new Date(a.published_at).getTime() : 0;
          const db = b.published_at ? new Date(b.published_at).getTime() : 0;
          return db - da;
        });
        setTrendingStories(merged.slice(0, 10));
      }
    } catch {
      // silently fail — the UI shows empty state
    } finally {
      setLoading(false);
      setLoadingStories(false);
    }
  }, []);

  useEffect(() => {
    loadTrending(hours);
  }, [hours, loadTrending]);

  // When a topic is expanded, search for articles matching it
  const handleTopicClick = async (topicName: string) => {
    if (expandedTopic === topicName) {
      setExpandedTopic(null);
      return;
    }
    setExpandedTopic(topicName);

    // Already loaded
    if (topicArticles[topicName]) return;

    setLoadingArticles(topicName);
    try {
      const data = await fetchArticles({ q: topicName, limit: 5 });
      setTopicArticles((prev) => ({ ...prev, [topicName]: data.articles }));
    } catch {
      // fail silently
    } finally {
      setLoadingArticles(null);
    }
  };

  const max = topics[0]?.count ?? 1;

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-6 pb-20">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="skeleton mb-4 h-16 rounded-[10px]" />
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 pb-20 space-y-16">
      {/* Time window selector */}
      <ScrollReveal>
        <div className="flex items-center gap-3">
          <span className="text-[11px] uppercase tracking-[0.2em] text-callum-muted mr-2">
            Window
          </span>
          {TIME_WINDOWS.map(({ hours: h, label }) => (
            <MagneticButton key={h} as="button" strength={0.2}>
              <RippleButton>
                <span
                  onClick={() => {
                    setHours(h);
                    setExpandedTopic(null);
                  }}
                  className={`inline-block cursor-pointer rounded px-4 py-2 text-[11px] font-medium uppercase tracking-[0.15em] transition-all duration-300 ${
                    hours === h
                      ? "bg-[var(--text-primary)] text-[var(--bg)] category-active"
                      : "text-callum-muted hover:text-[var(--text-primary)]"
                  }`}
                >
                  {label}
                </span>
              </RippleButton>
            </MagneticButton>
          ))}
        </div>
      </ScrollReveal>

      {/* Trending Stories */}
      {!loadingStories && trendingStories.length > 0 && (
        <ScrollReveal>
          <section>
            <p className="mb-8 text-[11px] uppercase tracking-[0.3em] text-callum-muted">
              Trending Stories
            </p>
            <div className="space-y-3">
              {trendingStories.map((article, i) => (
                <a
                  key={article.id}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card-enhanced group flex gap-4 items-start rounded-[14px] overflow-hidden transition-all duration-300 block"
                >
                  {/* Article thumbnail */}
                  {article.image_url ? (
                    <div className="w-24 h-full flex-shrink-0 self-stretch overflow-hidden">
                      <img
                        src={article.image_url}
                        alt=""
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div
                      className="w-1 self-stretch flex-shrink-0 transition-all duration-300 group-hover:w-1.5"
                      style={{
                        background: CATEGORY_GRADIENT[article.category || ""] ||
                          "linear-gradient(180deg, rgba(120,120,120,0.2) 0%, transparent 100%)",
                      }}
                    />
                  )}
                  <div className="py-4 pr-5 flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1.5">
                      <span className="font-serif text-2xl font-semibold text-callum-muted opacity-20 leading-none">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {article.category && (
                        <span className={CATEGORY_TAG_CLASS[article.category] || "category-tag"}>
                          {CATEGORY_LABELS[article.category] || article.category}
                        </span>
                      )}
                      {article.published_at && (
                        <span className="text-[11px] text-callum-muted opacity-50">
                          {timeAgo(article.published_at)}
                        </span>
                      )}
                    </div>
                    <h3 className="font-serif text-lg font-semibold leading-[1.3] tracking-tight group-hover:tracking-normal transition-all duration-300 line-clamp-2">
                      {article.title}
                    </h3>
                    {article.summary && (
                      <p className="mt-1.5 text-[13px] leading-[1.6] text-callum-muted line-clamp-2">
                        {article.summary}
                      </p>
                    )}
                    {article.source && (
                      <p className="mt-2 text-[10px] uppercase tracking-[0.12em] text-callum-muted opacity-50">
                        {article.source}
                      </p>
                    )}
                  </div>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="mt-5 mr-4 shrink-0 text-callum-muted opacity-0 transition-opacity group-hover:opacity-60"
                  >
                    <path d="M7 17L17 7M17 7H7M17 7v10" />
                  </svg>
                </a>
              ))}
            </div>
          </section>
        </ScrollReveal>
      )}

      {loadingStories && (
        <div>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton mb-3 h-24 rounded-[14px]" />
          ))}
        </div>
      )}

      {/* Gradient divider */}
      {trendingStories.length > 0 && <div className="gradient-divider w-full" />}

      {/* Topic Breakdown heading */}
      {topics.length > 0 && (
        <p className="text-[11px] uppercase tracking-[0.3em] text-callum-muted -mb-10">
          Topic Breakdown
        </p>
      )}

      {/* Topics list */}
      {topics.length === 0 && !loading && (
        <div className="py-24 text-center">
          <p className="font-serif text-2xl italic text-callum-muted">
            Nothing trending yet.
          </p>
          <p className="mt-2 text-sm text-callum-muted">
            Check back soon — trends update as new articles arrive.
          </p>
        </div>
      )}

      {topics.length > 0 && (
        <ScrollReveal>
          <div className="space-y-2">
            {topics.map((t, i) => {
              const pct = (t.count / max) * 100;
              const isExpanded = expandedTopic === t.topic;
              const articles = topicArticles[t.topic];
              const isLoadingThis = loadingArticles === t.topic;

              return (
                <div key={t.topic}>
                  {/* Topic row */}
                  <button
                    onClick={() => handleTopicClick(t.topic)}
                    className={`group relative flex w-full items-center gap-4 rounded-[10px] text-left transition-all duration-300 hover:bg-[var(--text-primary)]/[0.03] ${
                      isExpanded ? "bg-[var(--text-primary)]/[0.03]" : ""
                    }`}
                  >
                    {/* Rank */}
                    <span className="w-8 shrink-0 text-right font-serif text-[14px] text-callum-muted opacity-30">
                      {i + 1}
                    </span>

                    {/* Bar + label */}
                    <div className="relative flex-1 py-4">
                      {/* Background bar */}
                      <div
                        className="absolute inset-y-0 left-0 rounded-sm bg-[var(--text-primary)] transition-all duration-1000"
                        style={{ width: `${pct}%`, opacity: 0.05 }}
                      />

                      <div className="relative flex items-center justify-between pr-4">
                        <div className="flex items-center gap-3">
                          <span className="font-serif text-xl font-semibold tracking-tight transition-all duration-300 group-hover:tracking-normal">
                            {t.topic}
                          </span>
                          {t.category && (
                            <span className={`${CATEGORY_TAG_CLASS[t.category] || "category-tag"} text-[10px]`}>
                              {CATEGORY_LABELS[t.category] || t.category}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-serif text-2xl font-semibold tabular-nums text-[var(--text-primary)] opacity-60">
                            {t.count}
                            <span className="ml-1 text-[11px] font-sans font-normal uppercase tracking-[0.1em] text-callum-muted opacity-60">
                              mentions
                            </span>
                          </span>
                          {/* Expand indicator */}
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className={`text-callum-muted transition-transform duration-300 ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          >
                            <path d="M6 9l6 6 6-6" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Expanded articles */}
                  {isExpanded && (
                    <div className="ml-12 mb-4 mt-1 space-y-2 animate-fade-in">
                      {isLoadingThis && (
                        <div className="space-y-2">
                          {[...Array(3)].map((_, j) => (
                            <div key={j} className="skeleton h-14 rounded-[10px]" />
                          ))}
                        </div>
                      )}
                      {!isLoadingThis && articles && articles.length === 0 && (
                        <p className="py-4 text-[13px] italic text-callum-muted">
                          No recent articles found for this topic.
                        </p>
                      )}
                      {!isLoadingThis &&
                        articles?.map((article) => (
                          <a
                            key={article.id}
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="card-enhanced group flex items-start gap-4 rounded-[10px] p-4 transition-all duration-300 block"
                          >
                            <div className="flex-1 min-w-0">
                              <h3 className="font-serif text-[15px] font-semibold leading-[1.4] tracking-tight group-hover:tracking-normal transition-all duration-300 line-clamp-2">
                                {article.title}
                              </h3>
                              <div className="mt-1.5 flex items-center gap-3">
                                {article.source && (
                                  <span className="text-[10px] uppercase tracking-[0.12em] text-callum-muted opacity-60">
                                    {article.source}
                                  </span>
                                )}
                                {article.published_at && (
                                  <span className="text-[10px] text-callum-muted opacity-40">
                                    {timeAgo(article.published_at)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              className="mt-1 shrink-0 text-callum-muted opacity-0 transition-opacity group-hover:opacity-60"
                            >
                              <path d="M7 17L17 7M17 7H7M17 7v10" />
                            </svg>
                          </a>
                        ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollReveal>
      )}
    </div>
  );
}
