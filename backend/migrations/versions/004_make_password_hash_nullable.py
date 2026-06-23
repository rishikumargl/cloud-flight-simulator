"""Make password_hash nullable for Clerk users (no password hash from external provider)

Revision ID: 004
Revises: 003
Create Date: 2026-06-23

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '004'
down_revision = '003'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Make password_hash nullable for Clerk users."""
    op.alter_column(
        'users',
        'password_hash',
        existing_type=sa.String(255),
        nullable=True
    )


def downgrade() -> None:
    """Revert password_hash to NOT NULL."""
    op.alter_column(
        'users',
        'password_hash',
        existing_type=sa.String(255),
        nullable=False
    )
