"""
Background scheduler for periodic news fetching.

Runs the full pipeline every 30 minutes:
1. Fetch articles from all sources (RSS, HN, arXiv)
2. Filter for AI relevance
3. Save new articles to the database
4. Send push notifications if new articles were saved

Uses APScheduler's BackgroundScheduler so it runs in a separate
thread without blocking the FastAPI event loop.
"""

import asyncio
import logging
import threading

from apscheduler.schedulers.background import BackgroundScheduler

from database import SessionLocal
from services.fetcher import fetch_all_sources, fetch_og_images, save_articles
from services.notifier import send_notifications

logger = logging.getLogger(__name__)

# How often to fetch new articles (in minutes)
FETCH_INTERVAL_MINUTES = 30


def _run_fetch_cycle() -> None:
    """Execute one complete fetch-filter-save-notify cycle.

    This runs in a background thread via APScheduler. Creates a fresh
    event loop for the async fetchers since we're in a separate thread
    from uvicorn's main loop.
    """
    logger.info("Fetch started")

    # Create a brand new event loop for this thread — avoids conflicts
    # with uvicorn's main loop running in another thread
    loop = asyncio.new_event_loop()

    try:
        # Fetch from all sources
        raw_articles = loop.run_until_complete(fetch_all_sources())
        logger.info("Fetched %d articles total", len(raw_articles))

        # Scrape og:image from each article page
        loop.run_until_complete(fetch_og_images(raw_articles))
        images_found = sum(1 for a in raw_articles if a.get("image_url"))
        logger.info("Found og:images for %d / %d articles", images_found, len(raw_articles))

        # Filter and save to database
        db = SessionLocal()
        try:
            stats = save_articles(db, raw_articles)
            logger.info(
                "Scanned %d, passed filter %d, saved %d",
                stats["total_scanned"], stats["total_passed"], stats["total_saved"]
            )

            # Notify subscribers if we have new content
            if stats["total_saved"] > 0:
                send_notifications(db, stats["total_saved"])
        finally:
            db.close()

    except Exception as e:
        logger.error("Fetch cycle failed: %s", e, exc_info=True)
    finally:
        loop.close()


def start_scheduler() -> BackgroundScheduler:
    """Start the background scheduler.

    Returns the scheduler instance so it can be shut down cleanly
    during app shutdown.
    """
    scheduler = BackgroundScheduler()
    scheduler.add_job(
        _run_fetch_cycle,
        trigger="interval",
        minutes=FETCH_INTERVAL_MINUTES,
        id="news_fetch",
        name="Fetch AI news from all sources",
        replace_existing=True,
    )
    scheduler.start()
    logger.info(
        "Scheduler started — fetching every %d minutes", FETCH_INTERVAL_MINUTES
    )

    # Run once immediately in a separate thread so we don't conflict
    # with uvicorn's event loop during startup
    thread = threading.Thread(target=_run_fetch_cycle, daemon=True)
    thread.start()

    return scheduler
