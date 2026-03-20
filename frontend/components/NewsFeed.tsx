"use client";

import { useCallback, useEffect, useState } from "react";
import NewsCard from "./NewsCard";
import type { Article } from "./NewsCard";
import SkeletonCard from "./SkeletonCard";
import PullToRefresh from "./PullToRefresh";
import MagneticButton from "./MagneticButton";
import RippleButton from "./RippleButton";
import BentoGrid from "./BentoGrid";
import { fetchArticles } from "@/lib/api";

const CATEGORIES = [
  { key: null, label: "All" },
  { key: "research", label: "Research" },
  { key: "industry", label: "Industry" },
  { key: "tools", label: "Tools" },
  { key: "safety", label: "Safety" },
] as const;

const PAGE_SIZE = 20;

export default function NewsFeed() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [category, setCategory] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadArticles = useCallback(
    async (pageNum: number, append: boolean = false) => {
      try {
        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }
        setError(null);

        const data = await fetchArticles({
          page: pageNum,
          limit: PAGE_SIZE,
          category: category || undefined,
        });

        if (append) {
          setArticles((prev) => [...prev, ...data.articles]);
        } else {
          setArticles(data.articles);
        }

        setTotalPages(data.pages);
        setTotal(data.total);
        setPage(pageNum);
      } catch {
        setError("Could not load news. Please try again.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [category]
  );

  useEffect(() => {
    loadArticles(1);
  }, [loadArticles]);

  const handleLoadMore = () => {
    if (page < totalPages) {
      loadArticles(page + 1, true);
    }
  };

  const handleCategoryChange = (newCategory: string | null) => {
    setCategory(newCategory);
    setPage(1);
  };

  const handlePullRefresh = async () => {
    await loadArticles(1);
  };

  return (
    <PullToRefresh onRefresh={handlePullRefresh}>
      <section className="mx-auto max-w-4xl px-6 pb-16">
        {/* Filter bar */}
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-5">
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map(({ key, label }) => (
              <MagneticButton key={label} as="button" strength={0.2}>
                <RippleButton>
                  <span
                    onClick={() => handleCategoryChange(key)}
                    className={`inline-block px-4 py-2 text-[11px] font-medium uppercase tracking-[0.15em] transition-all duration-300 cursor-pointer rounded ${
                      category === key
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
          {!loading && (
            <span className="text-[11px] tracking-wide text-callum-muted">
              {total} article{total !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Loading state — shimmer skeletons */}
        {loading && (
          <div>
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonCard key={i} index={i} />
            ))}
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="py-24 text-center">
            <p className="font-serif text-xl italic text-callum-muted">
              {error}
            </p>
            <MagneticButton as="div" className="mt-6 inline-block">
              <button
                onClick={() => loadArticles(1)}
                className="border border-[var(--border)] px-8 py-3 text-[11px] font-medium uppercase tracking-[0.15em] transition-all duration-300 hover:bg-[var(--text-primary)] hover:text-[var(--bg)]"
              >
                Try again
              </button>
            </MagneticButton>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && articles.length === 0 && (
          <div className="py-24 text-center">
            <p className="font-serif text-2xl italic text-callum-muted">
              No articles found.
            </p>
            <p className="mt-2 text-sm text-callum-muted">
              Check back soon — we fetch new stories every 30 minutes.
            </p>
          </div>
        )}

        {/* Article list */}
        {!loading && !error && articles.length > 0 && (
          <>
            {/* Bento grid for top articles */}
            <BentoGrid articles={articles.slice(0, 5)} />

            {/* Remaining articles as standard cards */}
            {articles.length > 5 && (
              <div className="mt-6">
                {articles.slice(5).map((article, index) => (
                  <NewsCard key={article.id} article={article} index={index + 5} />
                ))}
              </div>
            )}

            {/* Load more */}
            {page < totalPages && (
              <div className="pt-16 text-center">
                <MagneticButton as="div" className="inline-block">
                  <RippleButton>
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="group relative border border-[var(--border)] px-12 py-4 text-[11px] font-medium uppercase tracking-[0.2em] transition-all duration-500 hover:border-callum-muted hover:bg-[var(--text-primary)] hover:text-[var(--bg)] disabled:opacity-30 rounded"
                  >
                    {loadingMore ? (
                      <span className="inline-flex items-center gap-2">
                        <svg
                          className="h-3 w-3 animate-spin"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                        </svg>
                        Loading
                      </span>
                    ) : (
                      "Load more stories"
                    )}
                  </button>
                  </RippleButton>
                </MagneticButton>
              </div>
            )}
          </>
        )}
      </section>
    </PullToRefresh>
  );
}
