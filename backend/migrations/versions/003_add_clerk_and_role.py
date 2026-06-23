"""Migrate from Keycloak to Clerk - add clerk_id and role columns

Revision ID: 003
Revises: 002
Create Date: 2026-06-22

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add Clerk support and role-based authorization."""
    # Add clerk_id column (nullable for gradual migration)
    op.add_column(
        'users',
        sa.Column('clerk_id', sa.String(255), nullable=True)
    )

    # Create unique constraint on clerk_id
    op.create_unique_constraint(
        'uq_users_clerk_id',
        'users',
        ['clerk_id']
    )

    # Create index for fast lookups
    op.create_index(
        'idx_users_clerk_id',
        'users',
        ['clerk_id']
    )

    # Add role column with default LEARNER
    op.add_column(
        'users',
        sa.Column(
            'role',
            sa.String(50),
            nullable=False,
            server_default='LEARNER'
        )
    )

    # Add check constraint to enforce valid roles
    op.create_check_constraint(
        'check_valid_role',
        'users',
        "role IN ('LEARNER', 'ADMIN', 'PLATFORM_ADMIN')"
    )


def downgrade() -> None:
    """Reverse Clerk migration."""
    # Drop check constraint
    op.drop_constraint(
        'check_valid_role',
        'users',
        type_='check'
    )

    # Drop role column
    op.drop_column('users', 'role')

    # Drop clerk_id constraints and column
    op.drop_constraint(
        'uq_users_clerk_id',
        'users',
        type_='unique'
    )
    op.drop_index('idx_users_clerk_id')
    op.drop_column('users', 'clerk_id')
