"""add image_url column to articles

Revision ID: 002_image_url
Revises: 85bd60da3b4d
Create Date: 2026-03-25
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic
revision: str = '002_image_url'
down_revision: Union[str, None] = '85bd60da3b4d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('articles', sa.Column('image_url', sa.String(2000), nullable=True))


def downgrade() -> None:
    op.drop_column('articles', 'image_url')
