"""Create articles and push_subscriptions tables

Revision ID: 001
Revises: None
Create Date: 2025-01-01 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

# revision identifiers, used by Alembic
revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Articles table — stores filtered AI news
    op.create_table(
        "articles",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("summary", sa.String(1000), nullable=True),
        sa.Column("url", sa.String, nullable=False),
        sa.Column("source", sa.String(100), nullable=True),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("fetched_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("relevance_score", sa.Integer, default=0),
        sa.Column("category", sa.String(50), nullable=True),
        sa.Column("is_active", sa.Boolean, default=True, nullable=False),
    )
    op.create_index("ix_articles_url", "articles", ["url"], unique=True)

    # Push subscriptions table — stores Web Push endpoints
    op.create_table(
        "push_subscriptions",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("endpoint", sa.String, nullable=False),
        sa.Column("p256dh", sa.String, nullable=False),
        sa.Column("auth", sa.String, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("is_active", sa.Boolean, default=True, nullable=False),
    )
    op.create_index(
        "ix_push_subscriptions_endpoint",
        "push_subscriptions",
        ["endpoint"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("ix_push_subscriptions_endpoint", table_name="push_subscriptions")
    op.drop_table("push_subscriptions")
    op.drop_index("ix_articles_url", table_name="articles")
    op.drop_table("articles")
