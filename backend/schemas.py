"""
Pydantic schemas for request validation and response serialization.

Every piece of data entering or leaving the API goes through one of
these schemas. This is the single point of truth for data shape and
validation — no raw dicts, no unvalidated input.
"""

from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict


# ---------------------------------------------------------------------------
# Article schemas
# ---------------------------------------------------------------------------

class ArticleResponse(BaseModel):
    """Shape of a single article in API responses."""

    id: UUID
    title: str
    summary: str | None = None
    url: str
    source: str | None = None
    published_at: datetime | None = None
    relevance_score: int = 0
    category: str | None = None
    image_url: str | None = None
    sentiment: str | None = None          # positive | negative | neutral | mixed
    sentiment_score: float | None = None  # -1.0 to 1.0
    topic_id: int | None = None
    topic_keywords: list[str] | None = None

    model_config = ConfigDict(from_attributes=True)


class ArticleListResponse(BaseModel):
    """Paginated list of articles returned by GET /news."""

    articles: list[ArticleResponse]
    total: int
    page: int
    pages: int


# ---------------------------------------------------------------------------
# Push subscription schemas
# ---------------------------------------------------------------------------

class SubscribeRequest(BaseModel):
    """Body for POST /subscribe — all three fields are required
    for Web Push to work."""

    endpoint: str = Field(..., min_length=1, max_length=2000)
    p256dh: str = Field(..., min_length=1, max_length=500)
    auth: str = Field(..., min_length=1, max_length=500)


class UnsubscribeRequest(BaseModel):
    """Body for POST /unsubscribe — only the endpoint is needed
    to identify the subscription."""

    endpoint: str = Field(..., min_length=1, max_length=2000)


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

class HealthResponse(BaseModel):
    """Response for GET /health."""

    status: str
    articles_count: int


# ---------------------------------------------------------------------------
# Error responses
# ---------------------------------------------------------------------------

class TrendingTopic(BaseModel):
    topic: str
    count: int
    category: str | None = None


class TrendingResponse(BaseModel):
    topics: list[TrendingTopic]
    window_hours: int


class StatsResponse(BaseModel):
    """Cumulative fetch stats for the live counter."""

    total_scanned: int
    total_kept: int
    sources: dict[str, int]
    last_fetch: datetime | None = None


class ErrorResponse(BaseModel):
    """Standard error shape returned by all error handlers."""

    error: str
    detail: list[str] | None = None


# ---------------------------------------------------------------------------
# Mindshare / AI Stock Market schemas
# ---------------------------------------------------------------------------

class MindshareEntity(BaseModel):
    """A single entity (company, model, or person) with mindshare data."""

    name: str
    slug: str
    type: str  # "company" | "model" | "person"
    this_week: int
    last_week: int
    change_pct: float
    trend: str  # "up" | "down" | "neutral"


class MindshareResponse(BaseModel):
    """Response for GET /mindshare."""

    entities: list[MindshareEntity]
    generated_at: datetime


class MindshareHistoryPoint(BaseModel):
    """A single day in an entity's mention history."""

    date: str  # YYYY-MM-DD
    count: int


class MindshareHistoryEntity(BaseModel):
    """Daily mention history for a single entity."""

    name: str
    slug: str
    type: str
    series: list[MindshareHistoryPoint]


class MindshareHistoryResponse(BaseModel):
    """Response for GET /mindshare/history."""

    entities: list[MindshareHistoryEntity]
    days: int
    generated_at: datetime


# ---------------------------------------------------------------------------
# Entity detail page
# ---------------------------------------------------------------------------

class RelatedEntity(BaseModel):
    """An entity that frequently co-occurs with the target in articles."""

    name: str
    slug: str
    type: str
    co_occurrences: int


class EntityEvent(BaseModel):
    """A notable day in an entity's history, anchored to one article."""

    date: str  # YYYY-MM-DD
    article_title: str
    article_url: str
    article_source: str | None = None
    mentions: int


class EntityDetailResponse(BaseModel):
    """Response for GET /entity/{slug} — full dossier for a single entity."""

    name: str
    slug: str
    type: str  # "company" | "model" | "person"

    # Current stats
    this_week: int
    last_week: int
    change_pct: float
    trend: str  # "up" | "down" | "neutral"
    rank: int  # rank within its type, by this_week mentions
    peak: int
    avg_per_day: float
    total_mentions: int  # total over the window
    window_days: int

    # History series (oldest -> newest)
    series: list[MindshareHistoryPoint]

    # Most recent articles mentioning this entity
    recent_articles: list[ArticleResponse]

    # Entities that tend to co-occur in the same articles
    related: list[RelatedEntity]

    # Top N notable days, each anchored to a representative article
    events: list[EntityEvent]

    generated_at: datetime


# ---------------------------------------------------------------------------
# Topic clustering schemas
# ---------------------------------------------------------------------------

class TopicResponse(BaseModel):
    """A single BERTopic cluster with representative articles."""

    id: int
    label: str                          # e.g. "GPT · Model · OpenAI · Release"
    top_terms: list[str]                # top 10 keywords
    article_count: int
    updated_at: datetime | None = None
    sample_articles: list[ArticleResponse] = []

    model_config = ConfigDict(from_attributes=True)


class TopicListResponse(BaseModel):
    """Response for GET /topics."""

    topics: list[TopicResponse]
    total_clustered: int                # articles with a topic assignment
    total_articles: int                 # all active articles
    generated_at: datetime


class TopicDetailResponse(BaseModel):
    """Response for GET /topics/{id}."""

    id: int
    label: str
    top_terms: list[str]
    article_count: int
    updated_at: datetime | None = None
    articles: ArticleListResponse
    generated_at: datetime
