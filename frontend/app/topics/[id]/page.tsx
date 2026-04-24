import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import NewsCard from "@/components/NewsCard";
import type { TopicDetailResponse } from "@/lib/api";

interface PageProps {
  params: { id: string };
  searchParams: { page?: string };
}

async function loadTopic(id: string, page: number): Promise<TopicDetailResponse | null> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  try {
    const res = await fetch(
      `${baseUrl}/topics/${id}?page=${page}&limit=20`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const data = await loadTopic(params.id, 1);
  if (!data) return { title: "Topic not found — Callum" };
  return {
    title: `${data.label} — Topics · Callum`,
    description: `${data.article_count} articles on ${data.top_terms.slice(0, 5).join(", ")}. Discovered automatically by BERTopic.`,
  };
}

export default async function TopicDetailPage({ params, searchParams }: PageProps) {
  const page = Math.max(1, parseInt(searchParams.page || "1", 10));
  const data = await loadTopic(params.id, page);

  if (!data) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-4xl px-6 pb-24 pt-16 text-center">
          <p className="font-serif text-2xl italic text-callum-muted">Topic not found.</p>
          <Link href="/topics" className="mt-6 inline-block text-[11px] uppercase tracking-[0.15em] opacity-60 hover:opacity-100">
            ← All topics
          </Link>
        </main>
      </>
    );
  }

  const { articles } = data;

  return (
    <>
      <Header />
      <main className="mx-auto max-w-4xl px-6 pb-24 pt-16">
        {/* Back link */}
        <Link
          href="/topics"
          className="mb-8 inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.15em] text-callum-muted transition-opacity hover:opacity-100 opacity-60"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          All Topics
        </Link>

        {/* Topic header */}
        <div className="mb-10">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.3em] text-callum-muted">
            Topic Cluster
          </p>
          <h1 className="font-serif text-4xl font-semibold leading-[1.15] tracking-tight sm:text-5xl">
            {data.label}
          </h1>

          {/* Keyword pills */}
          <div className="mt-5 flex flex-wrap gap-2">
            {data.top_terms.map((term) => (
              <span
                key={term}
                className="inline-block rounded-full border border-current/20 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.1em] text-callum-muted"
              >
                {term}
              </span>
            ))}
          </div>

          <p className="mt-5 text-[13px] text-callum-muted">
            {data.article_count.toLocaleString()} article{data.article_count !== 1 ? "s" : ""} in this topic
          </p>
        </div>

        <div className="gradient-divider mb-10 w-full" />

        {/* Article list */}
        {articles.articles.length === 0 ? (
          <p className="py-16 text-center font-serif text-xl italic text-callum-muted">
            No articles in this topic yet.
          </p>
        ) : (
          <div>
            {articles.articles.map((article, index) => (
              <NewsCard key={article.id} article={article} index={index} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {articles.pages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-4">
            {page > 1 && (
              <Link
                href={`/topics/${params.id}?page=${page - 1}`}
                className="border border-[var(--border)] px-6 py-2.5 text-[11px] font-medium uppercase tracking-[0.15em] transition-all hover:bg-[var(--text-primary)] hover:text-[var(--bg)]"
              >
                ← Previous
              </Link>
            )}
            <span className="text-[12px] text-callum-muted">
              Page {page} of {articles.pages}
            </span>
            {page < articles.pages && (
              <Link
                href={`/topics/${params.id}?page=${page + 1}`}
                className="border border-[var(--border)] px-6 py-2.5 text-[11px] font-medium uppercase tracking-[0.15em] transition-all hover:bg-[var(--text-primary)] hover:text-[var(--bg)]"
              >
                Next →
              </Link>
            )}
          </div>
        )}
      </main>
    </>
  );
}
