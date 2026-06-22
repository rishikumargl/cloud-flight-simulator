"""Keycloak OIDC migration Phase A: add keycloak_id, remove JWT columns

Revision ID: 002
Revises: 001
Create Date: 2026-06-22

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Migrate users table from JWT to Keycloak OIDC."""
    # Step 1: Add keycloak_id column (nullable initially for gradual migration)
    op.add_column(
        'users',
        sa.Column('keycloak_id', sa.String(255), nullable=True)
    )

    # Step 2: Create unique index on keycloak_id to prevent duplicates
    op.create_unique_constraint(
        'uq_users_keycloak_id',
        'users',
        ['keycloak_id']
    )

    # Step 3: Add last_login_at column with server default (current timestamp)
    op.add_column(
        'users',
        sa.Column(
            'last_login_at',
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text('NOW()')
        )
    )

    # Step 4: Drop columns no longer needed (removed in Phase A)
    # Note: These columns are specific to JWT-based auth, not needed with Keycloak
    op.drop_column('users', 'password_hash')


def downgrade() -> None:
    """Reverse Keycloak migration Phase A."""
    # Step 1: Re-add password_hash column
    op.add_column(
        'users',
        sa.Column('password_hash', sa.String(255), nullable=True)
    )

    # Step 2: Remove last_login_at column
    op.drop_column('users', 'last_login_at')

    # Step 3: Drop keycloak_id unique constraint and column
    op.drop_constraint(
        'uq_users_keycloak_id',
        'users',
        type_='unique'
    )
    op.drop_column('users', 'keycloak_id')
