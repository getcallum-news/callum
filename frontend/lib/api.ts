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
