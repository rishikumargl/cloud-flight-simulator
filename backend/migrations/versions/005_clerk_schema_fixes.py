"""Fix Clerk schema: make email nullable, clerk_id NOT NULL

Revision ID: 005
Revises: 004
Create Date: 2026-06-23

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '005'
down_revision = '004'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Make email nullable and clerk_id not null for Clerk users."""
    # Make email nullable (Clerk doesn't provide email in JWT)
    op.alter_column(
        'users',
        'email',
        existing_type=sa.String(255),
        nullable=True
    )


def downgrade() -> None:
    """Revert schema changes."""
    op.alter_column(
        'users',
        'email',
        existing_type=sa.String(255),
        nullable=False
    )
