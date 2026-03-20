"use client";

/**
 * Shimmer skeleton loading card — matches the NewsCard layout.
 * Uses animated gradient shimmer for a polished loading state.
 */
export default function SkeletonCard({ index = 0 }: { index?: number }) {
  return (
    <div
      className="border-b border-[var(--border)] py-10"
      style={{
        opacity: 0,
        animation: `fadeInUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) ${index * 0.08}s forwards`,
      }}
    >
      {/* Source + timestamp row */}
      <div className="mb-4 flex items-center gap-3">
        <div className="skeleton h-3 w-16 rounded-sm" />
        <div className="skeleton h-3 w-12 rounded-sm" />
      </div>

      {/* Title lines */}
      <div className="space-y-2.5">
        <div className="skeleton h-7 w-[90%] rounded-sm" />
        <div className="skeleton h-7 w-[65%] rounded-sm" />
      </div>

      {/* Summary lines */}
      <div className="mt-5 space-y-2">
        <div className="skeleton h-4 w-full rounded-sm" />
        <div className="skeleton h-4 w-[85%] rounded-sm" />
        <div className="skeleton h-4 w-[60%] rounded-sm" />
      </div>

      {/* Read more placeholder */}
      <div className="mt-5">
        <div className="skeleton h-3 w-20 rounded-sm" />
      </div>
    </div>
  );
}
