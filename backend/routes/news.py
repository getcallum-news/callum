"""
News API endpoints.

GET /news        — paginated article list with optional category/source filters
GET /news/{id}   — single article by UUID
GET /health      — basic health check for uptime monitoring
"""

import math
import re
from collections import Counter
from datetime import datetime, timezone, timedelta
from uuid import UUID

from fastapi import APIRouter, Depends, Query, HTTPException, Request
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address

from sqlalchemy import func

from database import get_db
from models import Article, FetchCycle
from schemas import ArticleResponse, ArticleListResponse, HealthResponse, StatsResponse, TrendingResponse, TrendingTopic

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.get("/news", response_model=ArticleListResponse)
@limiter.limit("60/minute")
def list_articles(
    request: Request,  # required by slowapi — it reads the client IP from this
    page: int = Query(default=1, ge=1, description="Page number"),
    limit: int = Query(default=20, ge=1, le=50, description="Articles per page"),
    category: str | None = Query(default=None, description="Filter by category"),
    source: str | None = Query(default=None, description="Filter by source"),
    q: str | None = Query(default=None, max_length=200, description="Full-text search across title and summary"),
    db: Session = Depends(get_db),
) -> ArticleListResponse:
    """Return a paginated list of articles, newest first.

    Supports optional filtering by category (research, industry, tools,
    safety) and source (TechCrunch, arXiv, Hacker News, etc.).
    Supports full-text search via the q param (ILIKE on title + summary).
    """
    query = db.query(Article).filter(Article.is_active.is_(True))

    if category:
        query = query.filter(Article.category == category)
    if source:
        query = query.filter(Article.source == source)
    if q:
        term = f"%{q}%"
        query = query.filter(
            Article.title.ilike(term) | Article.summary.ilike(term)
        )

    total = query.count()
    pages = max(1, math.ceil(total / limit))

    articles = (
        query
        .order_by(Article.published_at.desc().nullslast())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    return ArticleListResponse(
        articles=[ArticleResponse.model_validate(a) for a in articles],
        total=total,
        page=page,
        pages=pages,
    )


@router.get("/news/{article_id}", response_model=ArticleResponse)
@limiter.limit("60/minute")
def get_article(
    request: Request,
    article_id: UUID,
    db: Session = Depends(get_db),
) -> ArticleResponse:
    """Return a single article by its UUID."""
    article = (
        db.query(Article)
        .filter(Article.id == article_id, Article.is_active.is_(True))
        .first()
    )

    if not article:
        raise HTTPException(status_code=404, detail="Not found")

    return ArticleResponse.model_validate(article)


@router.get("/stats", response_model=StatsResponse)
@limiter.limit("30/minute")
def get_stats(
    request: Request,
    db: Session = Depends(get_db),
) -> StatsResponse:
    """Return cumulative fetch stats for the live counter."""
    # Sum all fetch cycles
    totals = db.query(
        func.coalesce(func.sum(FetchCycle.total_scanned), 0),
        func.coalesce(func.sum(FetchCycle.total_passed), 0),
    ).first()

    total_scanned = totals[0] if totals else 0
    total_kept = totals[1] if totals else 0

    # Get article counts by source
    source_counts = (
        db.query(Article.source, func.count(Article.id))
        .filter(Article.is_active.is_(True))
        .group_by(Article.source)
        .all()
    )
    sources = {src: count for src, count in source_counts if src}

    # Last fetch time
    last_cycle = (
        db.query(FetchCycle.fetched_at)
        .order_by(FetchCycle.fetched_at.desc())
        .first()
    )

    return StatsResponse(
        total_scanned=total_scanned,
        total_kept=total_kept,
        sources=sources,
        last_fetch=last_cycle[0] if last_cycle else None,
    )


@router.get("/trending", response_model=TrendingResponse)
@limiter.limit("30/minute")
def get_trending(
    request: Request,
    hours: int = Query(default=24, ge=1, le=72),
    db: Session = Depends(get_db),
) -> TrendingResponse:
    """Return trending topics from the last N hours based on article mentions."""

    # Topics to track with their display names and aliases
    TOPICS: list[tuple[str, list[str], str | None]] = [
        ("OpenAI",        ["openai", "chatgpt", "gpt-4", "gpt4", "o1", "o3", "sora"],       "industry"),
        ("Anthropic",     ["anthropic", "claude"],                                            "industry"),
        ("Google DeepMind", ["deepmind", "gemini", "google ai", "google deepmind"],          "industry"),
        ("Meta AI",       ["meta ai", "llama", "meta's ai"],                                  "industry"),
        ("xAI / Grok",   ["xai", "grok", "elon musk ai"],                                   "industry"),
        ("LLMs",          ["llm", "large language model", "language model"],                  "research"),
        ("Agents",        ["ai agent", "autonomous agent", "agentic", "multi-agent"],         "research"),
        ("Reasoning",     ["reasoning", "chain-of-thought", "cot", "thinking model"],         "research"),
        ("Image / Video", ["text-to-image", "image generation", "video generation", "diffusion", "stable diffusion", "midjourney"], "tools"),
        ("Robotics",      ["robot", "robotics", "embodied ai", "humanoid"],                   "research"),
        ("Safety / Alignment", ["alignment", "ai safety", "rlhf", "red team", "guardrails"], "safety"),
        ("Regulation",    ["regulation", "legislation", "eu ai act", "executive order", "ban ai"], "industry"),
        ("Open Source",   ["open source", "open-source", "open weights", "hugging face"],     "tools"),
        ("Coding / Dev",  ["copilot", "cursor", "claude code", "coding assistant", "code generation"], "tools"),
        ("Hardware / Chips", ["nvidia", "gpu", "h100", "tpu", "chip", "semiconductor"],      "industry"),
        ("arXiv / Research", ["arxiv", "paper", "benchmark", "dataset", "fine-tuning", "finetune"], "research"),
    ]

    since = datetime.now(timezone.utc) - timedelta(hours=hours)
    articles = (
        db.query(Article.title, Article.summary, Article.category)
        .filter(Article.is_active.is_(True), Article.fetched_at >= since)
        .all()
    )

    counts: Counter = Counter()
    for title, summary, _ in articles:
        text = f"{title or ''} {summary or ''}".lower()
        for topic_name, aliases, _ in TOPICS:
            if any(alias in text for alias in aliases):
                counts[topic_name] += 1

    topics = [
        TrendingTopic(
            topic=name,
            count=counts[name],
            category=cat,
        )
        for name, _, cat in TOPICS
        if counts[name] > 0
    ]
    topics.sort(key=lambda t: t.count, reverse=True)

    return TrendingResponse(topics=topics[:10], window_hours=hours)


@router.get("/health", response_model=HealthResponse)
def health_check(db: Session = Depends(get_db)) -> HealthResponse:
    """Basic health check — returns article count.

    No rate limit on this endpoint — it's used by Render's health
    check system which pings frequently.
    """
    count = db.query(Article).filter(Article.is_active.is_(True)).count()
    return HealthResponse(status="ok", articles_count=count)
