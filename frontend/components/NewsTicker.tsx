"use client";

import { useEffect, useState } from "react";
import { fetchArticles } from "@/lib/api";

/**
 * Horizontal scrolling marquee of latest headlines.
 * Pauses on hover. Duplicated content for seamless loop.
 */
export default function NewsTicker() {
  const [headlines, setHeadlines] = useState<string[]>([]);

  useEffect(() => {
    fetchArticles({ page: 1, limit: 10 })
      .then((data) => {
        setHeadlines(data.articles.map((a: { title: string }) => a.title));
      })
      .catch(() => {
        // Silently fail — ticker is decorative
      });
  }, []);

  if (headlines.length === 0) return null;

  const separator = (
    <span className="mx-6 text-callum-muted opacity-30">◆</span>
  );

  const content = headlines.map((h, i) => (
    <span key={i} className="inline-flex items-center">
      <span className="whitespace-nowrap text-[11px] font-medium uppercase tracking-[0.12em] text-callum-muted">
        {h}
      </span>
      {separator}
    </span>
  ));

  return (
    <div className="overflow-hidden border-b border-[var(--border)] py-3">
      <div className="marquee-track">
        {/* Duplicate for seamless loop */}
        <div className="flex">{content}</div>
        <div className="flex">{content}</div>
      </div>
    </div>
  );
}
