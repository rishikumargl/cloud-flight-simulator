"""Keycloak OIDC migration Phase A: add keycloak_id, keep password_hash for rollback safety

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

    # Note: password_hash is NOT dropped in Phase A.
    # Phase B will drop password_hash after verifying all users have migrated to Keycloak.
    # This preserves the ability to rollback if Keycloak deployment fails.


def downgrade() -> None:
    """Reverse Keycloak migration Phase A."""
    # Step 1: Remove last_login_at column
    op.drop_column('users', 'last_login_at')

    # Step 2: Drop keycloak_id unique constraint and column
    op.drop_constraint(
        'uq_users_keycloak_id',
        'users',
        type_='unique'
    )
    op.drop_column('users', 'keycloak_id')
