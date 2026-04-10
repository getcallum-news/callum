import type { Metadata } from "next";
import { notFound } from "next/navigation";
import EntityPageClient from "./EntityPageClient";
import { fetchEntityDetail, EntityDetailResponse } from "@/lib/api";

interface PageProps {
  params: { slug: string };
  searchParams?: { days?: string };
}

/**
 * Server-side fetch used by both `generateMetadata` and the page itself.
 * Next.js dedupes identical fetches within a single request, so this only
 * hits the backend once per page load.
 */
async function loadEntity(slug: string, days: number): Promise<EntityDetailResponse | null> {
  try {
    return await fetchEntityDetail(slug, days);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const data = await loadEntity(params.slug, 30);
  if (!data) {
    return {
      title: "Entity not found — Callum",
    };
  }

  const trendLabel =
    data.trend === "up"
      ? "gaining mindshare"
      : data.trend === "down"
      ? "losing mindshare"
      : "holding steady";

  return {
    title: `${data.name} — AI mindshare · Callum`,
    description: `${data.name} is ${trendLabel} — ${data.this_week} mentions this week (${
      data.change_pct >= 0 ? "+" : ""
    }${data.change_pct.toFixed(1)}% vs last week). Track history, recent articles, and related entities on Callum.`,
    openGraph: {
      title: `${data.name} — AI mindshare · Callum`,
      description: `${data.this_week} mentions this week. ${
        data.change_pct >= 0 ? "+" : ""
      }${data.change_pct.toFixed(1)}% vs last week.`,
      type: "article",
    },
  };
}

export default async function Page({ params, searchParams }: PageProps) {
  const days = Math.max(
    7,
    Math.min(90, Number(searchParams?.days) || 30)
  );
  const data = await loadEntity(params.slug, days);
  if (!data) notFound();

  return <EntityPageClient initialData={data} />;
}
