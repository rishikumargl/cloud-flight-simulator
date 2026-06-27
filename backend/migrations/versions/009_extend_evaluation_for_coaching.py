"""Extend Evaluation model for coaching feedback and adaptive learning.

Revision ID: 009
Revises: 008
Create Date: 2026-06-28 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '009'
down_revision = '008'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add new columns to evaluations table
    op.add_column('evaluations', sa.Column('solution_description', sa.Text(), nullable=True))
    op.add_column('evaluations', sa.Column('explanation_score', sa.Integer(), nullable=True))
    op.add_column('evaluations', sa.Column('coach_feedback_json', postgresql.JSONB(), nullable=True))
    op.add_column('evaluations', sa.Column('analytics_json', postgresql.JSONB(), nullable=True))
    op.add_column('evaluations', sa.Column('technical_skill_breakdown_json', postgresql.JSONB(), nullable=True))
    op.add_column('evaluations', sa.Column('recommendation_json', postgresql.JSONB(), nullable=True))
    op.add_column('evaluations', sa.Column('overall_feedback_summary', sa.Text(), nullable=True))


def downgrade() -> None:
    # Remove columns in reverse order
    op.drop_column('evaluations', 'overall_feedback_summary')
    op.drop_column('evaluations', 'recommendation_json')
    op.drop_column('evaluations', 'technical_skill_breakdown_json')
    op.drop_column('evaluations', 'analytics_json')
    op.drop_column('evaluations', 'coach_feedback_json')
    op.drop_column('evaluations', 'explanation_score')
    op.drop_column('evaluations', 'solution_description')
