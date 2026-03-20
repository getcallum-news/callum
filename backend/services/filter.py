"""
AI relevance filter for incoming articles.

Two-stage filtering:
1. Keyword matching — checks title and summary against curated keyword
   lists covering core AI terms, model names, companies, and technical
   concepts.
2. Relevance scoring — title matches score 3x higher than summary
   matches because a keyword in the headline is a much stronger signal.
   Articles need a minimum score of 3 to pass.

This approach is intentionally simple and transparent. No ML model
needed — a well-maintained keyword list with weighted scoring catches
the vast majority of AI news while filtering out noise.
"""

import re

# ---------------------------------------------------------------------------
# Keyword lists — kept as module-level constants for fast access
# ---------------------------------------------------------------------------

CORE_KEYWORDS: list[str] = [
    "artificial intelligence", "machine learning", "deep learning",
    "neural network", "large language model", "llm", "generative ai",
    "gen ai", "ai model", "ai system",
]

MODEL_KEYWORDS: list[str] = [
    "openai", "chatgpt", "gpt-4", "gpt-5", "gpt-4o", "claude",
    "gemini", "mistral", "llama", "grok", "copilot", "dall-e",
    "sora", "midjourney", "stable diffusion",
]

COMPANY_KEYWORDS: list[str] = [
    "anthropic", "deepmind", "hugging face", "stability ai",
    "cohere", "nvidia ai", "google ai", "meta ai", "microsoft ai",
    "inflection", "xai", "perplexity", "runway",
]

TECH_KEYWORDS: list[str] = [
    "transformer", "diffusion model", "fine-tuning", "rag",
    "retrieval augmented", "computer vision", "nlp",
    "natural language processing", "reinforcement learning",
    "ai safety", "alignment", "ai agent", "multimodal",
    "foundation model", "vector database", "embedding",
    "tokenizer", "inference", "ai chip", "gpu cluster",
    "training run", "benchmark", "hallucination", "prompt",
]

# Flattened list for scoring — no need to distinguish categories during scoring
ALL_KEYWORDS: list[str] = CORE_KEYWORDS + MODEL_KEYWORDS + COMPANY_KEYWORDS + TECH_KEYWORDS

# Safety-related keywords used for category detection
SAFETY_KEYWORDS: list[str] = ["safety", "alignment", "regulation", "ai safety", "ai regulation"]

# Minimum score to keep an article
MIN_RELEVANCE_SCORE: int = 3

# Scoring weights
TITLE_MATCH_WEIGHT: int = 3
SUMMARY_MATCH_WEIGHT: int = 1


def calculate_relevance_score(title: str, summary: str | None) -> int:
    """Score an article's AI relevance based on keyword matches.

    Title matches are worth 3 points each because a keyword in the
    headline is a strong signal. Summary matches are worth 1 point.
    The total score determines whether the article passes the filter.

    Args:
        title: Article headline (required).
        summary: Article summary/description (may be None).

    Returns:
        Integer relevance score. Higher = more relevant.
    """
    score = 0
    title_lower = title.lower()
    summary_lower = (summary or "").lower()

    for keyword in ALL_KEYWORDS:
        # Use word boundary matching to avoid false positives
        # e.g., "prompt" shouldn't match "prompted" in unrelated contexts,
        # but we keep it simple — substring match is good enough for
        # multi-word terms, and single words in AI context are almost
        # always relevant
        if keyword in title_lower:
            score += TITLE_MATCH_WEIGHT
        if keyword in summary_lower:
            score += SUMMARY_MATCH_WEIGHT

    return score


def passes_filter(title: str, summary: str | None) -> tuple[bool, int]:
    """Check whether an article is relevant enough to keep.

    Args:
        title: Article headline.
        summary: Article summary/description.

    Returns:
        Tuple of (passes: bool, score: int). The score is returned
        even for rejected articles so callers can log it.
    """
    score = calculate_relevance_score(title, summary)
    return score >= MIN_RELEVANCE_SCORE, score


def detect_category(title: str, summary: str | None, source: str | None) -> str:
    """Assign a category based on source and content keywords.

    Categories:
    - "research" — academic papers and research findings
    - "safety" — AI safety, alignment, regulation
    - "tools" — product launches, developer tools, releases
    - "industry" — business news, funding, partnerships

    Args:
        title: Article headline.
        summary: Article summary/description.
        source: Where the article came from (e.g., "arXiv", "TechCrunch").

    Returns:
        Category string.
    """
    # arXiv is always research
    if source and source.lower() == "arxiv":
        return "research"

    combined = f"{title} {summary or ""}".lower()

    # Check for safety content first — it's the most specific category
    if any(kw in combined for kw in SAFETY_KEYWORDS):
        return "safety"

    # Tool launches and releases
    tool_signals = ["launch", "release", "open source", "api", "sdk",
                    "developer", "tool", "framework", "library", "plugin"]
    if any(signal in combined for signal in tool_signals):
        return "tools"

    # Everything else is industry news
    return "industry"
