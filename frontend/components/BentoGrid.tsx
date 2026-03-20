"use client";

import ScrollReveal from "./ScrollReveal";
import TiltCard from "./TiltCard";
import type { Article } from "./NewsCard";

/**
 * Bento grid layout for articles.
 * First article gets a large featured card spanning the left column.
 * Next 2 articles stack in the right column.
 * Remaining articles render in a standard 2-column grid.
 */

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

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function FeaturedCard({ article }: { article: Article }) {
  return (
    <ScrollReveal delay={0}>
      <TiltCard>
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block h-full"
        >
          <article className="card-enhanced group rounded-[14px] h-full overflow-hidden transition-all duration-300">
            <div
              className="h-1.5 w-full transition-all duration-500 group-hover:h-2"
              style={{
                background: CATEGORY_GRADIENT[article.category || ""] || "linear-gradient(135deg, rgba(120,120,120,0.2) 0%, rgba(100,100,100,0.1) 100%)",
              }}
            />
            <div className="p-8 flex flex-col justify-between h-[calc(100%-6px)]">
              <div>
                {article.category && CATEGORY_LABELS[article.category] && (
                  <span className={CATEGORY_TAG_CLASS[article.category] || "category-tag"}>
                    {CATEGORY_LABELS[article.category]}
                  </span>
                )}
                <h2 className="mt-4 font-serif text-3xl font-semibold leading-[1.2] tracking-tight transition-all duration-300 group-hover:tracking-normal sm:text-4xl">
                  <span className="hover-underline">{article.title}</span>
                </h2>
                {article.summary && (
                  <p className="mt-4 line-clamp-4 text-[15px] leading-[1.8] text-callum-muted">
                    {article.summary}
                  </p>
                )}
              </div>
              <div className="mt-6 flex items-center justify-between text-[11px] text-callum-muted">
                <span>
                  {article.source && <span className="font-semibold uppercase tracking-[0.15em]">{article.source}</span>}
                  {article.published_at && <span className="ml-2 opacity-60">{timeAgo(article.published_at)}</span>}
                </span>
                <span className="inline-flex items-center gap-1 opacity-40 transition-opacity group-hover:opacity-100 text-[12px] font-medium uppercase tracking-[0.1em]">
                  Read
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="transition-transform group-hover:translate-x-1">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </div>
          </article>
        </a>
      </TiltCard>
    </ScrollReveal>
  );
}

function SmallCard({ article, index }: { article: Article; index: number }) {
  return (
    <ScrollReveal delay={Math.min(index * 0.08, 0.3)}>
      <TiltCard>
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block h-full"
        >
          <article className="card-enhanced group rounded-[14px] h-full overflow-hidden transition-all duration-300">
            <div
              className="h-1 w-full transition-all duration-500 group-hover:h-1.5"
              style={{
                background: CATEGORY_GRADIENT[article.category || ""] || "linear-gradient(135deg, rgba(120,120,120,0.2) 0%, rgba(100,100,100,0.1) 100%)",
              }}
            />
            <div className="p-6 flex flex-col justify-between h-[calc(100%-4px)]">
              <div>
                {article.category && CATEGORY_LABELS[article.category] && (
                  <span className={CATEGORY_TAG_CLASS[article.category] || "category-tag"}>
                    {CATEGORY_LABELS[article.category]}
                  </span>
                )}
                <h3 className="mt-3 font-serif text-xl font-semibold leading-[1.3] tracking-tight transition-all duration-300 group-hover:tracking-normal">
                  <span className="hover-underline">{article.title}</span>
                </h3>
                {article.summary && (
                  <p className="mt-3 line-clamp-2 text-[13px] leading-[1.7] text-callum-muted">
                    {article.summary}
                  </p>
                )}
              </div>
              <div className="mt-4 flex items-center justify-between text-[11px] text-callum-muted">
                <span>
                  {article.source && <span className="font-semibold uppercase tracking-[0.1em]">{article.source}</span>}
                  {article.published_at && <span className="ml-2 opacity-60">{timeAgo(article.published_at)}</span>}
                </span>
                <span className="opacity-0 transition-opacity group-hover:opacity-60 text-[11px]">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </div>
          </article>
        </a>
      </TiltCard>
    </ScrollReveal>
  );
}

interface BentoGridProps {
  articles: Article[];
}

export default function BentoGrid({ articles }: BentoGridProps) {
  if (articles.length === 0) return null;

  const featured = articles[0];
  const sideCards = articles.slice(1, 3);
  const remaining = articles.slice(3);

  return (
    <div>
      {/* Top bento: 1 featured + 2 small */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:grid-rows-2">
        {/* Featured card spanning both rows */}
        <div className="md:row-span-2">
          <FeaturedCard article={featured} />
        </div>

        {/* Side cards */}
        {sideCards.map((article, i) => (
          <div key={article.id}>
            <SmallCard article={article} index={i + 1} />
          </div>
        ))}
      </div>

      {/* Remaining articles in 2-col grid */}
      {remaining.length > 0 && (
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {remaining.map((article, i) => (
            <div key={article.id}>
              <SmallCard article={article} index={i + 3} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
