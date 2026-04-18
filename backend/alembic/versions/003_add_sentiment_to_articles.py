"""add sentiment columns to articles

Revision ID: 003_sentiment
Revises: 002_image_url
Create Date: 2026-04-18
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic
revision: str = '003_sentiment'
down_revision: Union[str, None] = '002_image_url'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('articles', sa.Column('sentiment', sa.String(20), nullable=True))
    op.add_column('articles', sa.Column('sentiment_score', sa.Float(), nullable=True))


def downgrade() -> None:
    op.drop_column('articles', 'sentiment_score')
    op.drop_column('articles', 'sentiment')
