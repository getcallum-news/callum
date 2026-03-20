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
