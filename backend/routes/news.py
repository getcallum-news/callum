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
from models import Article, FetchCycle, Topic
from schemas import (
    ArticleResponse,
    ArticleListResponse,
    HealthResponse,
    StatsResponse,
    TrendingResponse,
    TrendingTopic,
    MindshareEntity,
    MindshareResponse,
    MindshareHistoryPoint,
    MindshareHistoryEntity,
    MindshareHistoryResponse,
    EntityDetailResponse,
    RelatedEntity,
    EntityEvent,
    TopicResponse,
    TopicListResponse,
    TopicDetailResponse,
)


def slugify(name: str) -> str:
    """Turn an entity name into a URL-safe slug.

    Examples: "OpenAI" -> "openai", "GPT-4 / GPT-5" -> "gpt-4-gpt-5",
    "Hugging Face" -> "hugging-face".
    """
    s = name.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")

# Shared entity list used by /mindshare and /mindshare/history.
MINDSHARE_ENTITIES: list[tuple[str, str, list[str]]] = [
    # Companies
    ("OpenAI",        "company", ["openai", "chatgpt", "gpt"]),
    ("Anthropic",     "company", ["anthropic", "claude"]),
    ("Google",        "company", ["google ai", "deepmind", "gemini", "google deepmind"]),
    ("Meta AI",       "company", ["meta ai", "llama", "meta's ai"]),
    ("Microsoft",     "company", ["microsoft", "copilot", "azure ai"]),
    ("xAI",           "company", ["xai", "grok"]),
    ("Nvidia",        "company", ["nvidia", "h100", "blackwell"]),
    ("Mistral",       "company", ["mistral"]),
    ("Hugging Face",  "company", ["hugging face", "huggingface"]),
    ("Apple",         "company", ["apple intelligence", "apple ai"]),
    # Models
    ("GPT-4 / GPT-5", "model",   ["gpt-4", "gpt-5", "gpt4", "gpt5", "o1", "o3", "o4"]),
    ("Claude",        "model",   ["claude 3", "claude 4", "claude opus", "claude sonnet", "claude haiku"]),
    ("Gemini",        "model",   ["gemini ultra", "gemini pro", "gemini flash", "gemini 2"]),
    ("Llama",         "model",   ["llama 3", "llama 4", "llama3", "llama4"]),
    ("Grok",          "model",   ["grok-1", "grok-2", "grok-3", "grok 3"]),
    ("Sora",          "model",   ["sora"]),
    ("Stable Diffusion", "model", ["stable diffusion", "sdxl", "sd3"]),
    ("Midjourney",    "model",   ["midjourney"]),
    # People
    ("Sam Altman",    "person",  ["sam altman"]),
    ("Elon Musk",     "person",  ["elon musk"]),
    ("Demis Hassabis","person",  ["demis hassabis"]),
    ("Yann LeCun",    "person",  ["yann lecun"]),
    ("Geoffrey Hinton","person", ["geoffrey hinton", "hinton"]),
    ("Ilya Sutskever","person",  ["ilya sutskever"]),
    ("Dario Amodei",  "person",  ["dario amodei"]),
    ("Jensen Huang",  "person",  ["jensen huang"]),
]

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
    topic_id: int | None = Query(default=None, description="Filter by BERTopic cluster ID"),
    q: str | None = Query(default=None, max_length=200, description="Full-text search across title and summary"),
    db: Session = Depends(get_db),
) -> ArticleListResponse:
    """Return a paginated list of articles, newest first.

    Supports optional filtering by category (research, industry, tools,
    safety), source (TechCrunch, arXiv, Hacker News, etc.), topic_id
    (BERTopic cluster), and full-text search via the q param.
    """
    query = db.query(Article).filter(Article.is_active.is_(True))

    if category:
        query = query.filter(Article.category == category)
    if source:
        query = query.filter(Article.source == source)
    if topic_id is not None:
        query = query.filter(Article.topic_id == topic_id)
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


@router.get("/mindshare", response_model=MindshareResponse)
@limiter.limit("30/minute")
def get_mindshare(
    request: Request,
    db: Session = Depends(get_db),
) -> MindshareResponse:
    """Return AI mindshare leaderboard — companies, models, and people.

    Counts article mentions in the last 7 days vs the 7 days prior.
    Returns % change so the frontend can render a stock-market style board.
    """

    ENTITIES = MINDSHARE_ENTITIES

    now = datetime.now(timezone.utc)
    this_week_start = now - timedelta(days=7)
    last_week_start = now - timedelta(days=14)

    def count_mentions(articles: list) -> Counter:
        counts: Counter = Counter()
        for title, summary in articles:
            text = f"{title or ''} {summary or ''}".lower()
            for name, _, aliases in ENTITIES:
                if any(alias in text for alias in aliases):
                    counts[name] += 1
        return counts

    this_week_articles = (
        db.query(Article.title, Article.summary)
        .filter(Article.is_active.is_(True), Article.fetched_at >= this_week_start)
        .all()
    )
    last_week_articles = (
        db.query(Article.title, Article.summary)
        .filter(
            Article.is_active.is_(True),
            Article.fetched_at >= last_week_start,
            Article.fetched_at < this_week_start,
        )
        .all()
    )

    this_counts = count_mentions(this_week_articles)
    last_counts = count_mentions(last_week_articles)

    entities = []
    for name, entity_type, _ in ENTITIES:
        this_w = this_counts[name]
        last_w = last_counts[name]

        if last_w > 0:
            change_pct = round((this_w - last_w) / last_w * 100, 1)
        elif this_w > 0:
            change_pct = 100.0
        else:
            change_pct = 0.0

        if change_pct > 2:
            trend = "up"
        elif change_pct < -2:
            trend = "down"
        else:
            trend = "neutral"

        entities.append(MindshareEntity(
            name=name,
            slug=slugify(name),
            type=entity_type,
            this_week=this_w,
            last_week=last_w,
            change_pct=change_pct,
            trend=trend,
        ))

    # Sort by this week mentions descending, entities with 0 go last
    entities.sort(key=lambda e: (-e.this_week, e.name))

    return MindshareResponse(entities=entities, generated_at=now)


@router.get("/mindshare/history", response_model=MindshareHistoryResponse)
@limiter.limit("30/minute")
def get_mindshare_history(
    request: Request,
    days: int = Query(default=14, ge=2, le=60),
    db: Session = Depends(get_db),
) -> MindshareHistoryResponse:
    """Return daily mention counts for each tracked entity over the last N days.

    Used by the Pulse line-chart view. For each day in the window, counts
    how many articles (fetched on that day) mention each entity. Returns
    a series of (date, count) points per entity.
    """

    now = datetime.now(timezone.utc)
    today = now.date()
    window_start = now - timedelta(days=days - 1)

    # Day keys: oldest -> newest, ending today.
    day_keys: list[str] = [
        (today - timedelta(days=i)).isoformat() for i in reversed(range(days))
    ]
    day_set = set(day_keys)

    # Pull article metadata for the whole window in one go.
    rows = (
        db.query(Article.title, Article.summary, Article.fetched_at)
        .filter(
            Article.is_active.is_(True),
            Article.fetched_at >= window_start.replace(hour=0, minute=0, second=0, microsecond=0),
        )
        .all()
    )

    # Empty [name][date] -> 0 grid so every day is present in the series,
    # even when no article mentioned the entity that day.
    grid: dict[str, dict[str, int]] = {
        name: {d: 0 for d in day_keys} for name, _, _ in MINDSHARE_ENTITIES
    }

    for title, summary, fetched_at in rows:
        if fetched_at is None:
            continue
        day = fetched_at.date().isoformat()
        if day not in day_set:
            continue
        text = f"{title or ''} {summary or ''}".lower()
        for name, _, aliases in MINDSHARE_ENTITIES:
            if any(alias in text for alias in aliases):
                grid[name][day] += 1

    entities = [
        MindshareHistoryEntity(
            name=name,
            slug=slugify(name),
            type=entity_type,
            series=[
                MindshareHistoryPoint(date=d, count=grid[name][d]) for d in day_keys
            ],
        )
        for name, entity_type, _ in MINDSHARE_ENTITIES
    ]

    return MindshareHistoryResponse(entities=entities, days=days, generated_at=now)


@router.get("/entity/{slug}", response_model=EntityDetailResponse)
@limiter.limit("60/minute")
def get_entity_detail(
    request: Request,
    slug: str,
    days: int = Query(default=30, ge=7, le=90),
    db: Session = Depends(get_db),
) -> EntityDetailResponse:
    """Return a full dossier for a single tracked entity.

    Combines mindshare stats, daily history, recent articles, co-occurring
    related entities, and an events timeline of notable days. Powers the
    /entity/{slug} detail page.
    """
    # 1. Resolve slug -> entity
    target: tuple[str, str, list[str]] | None = None
    for name, etype, aliases in MINDSHARE_ENTITIES:
        if slugify(name) == slug:
            target = (name, etype, aliases)
            break

    if target is None:
        raise HTTPException(status_code=404, detail="Entity not found")

    target_name, target_type, target_aliases = target

    now = datetime.now(timezone.utc)
    today = now.date()
    window_start = now - timedelta(days=days - 1)
    this_week_cutoff = now - timedelta(days=7)
    last_week_cutoff = now - timedelta(days=14)

    # 2. Pull all articles in the history window once.
    all_articles = (
        db.query(Article)
        .filter(
            Article.is_active.is_(True),
            Article.fetched_at >= window_start.replace(
                hour=0, minute=0, second=0, microsecond=0
            ),
        )
        .order_by(Article.fetched_at.desc())
        .all()
    )

    # Precompute lowercased text + fetched_at for each article to avoid
    # repeated string work inside the entity loop.
    texts: list[str] = [
        f"{a.title or ''} {a.summary or ''}".lower() for a in all_articles
    ]

    # Map entity name -> list of article indices that mention it.
    entity_matches: dict[str, list[int]] = {}
    for name, _, aliases in MINDSHARE_ENTITIES:
        matches: list[int] = []
        for i, t in enumerate(texts):
            if any(alias in t for alias in aliases):
                matches.append(i)
        entity_matches[name] = matches

    target_indices = entity_matches[target_name]
    matching_articles = [all_articles[i] for i in target_indices]

    # 3. Daily series for the history chart.
    day_keys = [(today - timedelta(days=i)).isoformat() for i in reversed(range(days))]
    day_set = set(day_keys)
    day_counts: dict[str, int] = {d: 0 for d in day_keys}
    for a in matching_articles:
        if a.fetched_at is None:
            continue
        d = a.fetched_at.date().isoformat()
        if d in day_set:
            day_counts[d] += 1

    series = [
        MindshareHistoryPoint(date=d, count=day_counts[d]) for d in day_keys
    ]

    # 4. This week vs last week (for the change indicator).
    this_week = sum(
        1 for a in matching_articles
        if a.fetched_at is not None and a.fetched_at >= this_week_cutoff
    )
    last_week = sum(
        1 for a in matching_articles
        if a.fetched_at is not None
        and last_week_cutoff <= a.fetched_at < this_week_cutoff
    )

    if last_week > 0:
        change_pct = round((this_week - last_week) / last_week * 100, 1)
    elif this_week > 0:
        change_pct = 100.0
    else:
        change_pct = 0.0

    if change_pct > 2:
        trend = "up"
    elif change_pct < -2:
        trend = "down"
    else:
        trend = "neutral"

    # 5. Rank within the same type, by this_week mentions.
    rank = 1
    for name, etype, _ in MINDSHARE_ENTITIES:
        if etype != target_type or name == target_name:
            continue
        their_this_week = sum(
            1 for i in entity_matches[name]
            if all_articles[i].fetched_at is not None
            and all_articles[i].fetched_at >= this_week_cutoff
        )
        if their_this_week > this_week:
            rank += 1

    # 6. Window stats.
    total_mentions = len(matching_articles)
    peak = max(day_counts.values()) if day_counts else 0
    avg_per_day = round(total_mentions / days, 1) if days > 0 else 0.0

    # 7. Recent articles — most recent 15 that mention this entity.
    recent_articles = matching_articles[:15]

    # 8. Related entities via co-occurrence on the target's matching articles.
    target_index_set = set(target_indices)
    related_counts: Counter = Counter()
    for name, etype, _ in MINDSHARE_ENTITIES:
        if name == target_name:
            continue
        co = sum(1 for i in entity_matches[name] if i in target_index_set)
        if co > 0:
            related_counts[(name, etype)] = co

    top_related = related_counts.most_common(6)
    related = [
        RelatedEntity(
            name=name,
            slug=slugify(name),
            type=etype,
            co_occurrences=count,
        )
        for (name, etype), count in top_related
    ]

    # 9. Events timeline — top 5 days by mention count, anchored to the
    #    highest-relevance article on each day.
    by_day: dict[str, list[Article]] = {}
    for a in matching_articles:
        if a.fetched_at is None:
            continue
        d = a.fetched_at.date().isoformat()
        by_day.setdefault(d, []).append(a)

    # Pick top 5 days by mention count; break ties by newer date.
    top_days = sorted(
        by_day.items(),
        key=lambda kv: (-len(kv[1]), kv[0]),
    )[:5]

    events: list[EntityEvent] = []
    # Present events in chronological order, newest first.
    for day, arts in sorted(top_days, key=lambda kv: kv[0], reverse=True):
        best = max(
            arts,
            key=lambda a: (
                a.relevance_score or 0,
                a.fetched_at or datetime.min.replace(tzinfo=timezone.utc),
            ),
        )
        events.append(
            EntityEvent(
                date=day,
                article_title=best.title,
                article_url=best.url,
                article_source=best.source,
                mentions=len(arts),
            )
        )

    return EntityDetailResponse(
        name=target_name,
        slug=slug,
        type=target_type,
        this_week=this_week,
        last_week=last_week,
        change_pct=change_pct,
        trend=trend,
        rank=rank,
        peak=peak,
        avg_per_day=avg_per_day,
        total_mentions=total_mentions,
        window_days=days,
        series=series,
        recent_articles=[ArticleResponse.model_validate(a) for a in recent_articles],
        related=related,
        events=events,
        generated_at=now,
    )


@router.get("/topics", response_model=TopicListResponse)
@limiter.limit("30/minute")
def list_topics(
    request: Request,
    db: Session = Depends(get_db),
) -> TopicListResponse:
    """Return all BERTopic clusters ordered by article count.

    Each topic includes up to 3 sample articles for preview cards on the
    /topics discovery page.  Returns an empty list if clustering has not
    run yet.
    """
    topics = (
        db.query(Topic)
        .order_by(Topic.article_count.desc())
        .all()
    )

    topic_responses = []
    for t in topics:
        sample = (
            db.query(Article)
            .filter(Article.topic_id == t.id, Article.is_active.is_(True))
            .order_by(Article.published_at.desc().nullslast())
            .limit(3)
            .all()
        )
        topic_responses.append(TopicResponse(
            id=t.id,
            label=t.label,
            top_terms=t.top_terms or [],
            article_count=t.article_count,
            updated_at=t.updated_at,
            sample_articles=[ArticleResponse.model_validate(a) for a in sample],
        ))

    total_articles = db.query(Article).filter(Article.is_active.is_(True)).count()
    total_clustered = (
        db.query(Article)
        .filter(Article.is_active.is_(True), Article.topic_id.isnot(None))
        .count()
    )

    return TopicListResponse(
        topics=topic_responses,
        total_clustered=total_clustered,
        total_articles=total_articles,
        generated_at=datetime.now(timezone.utc),
    )


@router.get("/topics/{topic_id}", response_model=TopicDetailResponse)
@limiter.limit("30/minute")
def get_topic(
    request: Request,
    topic_id: int,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=50),
    db: Session = Depends(get_db),
) -> TopicDetailResponse:
    """Return a single topic cluster with paginated articles.

    Powers the /topics/{id} detail page.
    """
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    article_query = (
        db.query(Article)
        .filter(Article.topic_id == topic_id, Article.is_active.is_(True))
    )
    total = article_query.count()
    articles = (
        article_query
        .order_by(Article.published_at.desc().nullslast())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    return TopicDetailResponse(
        id=topic.id,
        label=topic.label,
        top_terms=topic.top_terms or [],
        article_count=topic.article_count,
        updated_at=topic.updated_at,
        articles=ArticleListResponse(
            articles=[ArticleResponse.model_validate(a) for a in articles],
            total=total,
            page=page,
            pages=max(1, math.ceil(total / limit)),
        ),
        generated_at=datetime.now(timezone.utc),
    )


@router.get("/health", response_model=HealthResponse)
def health_check(db: Session = Depends(get_db)) -> HealthResponse:
    """Basic health check — returns article count.

    No rate limit on this endpoint — it's used by Render's health
    check system which pings frequently.
    """
    count = db.query(Article).filter(Article.is_active.is_(True)).count()
    return HealthResponse(status="ok", articles_count=count)
