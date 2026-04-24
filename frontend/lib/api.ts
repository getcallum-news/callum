/**
 * API client for the Callum backend.
 *
 * All backend calls go through this module — centralizes the base URL
 * and error handling. Uses axios for consistent request/response
 * handling across the app.
 */

import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

/** Shape of the paginated articles response from the backend. */
interface ArticlesResponse {
  articles: Array<{
    id: string;
    title: string;
    summary: string | null;
    url: string;
    source: string | null;
    published_at: string | null;
    relevance_score: number;
    category: string | null;
    image_url: string | null;
    sentiment: string | null;
    sentiment_score: number | null;
    topic_id: number | null;
    topic_keywords: string[] | null;
  }>;
  total: number;
  page: number;
  pages: number;
}

/** Params for fetching articles. */
interface FetchArticlesParams {
  page?: number;
  limit?: number;
  category?: string;
  source?: string;
  topic_id?: number;
  q?: string;
}

/** Fetch a paginated list of articles from the backend. */
export async function fetchArticles(
  params: FetchArticlesParams = {}
): Promise<ArticlesResponse> {
  const response = await api.get<ArticlesResponse>("/news", { params });
  return response.data;
}

/** Subscribe to push notifications via the backend. */
export async function subscribeToNotifications(subscription: {
  endpoint: string;
  p256dh: string;
  auth: string;
}): Promise<void> {
  await api.post("/subscribe", subscription);
}

/** Unsubscribe from push notifications. */
export async function unsubscribeFromNotifications(
  endpoint: string
): Promise<void> {
  await api.post("/unsubscribe", { endpoint });
}

/** Stats response from the backend. */
interface StatsResponse {
  total_scanned: number;
  total_kept: number;
  sources: Record<string, number>;
  last_fetch: string | null;
}

/** Fetch cumulative stats for the live counter. */
export async function fetchStats(): Promise<StatsResponse> {
  const response = await api.get<StatsResponse>("/stats");
  return response.data;
}

interface TrendingTopic {
  topic: string;
  count: number;
  category: string | null;
}

interface TrendingResponse {
  topics: TrendingTopic[];
  window_hours: number;
}

/** Fetch trending topics from the last 24h. */
export async function fetchTrending(): Promise<TrendingResponse> {
  const response = await api.get<TrendingResponse>("/trending");
  return response.data;
}

export interface MindshareEntity {
  name: string;
  slug: string;
  type: "company" | "model" | "person";
  this_week: number;
  last_week: number;
  change_pct: number;
  trend: "up" | "down" | "neutral";
}

export interface MindshareResponse {
  entities: MindshareEntity[];
  generated_at: string;
}

/** Fetch AI mindshare leaderboard. */
export async function fetchMindshare(): Promise<MindshareResponse> {
  const response = await api.get<MindshareResponse>("/mindshare");
  return response.data;
}

export interface MindshareHistoryPoint {
  date: string; // YYYY-MM-DD
  count: number;
}

export interface MindshareHistoryEntity {
  name: string;
  slug: string;
  type: "company" | "model" | "person";
  series: MindshareHistoryPoint[];
}

export interface MindshareHistoryResponse {
  entities: MindshareHistoryEntity[];
  days: number;
  generated_at: string;
}

/** Fetch daily mindshare history for each tracked entity. */
export async function fetchMindshareHistory(
  days = 14
): Promise<MindshareHistoryResponse> {
  const response = await api.get<MindshareHistoryResponse>("/mindshare/history", {
    params: { days },
  });
  return response.data;
}

export interface Article {
  id: string;
  title: string;
  summary: string | null;
  url: string;
  source: string | null;
  published_at: string | null;
  relevance_score: number;
  category: string | null;
  image_url: string | null;
  sentiment: string | null;
  sentiment_score: number | null;
  topic_id: number | null;
  topic_keywords: string[] | null;
}

export interface RelatedEntity {
  name: string;
  slug: string;
  type: "company" | "model" | "person";
  co_occurrences: number;
}

export interface EntityEvent {
  date: string;
  article_title: string;
  article_url: string;
  article_source: string | null;
  mentions: number;
}

export interface EntityDetailResponse {
  name: string;
  slug: string;
  type: "company" | "model" | "person";
  this_week: number;
  last_week: number;
  change_pct: number;
  trend: "up" | "down" | "neutral";
  rank: number;
  peak: number;
  avg_per_day: number;
  total_mentions: number;
  window_days: number;
  series: MindshareHistoryPoint[];
  recent_articles: Article[];
  related: RelatedEntity[];
  events: EntityEvent[];
  generated_at: string;
}

/** Fetch the full detail payload for a single entity. */
export async function fetchEntityDetail(
  slug: string,
  days = 30
): Promise<EntityDetailResponse> {
  const response = await api.get<EntityDetailResponse>(`/entity/${slug}`, {
    params: { days },
  });
  return response.data;
}

/** URL-safe slug for an entity name — mirror of the backend slugify(). */
export function slugifyEntity(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ---------------------------------------------------------------------------
// Topic clustering
// ---------------------------------------------------------------------------

export interface TopicSummary {
  id: number;
  label: string;
  top_terms: string[];
  article_count: number;
  updated_at: string | null;
  sample_articles: Article[];
}

export interface TopicListResponse {
  topics: TopicSummary[];
  total_clustered: number;
  total_articles: number;
  generated_at: string;
}

export interface TopicDetailResponse {
  id: number;
  label: string;
  top_terms: string[];
  article_count: number;
  updated_at: string | null;
  articles: {
    articles: Article[];
    total: number;
    page: number;
    pages: number;
  };
  generated_at: string;
}

/** Fetch all topic clusters for the /topics discovery page. */
export async function fetchTopics(): Promise<TopicListResponse> {
  const response = await api.get<TopicListResponse>("/topics");
  return response.data;
}

/** Fetch a single topic with its paginated articles. */
export async function fetchTopic(
  id: number,
  page = 1,
  limit = 20
): Promise<TopicDetailResponse> {
  const response = await api.get<TopicDetailResponse>(`/topics/${id}`, {
    params: { page, limit },
  });
  return response.data;
}
