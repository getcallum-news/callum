"""
One-time backfill script: analyze sentiment for all existing articles.

Usage:
    cd backend
    python scripts/backfill_sentiment.py

Processes articles in batches of 100. Safe to re-run — skips articles
that already have a sentiment value.
"""

import sys
import os

# Add parent directory to path so we can import our modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from dotenv import load_dotenv

load_dotenv()

from database import SessionLocal
from models import Article
from services.sentiment import analyze_sentiment


BATCH_SIZE = 100


def main() -> None:
    db = SessionLocal()
    try:
        # Count articles needing sentiment
        total = (
            db.query(Article)
            .filter(Article.is_active == True, Article.sentiment == None)
            .count()
        )
        print(f"Found {total} articles without sentiment. Processing...")

        processed = 0
        while True:
            articles = (
                db.query(Article)
                .filter(Article.is_active == True, Article.sentiment == None)
                .limit(BATCH_SIZE)
                .all()
            )

            if not articles:
                break

            for article in articles:
                result = analyze_sentiment(article.title, article.summary)
                article.sentiment = result["sentiment"]
                article.sentiment_score = result["sentiment_score"]

            db.commit()
            processed += len(articles)
            print(f"  Processed {processed}/{total} articles...")

        print(f"Done! Backfilled sentiment for {processed} articles.")

        # Print distribution
        for label in ["positive", "negative", "neutral", "mixed"]:
            count = (
                db.query(Article)
                .filter(Article.is_active == True, Article.sentiment == label)
                .count()
            )
            print(f"  {label}: {count}")

    finally:
        db.close()


if __name__ == "__main__":
    main()
