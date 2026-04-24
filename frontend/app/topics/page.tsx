import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import type { TopicListResponse } from "@/lib/api";

export const metadata: Metadata = {
  title: "Topics — Callum",
  description:
    "Browse AI news by automatically discovered topic clusters. BERTopic + sentence embeddings find recurring themes across hundreds of articles.",
  openGraph: {
    title: "Topics — Callum",
    description: "Browse AI news by automatically discovered topic clusters.",
    siteName: "Callum",
    locale: "en_US",
    type: "website",
  },
};

async function loadTopics(): Promise<TopicListResponse | null> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  try {
    const res = await fetch(`${baseUrl}/topics`, {
      next: { revalidate: 3600 }, // cache for 1 hour — topics change only on daily recluster
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default async function TopicsPage() {
  const data = await loadTopics();

  return (
    <>
      <Header />
      <main className="mx-auto max-w-4xl px-6 pb-24 pt-16">
        {/* Page header */}
        <div className="mb-12">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.3em] text-callum-muted">
            AI News
          </p>
          <h1 className="font-serif text-4xl font-semibold leading-[1.15] tracking-tight sm:text-5xl">
            Topics
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-[1.8] text-callum-muted">
            Recurring themes discovered automatically across{" "}
            {data ? (
              <span className="text-[var(--text-primary)]">
                {data.total_articles.toLocaleString()} articles
              </span>
            ) : (
              "hundreds of articles"
            )}{" "}
            using BERTopic + sentence embeddings.
          </p>
          {data && data.topics.length > 0 && (
            <p className="mt-2 text-[13px] text-callum-muted">
              {data.total_clustered.toLocaleString()} articles clustered ·{" "}
              {data.topics.length} topics
            </p>
          )}
        </div>

        <div className="gradient-divider mb-12 w-full" />

        {/* No data yet */}
        {(!data || data.topics.length === 0) && (
          <div className="py-24 text-center">
            <p className="font-serif text-2xl italic text-callum-muted">
              Topics are being discovered…
            </p>
            <p className="mt-3 text-[14px] leading-relaxed text-callum-muted">
              BERTopic runs daily at 03:00 UTC. Check back soon.
            </p>
          </div>
        )}

        {/* Topic grid */}
        {data && data.topics.length > 0 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {data.topics.map((topic) => (
              <Link
                key={topic.id}
                href={`/topics/${topic.id}`}
                className="group flex flex-col gap-4 rounded-[14px] border border-[var(--border)] bg-[var(--bg)]/60 p-6 backdrop-blur-sm transition-all duration-300 hover:border-current/30 hover:bg-[var(--bg)]/80"
              >
                {/* Topic label + count */}
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-serif text-lg font-medium leading-tight tracking-tight">
                    {topic.label}
                  </h2>
                  <span className="shrink-0 rounded-full border border-[var(--border)] px-2.5 py-0.5 text-[11px] tracking-wide text-callum-muted">
                    {topic.article_count}
                  </span>
                </div>

                {/* Keyword pills */}
                <div className="flex flex-wrap gap-1.5">
                  {topic.top_terms.slice(0, 6).map((term) => (
                    <span
                      key={term}
                      className="inline-block rounded-full border border-[var(--border)] px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em] text-callum-muted"
                    >
                      {term}
                    </span>
                  ))}
                </div>

                {/* Sample article titles */}
                {topic.sample_articles.length > 0 && (
                  <ul className="flex flex-col gap-2 border-t border-[var(--border)] pt-4">
                    {topic.sample_articles.map((a) => (
                      <li key={a.id} className="flex items-start gap-2">
                        <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-callum-muted opacity-50" />
                        <span className="line-clamp-1 text-[13px] leading-snug text-callum-muted transition-colors group-hover:text-[var(--text-primary)]">
                          {a.title}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Browse link */}
                <div className="flex items-center justify-between">
                  {topic.updated_at && (
                    <span className="text-[10px] tracking-wide text-callum-muted opacity-50">
                      Updated {timeAgo(topic.updated_at)}
                    </span>
                  )}
                  <span className="ml-auto text-[11px] font-medium uppercase tracking-[0.15em] opacity-40 transition-opacity group-hover:opacity-100">
                    Browse →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
