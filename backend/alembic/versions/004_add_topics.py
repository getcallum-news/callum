"""add topics table and topic columns to articles

Revision ID: 004_topics
Revises: 003_sentiment
Create Date: 2026-04-24
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic
revision: str = '004_topics'
down_revision: Union[str, None] = '003_sentiment'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create topics table first (articles FK references it)
    op.create_table(
        'topics',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('label', sa.String(200), nullable=False),
        sa.Column('top_terms', sa.JSON(), nullable=False),
        sa.Column('article_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )

    # 2. Add topic_id + topic_keywords to articles
    op.add_column('articles', sa.Column('topic_id', sa.Integer(), nullable=True))
    op.add_column('articles', sa.Column('topic_keywords', sa.JSON(), nullable=True))

    # 3. FK constraint with ON DELETE SET NULL so re-clustering safely clears assignments
    op.create_foreign_key(
        'fk_articles_topic_id',
        'articles', 'topics',
        ['topic_id'], ['id'],
        ondelete='SET NULL',
    )
    op.create_index('ix_articles_topic_id', 'articles', ['topic_id'])


def downgrade() -> None:
    op.drop_index('ix_articles_topic_id', table_name='articles')
    op.drop_constraint('fk_articles_topic_id', 'articles', type_='foreignkey')
    op.drop_column('articles', 'topic_keywords')
    op.drop_column('articles', 'topic_id')
    op.drop_table('topics')
