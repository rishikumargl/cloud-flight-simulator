"""Add vm_name and zone columns to environments table for cleanup tracking

Revision ID: 008
Revises: 007
Create Date: 2026-06-23

This migration adds vm_name and zone columns to the environments table.
These columns are required to store GCP VM details so the stop endpoint
can actually delete VMs instead of just marking them as destroyed.

vm_name: The actual GCP VM instance name (e.g., 'sandbox-vm-a1b2c3d4')
zone: The GCP zone where the VM was provisioned (e.g., 'us-central1-a')

Both columns are nullable to support existing environments. New environments
will always populate them during provisioning.
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '008'
down_revision = '007'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add vm_name and zone columns to environments table."""
    op.add_column('environments', sa.Column('vm_name', sa.String(255), nullable=True))
    op.add_column('environments', sa.Column('zone', sa.String(100), nullable=True))


def downgrade() -> None:
    """Remove vm_name and zone columns from environments table."""
    op.drop_column('environments', 'zone')
    op.drop_column('environments', 'vm_name')
