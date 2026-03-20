"use client";

import TiltCard from "./TiltCard";
import ScrollReveal from "./ScrollReveal";

/**
 * Single article card with 3D tilt hover and scroll-triggered reveal.
 */

interface Article {
  id: string;
  title: string;
  summary: string | null;
  url: string;
  source: string | null;
  published_at: string | null;
  relevance_score: number;
  category: string | null;
}

interface NewsCardProps {
  article: Article;
  index: number;
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "";

  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

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
  research: "linear-gradient(135deg, rgba(140,100,240,0.3) 0%, rgba(100,60,200,0.15) 50%, rgba(80,160,220,0.2) 100%)",
  industry: "linear-gradient(135deg, rgba(80,140,255,0.3) 0%, rgba(60,100,200,0.15) 50%, rgba(100,180,255,0.2) 100%)",
  tools: "linear-gradient(135deg, rgba(60,180,160,0.3) 0%, rgba(40,140,120,0.15) 50%, rgba(80,200,180,0.2) 100%)",
  safety: "linear-gradient(135deg, rgba(240,160,60,0.3) 0%, rgba(200,120,40,0.15) 50%, rgba(240,180,80,0.2) 100%)",
};

export default function NewsCard({ article, index }: NewsCardProps) {
  return (
    <ScrollReveal delay={Math.min(index * 0.06, 0.5)}>
      <TiltCard>
        <article className="card-enhanced group rounded-[14px] mb-4 overflow-hidden transition-all duration-300">
          {/* Category gradient strip */}
          <div
            className="h-1 w-full transition-all duration-500 group-hover:h-1.5"
            style={{
              background: CATEGORY_GRADIENT[article.category || ""] || "linear-gradient(135deg, rgba(120,120,120,0.2) 0%, rgba(100,100,100,0.1) 100%)",
            }}
          />
          <div className="p-6">
          {/* Source + timestamp + category row */}
          <div className="mb-4 flex items-center gap-3">
            {article.source && (
              <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-callum-muted transition-colors group-hover:text-[var(--text-primary)]">
                {article.source}
              </span>
            )}
            {article.published_at && (
              <>
                <span className="text-callum-muted opacity-30">/</span>
                <span className="text-[11px] tracking-wide text-callum-muted">
                  {timeAgo(article.published_at)}
                </span>
              </>
            )}
            {article.category && CATEGORY_LABELS[article.category] && (
              <>
                <span className="text-callum-muted opacity-30">/</span>
                <span className={CATEGORY_TAG_CLASS[article.category] || "category-tag"}>
                  {CATEGORY_LABELS[article.category]}
                </span>
              </>
            )}
          </div>

          {/* Title */}
          <h2 className="font-serif text-2xl font-semibold leading-[1.3] tracking-tight transition-all duration-300 group-hover:tracking-normal sm:text-3xl">
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover-underline"
            >
              {article.title}
            </a>
          </h2>

          {/* Summary */}
          {article.summary && (
            <p className="mt-4 line-clamp-3 text-[15px] leading-[1.8] text-callum-muted">
              {article.summary}
            </p>
          )}

          {/* Read more */}
          <div className="mt-5">
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[13px] font-medium uppercase tracking-[0.1em] opacity-40 transition-all duration-300 group-hover:opacity-100"
            >
              <span>Read article</span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="transition-transform duration-300 group-hover:translate-x-1"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          </div>
          </div>
        </article>
      </TiltCard>
    </ScrollReveal>
  );
}

export type { Article };
