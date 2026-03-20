"""
SQLAlchemy ORM models for Callum.

Two tables:
- Article: stores filtered AI news articles (title + summary only, never full body)
- PushSubscription: stores Web Push subscription info for notifications
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Integer, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID

from database import Base


class Article(Base):
    """A filtered AI news article.

    Only stores title, summary (max 1000 chars), and a link to the
    original source. Full article bodies are never stored — this keeps
    us on the right side of copyright law.
    """

    __tablename__ = "articles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(500), nullable=False)
    summary = Column(String(1000), nullable=True)
    url = Column(String, unique=True, nullable=False, index=True)
    source = Column(String(100), nullable=True)
    published_at = Column(DateTime(timezone=True), nullable=True)
    fetched_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    relevance_score = Column(Integer, default=0)
    category = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    def __repr__(self) -> str:
        return f"<Article {self.source}: {self.title[:60]}>"


class PushSubscription(Base):
    """A Web Push subscription endpoint.

    Stores the three pieces needed to send a push notification:
    endpoint URL, p256dh key, and auth secret. Soft-deleted via
    is_active when a user unsubscribes or the browser returns 410.
    """

    __tablename__ = "push_subscriptions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    endpoint = Column(String, unique=True, nullable=False, index=True)
    p256dh = Column(String, nullable=False)
    auth = Column(String, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    is_active = Column(Boolean, default=True, nullable=False)

    def __repr__(self) -> str:
        return f"<PushSubscription {self.endpoint[:40]}>"


class FetchCycle(Base):
    """Tracks each fetch cycle's stats for the live counter."""

    __tablename__ = "fetch_cycles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    total_scanned = Column(Integer, default=0, nullable=False)
    total_passed = Column(Integer, default=0, nullable=False)
    total_saved = Column(Integer, default=0, nullable=False)
    fetched_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    def __repr__(self) -> str:
        return f"<FetchCycle scanned={self.total_scanned} passed={self.total_passed} saved={self.total_saved}>"
