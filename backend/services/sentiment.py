"""
Sentiment analysis for news articles using VADER.

VADER (Valence Aware Dictionary and sEntiment Reasoner) is optimized
for social media and news text. It works well with headlines and short
summaries — exactly what we store. No API key or GPU needed.

Each article gets:
  - sentiment:       "positive" | "negative" | "neutral" | "mixed"
  - sentiment_score: float from -1.0 (most negative) to 1.0 (most positive)
"""

import logging

from nltk.sentiment.vader import SentimentIntensityAnalyzer

logger = logging.getLogger(__name__)

# Singleton analyzer — loaded once, reused across all calls
_analyzer: SentimentIntensityAnalyzer | None = None


def _get_analyzer() -> SentimentIntensityAnalyzer:
    """Lazy-load the VADER analyzer (downloads lexicon on first use)."""
    global _analyzer
    if _analyzer is None:
        import nltk
        # Download vader_lexicon if not already present (idempotent)
        nltk.download("vader_lexicon", quiet=True)
        _analyzer = SentimentIntensityAnalyzer()
    return _analyzer


def analyze_sentiment(title: str, summary: str | None = None) -> dict:
    """Analyze the sentiment of an article from its title and summary.

    Combines title (weighted 2x) and summary into a single compound score.
    Title is weighted more heavily because headlines carry stronger
    sentiment signals than body text.

    Returns:
        dict with 'sentiment' (str) and 'sentiment_score' (float).
    """
    analyzer = _get_analyzer()

    # Score the title (always present)
    title_scores = analyzer.polarity_scores(title)

    # Score the summary if available
    if summary:
        summary_scores = analyzer.polarity_scores(summary)
        # Weighted average: title counts 2x because headlines are
        # more editorially intentional than summaries
        compound = (title_scores["compound"] * 2 + summary_scores["compound"]) / 3
    else:
        compound = title_scores["compound"]

    # Classify into buckets using standard VADER thresholds
    # with a "mixed" category for articles with strong positive AND negative signals
    if summary:
        pos_signal = max(title_scores["pos"], summary_scores["pos"])
        neg_signal = max(title_scores["neg"], summary_scores["neg"])
    else:
        pos_signal = title_scores["pos"]
        neg_signal = title_scores["neg"]

    # "Mixed" = strong signals in both directions
    if pos_signal >= 0.2 and neg_signal >= 0.2:
        label = "mixed"
    elif compound >= 0.05:
        label = "positive"
    elif compound <= -0.05:
        label = "negative"
    else:
        label = "neutral"

    return {
        "sentiment": label,
        "sentiment_score": round(compound, 4),
    }


def analyze_batch(articles: list[dict]) -> None:
    """Analyze sentiment for a batch of articles in-place.

    Adds 'sentiment' and 'sentiment_score' keys to each article dict.
    Errors on individual articles are logged and skipped (article gets
    neutral sentiment).
    """
    for article in articles:
        try:
            result = analyze_sentiment(
                article.get("title", ""),
                article.get("summary"),
            )
            article["sentiment"] = result["sentiment"]
            article["sentiment_score"] = result["sentiment_score"]
        except Exception as e:
            logger.error(
                "Sentiment analysis failed for '%s': %s",
                article.get("title", "")[:60],
                e,
            )
            article["sentiment"] = "neutral"
            article["sentiment_score"] = 0.0
