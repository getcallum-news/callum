"""
News fetcher — pulls articles from RSS feeds, Hacker News, and arXiv.

All fetching is async to avoid blocking the scheduler. Articles are
sanitized, filtered for AI relevance, deduplicated by URL, and saved
to the database. Only title + summary (max 1000 chars) + link are
stored — never the full article body.
"""

import asyncio
import logging
import uuid
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from typing import Any

import bleach
import feedparser
import httpx
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from models import Article, FetchCycle
from services.filter import passes_filter, detect_category

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# RSS feed sources
# ---------------------------------------------------------------------------

RSS_FEEDS: dict[str, str] = {
    "TechCrunch": "https://techcrunch.com/category/artificial-intelligence/feed/",
    "VentureBeat": "https://venturebeat.com/category/ai/feed/",
    "MIT News": "https://news.mit.edu/rss/topic/artificial-intelligence",
    "Wired": "https://www.wired.com/feed/tag/ai/latest/rss",
    "The Verge": "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml",
    "Ars Technica": "https://feeds.arstechnica.com/arstechnica/technology-lab",
}

# Hacker News API — public, no key needed
HN_TOP_STORIES_URL = "https://hacker-news.firebaseio.com/v0/topstories.json"
HN_ITEM_URL = "https://hacker-news.firebaseio.com/v0/item/{}.json"
HN_FETCH_LIMIT = 50
HN_CONCURRENCY = 10

# arXiv API — public, no key needed
ARXIV_URL = (
    "https://export.arxiv.org/api/query?"
    "search_query=cat:cs.AI+OR+cat:cs.LG+OR+cat:cs.CL"
    "&sortBy=submittedDate&sortOrder=descending&max_results=20"
)

# HTTP client timeout for all requests
REQUEST_TIMEOUT = 30.0


def _sanitize_text(text: str | None) -> str | None:
    """Strip HTML tags and clean up whitespace.

    Uses bleach to remove all HTML — we only want plain text in the DB.
    """
    if not text:
        return None
    cleaned = bleach.clean(text, tags=[], strip=True)
    # Collapse multiple whitespace into single spaces
    cleaned = " ".join(cleaned.split())
    return cleaned


def _truncate(text: str | None, max_length: int = 1000) -> str | None:
    """Truncate text to max_length characters.

    Summaries are capped at 1000 chars — we never store full article
    bodies for copyright compliance.
    """
    if not text:
        return None
    if len(text) <= max_length:
        return text
    return text[:max_length - 3] + "..."


def _parse_datetime(date_str: str | None) -> datetime | None:
    """Best-effort datetime parsing for RSS and API date strings."""
    if not date_str:
        return None
    try:
        # feedparser gives us a time struct, but sometimes we get strings
        from email.utils import parsedate_to_datetime
        return parsedate_to_datetime(date_str)
    except (ValueError, TypeError):
        pass
    try:
        # ISO 8601 format (arXiv, Hacker News)
        return datetime.fromisoformat(date_str.replace("Z", "+00:00"))
    except (ValueError, TypeError):
        return None


# ---------------------------------------------------------------------------
# RSS fetcher
# ---------------------------------------------------------------------------

async def _fetch_single_rss(client: httpx.AsyncClient, source: str, url: str) -> list[dict[str, Any]]:
    """Fetch and parse a single RSS feed.

    Returns a list of raw article dicts ready for filtering.
    """
    articles = []
    try:
        response = await client.get(url, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        feed = feedparser.parse(response.text)

        for entry in feed.entries:
            # Extract the best available summary
            summary = entry.get("summary", "") or entry.get("description", "")
            articles.append({
                "title": entry.get("title", ""),
                "summary": _truncate(_sanitize_text(summary)),
                "url": entry.get("link", ""),
                "source": source,
                "published_at": _parse_datetime(entry.get("published")),
            })
    except Exception as e:
        logger.error("Failed to fetch RSS feed %s: %s", source, e)

    return articles


async def fetch_rss_feeds() -> list[dict[str, Any]]:
    """Fetch all RSS feeds concurrently."""
    async with httpx.AsyncClient(follow_redirects=True) as client:
        tasks = [
            _fetch_single_rss(client, source, url)
            for source, url in RSS_FEEDS.items()
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)

    articles = []
    for result in results:
        if isinstance(result, list):
            articles.extend(result)
        elif isinstance(result, Exception):
            logger.error("RSS fetch task failed: %s", result)

    return articles


# ---------------------------------------------------------------------------
# Hacker News fetcher
# ---------------------------------------------------------------------------

async def _fetch_hn_item(client: httpx.AsyncClient, item_id: int) -> dict[str, Any] | None:
    """Fetch a single Hacker News story by ID."""
    try:
        response = await client.get(
            HN_ITEM_URL.format(item_id),
            timeout=REQUEST_TIMEOUT,
        )
        response.raise_for_status()
        data = response.json()

        if not data or data.get("type") != "story" or not data.get("url"):
            return None

        return {
            "title": data.get("title", ""),
            "summary": None,  # HN stories don't have summaries
            "url": data["url"],
            "source": "Hacker News",
            "published_at": (
                datetime.fromtimestamp(data["time"], tz=timezone.utc)
                if data.get("time")
                else None
            ),
        }
    except Exception as e:
        logger.error("Failed to fetch HN item %d: %s", item_id, e)
        return None


async def fetch_hackernews() -> list[dict[str, Any]]:
    """Fetch top stories from Hacker News, limited to AI-relevant ones.

    Fetches the top 50 story IDs, then fetches each story with a
    concurrency limit of 10 to be respectful to the API.
    """
    articles = []
    try:
        async with httpx.AsyncClient(follow_redirects=True) as client:
            # Get top story IDs
            response = await client.get(HN_TOP_STORIES_URL, timeout=REQUEST_TIMEOUT)
            response.raise_for_status()
            story_ids = response.json()[:HN_FETCH_LIMIT]

            # Fetch stories with concurrency limit
            semaphore = asyncio.Semaphore(HN_CONCURRENCY)

            async def fetch_with_limit(item_id: int) -> dict[str, Any] | None:
                async with semaphore:
                    return await _fetch_hn_item(client, item_id)

            results = await asyncio.gather(
                *[fetch_with_limit(sid) for sid in story_ids],
                return_exceptions=True,
            )

            for result in results:
                if isinstance(result, dict):
                    articles.append(result)
                elif isinstance(result, Exception):
                    logger.error("HN fetch task failed: %s", result)

    except Exception as e:
        logger.error("Failed to fetch Hacker News top stories: %s", e)

    return articles


# ---------------------------------------------------------------------------
# arXiv fetcher
# ---------------------------------------------------------------------------

async def fetch_arxiv() -> list[dict[str, Any]]:
    """Fetch recent AI/ML/NLP papers from arXiv.

    Uses the arXiv API with XML response — parses with ElementTree.
    """
    articles = []
    # arXiv Atom feed namespace
    ns = {"atom": "http://www.w3.org/2005/Atom"}

    try:
        async with httpx.AsyncClient(follow_redirects=True) as client:
            response = await client.get(ARXIV_URL, timeout=REQUEST_TIMEOUT)
            response.raise_for_status()

            root = ET.fromstring(response.text)

            for entry in root.findall("atom:entry", ns):
                title_el = entry.find("atom:title", ns)
                summary_el = entry.find("atom:summary", ns)
                link_el = entry.find("atom:id", ns)
                published_el = entry.find("atom:published", ns)

                title = title_el.text.strip() if title_el is not None and title_el.text else ""
                summary = summary_el.text.strip() if summary_el is not None and summary_el.text else ""
                url = link_el.text.strip() if link_el is not None and link_el.text else ""
                published = published_el.text.strip() if published_el is not None and published_el.text else None

                articles.append({
                    "title": _sanitize_text(title),
                    "summary": _truncate(_sanitize_text(summary)),
                    "url": url,
                    "source": "arXiv",
                    "published_at": _parse_datetime(published),
                })

    except Exception as e:
        logger.error("Failed to fetch arXiv: %s", e)

    return articles


# ---------------------------------------------------------------------------
# Main fetch pipeline
# ---------------------------------------------------------------------------

async def fetch_all_sources() -> list[dict[str, Any]]:
    """Fetch from all sources concurrently.

    Returns a combined list of raw article dicts from RSS, HN, and arXiv.
    """
    rss_task = fetch_rss_feeds()
    hn_task = fetch_hackernews()
    arxiv_task = fetch_arxiv()

    rss_articles, hn_articles, arxiv_articles = await asyncio.gather(
        rss_task, hn_task, arxiv_task,
        return_exceptions=True,
    )

    all_articles: list[dict[str, Any]] = []

    for result, name in [
        (rss_articles, "RSS"),
        (hn_articles, "Hacker News"),
        (arxiv_articles, "arXiv"),
    ]:
        if isinstance(result, list):
            all_articles.extend(result)
        elif isinstance(result, Exception):
            logger.error("%s fetch failed: %s", name, result)

    return all_articles


def save_articles(db: Session, raw_articles: list[dict[str, Any]]) -> dict[str, int]:
    """Filter, categorize, and save articles to the database.

    Runs the AI relevance filter on each article, assigns a category,
    and inserts new articles. Duplicates (same URL) are silently skipped.

    Args:
        db: SQLAlchemy database session.
        raw_articles: List of article dicts from fetch_all_sources().

    Returns:
        Dict with total_scanned, total_passed, total_saved counts.
    """
    total_scanned = 0
    total_passed = 0
    saved_count = 0

    for raw in raw_articles:
        title = raw.get("title", "")
        summary = raw.get("summary")
        url = raw.get("url", "")

        # Skip articles without a URL — can't deduplicate without one
        if not url or not title:
            continue

        total_scanned += 1

        # Stage 1 & 2: keyword filter + relevance scoring
        passes, score = passes_filter(title, summary)
        if not passes:
            continue

        total_passed += 1

        # Assign category based on content and source
        category = detect_category(title, summary, raw.get("source"))

        article = Article(
            id=uuid.uuid4(),
            title=title[:500],
            summary=_truncate(summary),
            url=url,
            source=raw.get("source"),
            published_at=raw.get("published_at"),
            relevance_score=score,
            category=category,
            is_active=True,
        )

        try:
            db.add(article)
            db.commit()
            saved_count += 1
        except IntegrityError:
            # URL already exists in the database — skip silently
            db.rollback()
        except Exception as e:
            db.rollback()
            logger.error("Failed to save article '%s': %s", title[:60], e)

    # Record this fetch cycle's stats
    cycle = FetchCycle(
        id=uuid.uuid4(),
        total_scanned=total_scanned,
        total_passed=total_passed,
        total_saved=saved_count,
    )
    try:
        db.add(cycle)
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error("Failed to save fetch cycle stats: %s", e)

    return {
        "total_scanned": total_scanned,
        "total_passed": total_passed,
        "total_saved": saved_count,
    }
