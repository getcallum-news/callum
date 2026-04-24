"""Topic modeling using BERTopic + sentence embeddings.

Pipeline overview:
  1. all-MiniLM-L6-v2  — encodes each article's title+summary into 384-dim vectors
  2. UMAP               — compresses vectors from 384 → 5 dims (faster, better clusters)
  3. HDBSCAN            — density-based clustering (discovers k automatically)
  4. c-TF-IDF           — extracts the most representative keywords per cluster

All heavy imports (BERTopic, sentence-transformers, umap-learn, hdbscan) are
deferred inside run_clustering() so normal API startup is fast and unaffected.

Clustering runs as a daily scheduled job at 03:00 UTC.  The module-level
`topic_modeler` singleton is what the scheduler calls.
"""

import logging
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from models import Article, Topic

logger = logging.getLogger(__name__)

# BERTopic will merge smaller topics until this many remain.
MAX_TOPICS = 20
# Minimum articles required to attempt clustering.
MIN_ARTICLES = 30


def _make_label(words: list[tuple[str, float]]) -> str:
    """Build a readable label from BERTopic's top words.

    e.g. [("gpt", 0.9), ("model", 0.7), ("openai", 0.6), ("release", 0.4)]
         → "GPT · Model · OpenAI · Release"
    """
    return " · ".join(w.capitalize() for w, _ in words[:4])


class TopicModeler:
    """Wraps BERTopic for clustering Callum articles.

    Designed to be instantiated once (as a module-level singleton) and
    invoked by the APScheduler background thread.  Heavy deps are lazy.
    """

    def run_clustering(self, db: Session) -> dict:
        """Fit BERTopic on all active articles and persist results to the DB.

        Returns a summary dict:
            skipped (bool)     — True if clustering was skipped
            reason  (str)      — why it was skipped (only when skipped=True)
            n_topics (int)     — number of topics discovered
            n_assigned (int)   — articles with a topic assignment
            n_total (int)      — total articles processed
        """
        articles = (
            db.query(Article)
            .filter(Article.is_active.is_(True))
            .order_by(Article.fetched_at.desc())
            .all()
        )

        if len(articles) < MIN_ARTICLES:
            logger.warning(
                "Topic modeling skipped — only %d articles (need %d)",
                len(articles), MIN_ARTICLES,
            )
            return {
                "skipped": True,
                "reason": f"need at least {MIN_ARTICLES} articles, got {len(articles)}",
            }

        logger.info("Starting BERTopic clustering on %d articles…", len(articles))

        # Build plain-text documents: title + summary
        docs = [
            f"{a.title or ''}{('. ' + a.summary) if a.summary else ''}"
            for a in articles
        ]

        # --- Lazy imports: only loaded when clustering actually runs ---
        try:
            from bertopic import BERTopic
            from sentence_transformers import SentenceTransformer
            from umap import UMAP
            from hdbscan import HDBSCAN
            from sklearn.feature_extraction.text import CountVectorizer
        except ImportError as exc:
            logger.error("Topic modeling deps not installed: %s", exc)
            return {"skipped": True, "reason": str(exc)}

        # Embedding model — sentence-transformers caches the download
        embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

        # UMAP: reduce 384-dim → 5-dim manifold before clustering
        umap_model = UMAP(
            n_neighbors=15,
            n_components=5,
            min_dist=0.0,
            metric="cosine",
            random_state=42,
        )

        # HDBSCAN: density-based — doesn't need k upfront.
        # min_cluster_size=10 keeps clusters tight (avoid one catch-all topic
        # swallowing half the corpus, which happened with size=5).
        hdbscan_model = HDBSCAN(
            min_cluster_size=10,
            min_samples=3,
            metric="euclidean",
            cluster_selection_method="eom",
            prediction_data=True,
        )

        # c-TF-IDF vectorizer — filters English stopwords so labels don't
        # come out as "And · The · Of · To", and drops hapax-legomena with
        # min_df=2. Bigrams surface multi-word terms like "large language".
        vectorizer_model = CountVectorizer(
            stop_words="english",
            min_df=2,
            ngram_range=(1, 2),
        )

        topic_model = BERTopic(
            embedding_model=embedding_model,
            umap_model=umap_model,
            hdbscan_model=hdbscan_model,
            vectorizer_model=vectorizer_model,
            nr_topics="auto",        # let BERTopic decide — no forced merge
            top_n_words=10,
            verbose=False,
        )

        topic_assignments, _ = topic_model.fit_transform(docs)
        topic_info_df = topic_model.get_topic_info()

        raw_topic_count = len(topic_info_df) - 1  # subtract the -1 (outliers) row
        logger.info("BERTopic found %d raw topics before merging", raw_topic_count)

        now = datetime.now(timezone.utc)

        # --- Persist topics -----------------------------------------------
        # Wipe existing rows — articles will have topic_id SET NULL by the FK.
        db.query(Topic).delete()
        db.flush()

        for _, row in topic_info_df.iterrows():
            tid = int(row["Topic"])
            if tid == -1:
                continue  # outlier cluster — stored as NULL on articles

            words = topic_model.get_topic(tid) or []
            db.add(Topic(
                id=tid,
                label=_make_label(words),
                top_terms=[w for w, _ in words[:10]],
                article_count=int(row["Count"]),
                updated_at=now,
            ))

        db.flush()

        # --- Update article topic assignments --------------------------------
        for article, tid in zip(articles, topic_assignments):
            tid_int = int(tid)
            if tid_int == -1:
                article.topic_id = None
                article.topic_keywords = None
            else:
                words = topic_model.get_topic(tid_int) or []
                article.topic_id = tid_int
                article.topic_keywords = [w for w, _ in words[:5]]

        db.commit()

        n_topics = len({t for t in topic_assignments if t != -1})
        n_assigned = sum(1 for t in topic_assignments if t != -1)

        logger.info(
            "Topic clustering done — %d topics, %d/%d articles assigned",
            n_topics, n_assigned, len(articles),
        )

        return {
            "skipped": False,
            "n_topics": n_topics,
            "n_assigned": n_assigned,
            "n_total": len(articles),
        }


# Module-level singleton — imported by scheduler and recluster script
topic_modeler = TopicModeler()
