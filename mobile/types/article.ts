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
}

export interface ArticlesResponse {
  articles: Article[];
  total: number;
  page: number;
  pages: number;
}

export interface TrendingTopic {
  topic: string;
  count: number;
  category: string | null;
}

export interface TrendingResponse {
  topics: TrendingTopic[];
  window_hours: number;
}

export interface StatsResponse {
  total_scanned: number;
  total_kept: number;
  sources: Record<string, number>;
  last_fetch: string | null;
}
