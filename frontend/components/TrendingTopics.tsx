"use client";

import { useEffect, useState } from "react";
import { fetchTrending } from "@/lib/api";

interface Topic {
  topic: string;
  count: number;
  category: string | null;
}

const CATEGORY_COLORS: Record<string, string> = {
  research: "opacity-100",
  industry: "opacity-80",
  tools:    "opacity-70",
  safety:   "opacity-60",
};

export default function TrendingTopics() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    fetchTrending()
      .then((data) => {
        setTopics(data.topics);
        setTimeout(() => setVisible(true), 200);
      })
      .catch(() => {});
  }, []);

  if (topics.length === 0) return null;

  const max = topics[0]?.count ?? 1;

  return (
    <section
      className={`mx-auto max-w-4xl px-6 py-16 transition-all duration-1000 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <div className="mb-8 flex items-baseline justify-between">
        <h2 className="text-[11px] font-medium uppercase tracking-[0.3em] text-callum-muted">
          Trending today
        </h2>
        <span className="text-[11px] italic text-callum-muted opacity-50">
          last 24 hours
        </span>
      </div>

      <div className="space-y-3">
        {topics.map((t, i) => {
          const pct = (t.count / max) * 100;
          const opacity = CATEGORY_COLORS[t.category ?? ""] ?? "opacity-60";

          return (
            <div
              key={t.topic}
              className={`animate-fade-in-up stagger-${Math.min(i + 1, 10)} group relative flex items-center gap-4`}
            >
              {/* Rank */}
              <span className="w-5 shrink-0 text-right font-serif text-[13px] text-callum-muted opacity-30">
                {i + 1}
              </span>

              {/* Bar + label */}
              <div className="relative flex-1">
                {/* Background bar */}
                <div
                  className="absolute inset-y-0 left-0 rounded-sm bg-[var(--text-primary)] transition-all duration-1000"
                  style={{ width: `${pct}%`, opacity: 0.05 }}
                />
                {/* Hover fill */}
                <div
                  className="absolute inset-y-0 left-0 rounded-sm bg-[var(--text-primary)] opacity-0 transition-all duration-500 group-hover:opacity-[0.08]"
                  style={{ width: "100%" }}
                />

                <div className="relative flex items-center justify-between px-4 py-3">
                  <span
                    className={`font-serif text-lg font-semibold tracking-tight transition-all duration-300 group-hover:tracking-normal ${opacity}`}
                  >
                    {t.topic}
                  </span>
                  <div className="flex items-center gap-3">
                    {t.category && (
                      <span className="text-[10px] uppercase tracking-[0.15em] text-callum-muted opacity-50">
                        {t.category}
                      </span>
                    )}
                    <span className="font-serif text-2xl font-semibold tabular-nums text-[var(--text-primary)] opacity-60">
                      {t.count}
                      <span className="ml-1 text-[11px] font-sans font-normal uppercase tracking-[0.1em] text-callum-muted opacity-60">
                        mentions
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
