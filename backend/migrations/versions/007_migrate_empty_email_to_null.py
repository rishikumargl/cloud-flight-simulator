"""Migrate empty string email/full_name to NULL for Clerk users

Revision ID: 007
Revises: 005
Create Date: 2026-06-23

"""
from alembic import op


# revision identifiers, used by Alembic.
revision = '007'
down_revision = '005'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Migrate empty email and full_name to NULL."""
    op.execute("UPDATE users SET email = NULL WHERE email = '';")
    op.execute("UPDATE users SET full_name = NULL WHERE full_name = '';")


def downgrade() -> None:
    """Revert - convert NULL back to empty string."""
    op.execute("UPDATE users SET email = '' WHERE email IS NULL AND clerk_id IS NOT NULL;")
    op.execute("UPDATE users SET full_name = '' WHERE full_name IS NULL AND clerk_id IS NOT NULL;")
