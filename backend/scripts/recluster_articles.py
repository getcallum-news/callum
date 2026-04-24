#!/usr/bin/env python3
"""
Run BERTopic clustering on all articles and persist results.

Usage (Railway production):
    PYTHONPATH=. railway run python scripts/recluster_articles.py

Usage (local, with .env loaded):
    cd backend
    PYTHONPATH=. python scripts/recluster_articles.py

The script downloads all-MiniLM-L6-v2 on first run (~80 MB).
Subsequent runs reuse the cached model.  Expect ~2-5 min on CPU
for 900+ articles.
"""

import sys
import os

# Ensure the backend root is on the path regardless of CWD
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from database import SessionLocal
from services.topic_modeling import topic_modeler


def main() -> None:
    print("Running BERTopic clustering on all articles…")
    print("(First run will download the ~80 MB all-MiniLM-L6-v2 model)")

    db = SessionLocal()
    try:
        stats = topic_modeler.run_clustering(db)
    finally:
        db.close()

    if stats.get("skipped"):
        print(f"Skipped: {stats['reason']}")
        sys.exit(0)

    n_topics   = stats["n_topics"]
    n_assigned = stats["n_assigned"]
    n_total    = stats["n_total"]
    n_outliers = n_total - n_assigned

    print(f"\nDone!")
    print(f"  Topics discovered : {n_topics}")
    print(f"  Articles assigned : {n_assigned} / {n_total}")
    print(f"  Outliers (no topic): {n_outliers}")


if __name__ == "__main__":
    main()
