"""Initial schema: all 9 platform tables

Revision ID: 001
Revises:
Create Date: 2026-06-22

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Table 1: users (P2_RESPONSIBILITY_ANALYSIS.md lines 262-273)
    op.create_table(
        'users',
        sa.Column('user_id', sa.UUID(), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('email', sa.String(255), nullable=False, unique=True),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('full_name', sa.String(255), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.PrimaryKeyConstraint('user_id')
    )
    op.create_index('idx_users_email', 'users', ['email'], unique=False)

    # Table 2: refresh_tokens (P2_RESPONSIBILITY_ANALYSIS.md lines 280-289, P2_PLATFORM.md lines 132-141)
    op.create_table(
        'refresh_tokens',
        sa.Column('token_id', sa.UUID(), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('token_hash', sa.String(255), nullable=False),
        sa.Column('expires_at', sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id']),
        sa.PrimaryKeyConstraint('token_id')
    )
    op.create_index('idx_refresh_tokens_user', 'refresh_tokens', ['user_id'], unique=False)

    # Table 3: missions (P2_RESPONSIBILITY_ANALYSIS.md lines 297-312)
    op.create_table(
        'missions',
        sa.Column('mission_id', sa.UUID(), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('track', sa.String(50), nullable=False),
        sa.Column('difficulty', sa.String(50), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('business_context', sa.Text(), nullable=False),
        sa.Column('objectives', JSONB(), nullable=False),
        sa.Column('success_criteria', JSONB(), nullable=False),
        sa.Column('time_limit_minutes', sa.Integer(), nullable=False),
        sa.Column('generated_by', sa.String(100), nullable=False, server_default='scenario-generator'),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.PrimaryKeyConstraint('mission_id')
    )
    op.create_index('idx_missions_track', 'missions', ['track'], unique=False)
    op.create_index('idx_missions_difficulty', 'missions', ['difficulty'], unique=False)

    # Table 4: challenge_sessions (P2_RESPONSIBILITY_ANALYSIS.md lines 320-334)
    op.create_table(
        'challenge_sessions',
        sa.Column('session_id', sa.UUID(), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('mission_id', sa.UUID(), nullable=False),
        sa.Column('status', sa.String(50), nullable=False, server_default='CREATED'),
        sa.Column('started_at', sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column('completed_at', sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column('expires_at', sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column('score', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id']),
        sa.ForeignKeyConstraint(['mission_id'], ['missions.mission_id']),
        sa.PrimaryKeyConstraint('session_id')
    )
    op.create_index('idx_sessions_user', 'challenge_sessions', ['user_id'], unique=False)
    op.create_index('idx_sessions_mission', 'challenge_sessions', ['mission_id'], unique=False)

    # Table 5: environments (P2_RESPONSIBILITY_ANALYSIS.md lines 342-357)
    op.create_table(
        'environments',
        sa.Column('env_id', sa.UUID(), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('session_id', sa.UUID(), nullable=False, unique=True),
        sa.Column('gcp_project_id', sa.String(255), nullable=False),
        sa.Column('scoped_sa_email', sa.String(500), nullable=False),
        sa.Column('resource_prefix', sa.String(20), nullable=False, unique=True),
        sa.Column('status', sa.String(20), nullable=False, server_default='PROVISIONING'),
        sa.Column('expires_at', sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('destroyed_at', sa.TIMESTAMP(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['session_id'], ['challenge_sessions.session_id']),
        sa.PrimaryKeyConstraint('env_id')
    )
    op.create_index(
        'idx_environments_active_prefix',
        'environments',
        ['resource_prefix'],
        unique=True,
        postgresql_where=sa.text("status = 'READY'")
    )

    # Table 6: submissions (CLAUDE.md line 133, referenced in tables)
    op.create_table(
        'submissions',
        sa.Column('submission_id', sa.UUID(), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('session_id', sa.UUID(), nullable=False),
        sa.Column('explanation', sa.Text(), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['session_id'], ['challenge_sessions.session_id']),
        sa.PrimaryKeyConstraint('submission_id')
    )
    op.create_index('idx_submissions_session', 'submissions', ['session_id'], unique=False)

    # Table 7: evaluations (P2_RESPONSIBILITY_ANALYSIS.md lines 365-375)
    op.create_table(
        'evaluations',
        sa.Column('evaluation_id', sa.UUID(), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('session_id', sa.UUID(), nullable=False),
        sa.Column('percentage', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('criteria_results', JSONB(), nullable=False),
        sa.Column('resource_snapshot', JSONB(), nullable=False),
        sa.Column('evaluated_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['session_id'], ['challenge_sessions.session_id']),
        sa.PrimaryKeyConstraint('evaluation_id')
    )
    op.create_index('idx_evaluations_session', 'evaluations', ['session_id'], unique=False)

    # Table 8: feedback_reports (P2_RESPONSIBILITY_ANALYSIS.md lines 383-395)
    op.create_table(
        'feedback_reports',
        sa.Column('feedback_id', sa.UUID(), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('session_id', sa.UUID(), nullable=False),
        sa.Column('summary', sa.Text(), nullable=False),
        sa.Column('strengths', JSONB(), nullable=True),
        sa.Column('mistakes', JSONB(), nullable=True),
        sa.Column('improvements', JSONB(), nullable=True),
        sa.Column('next_recommendation', JSONB(), nullable=True),
        sa.Column('generated_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['session_id'], ['challenge_sessions.session_id']),
        sa.PrimaryKeyConstraint('feedback_id')
    )
    op.create_index('idx_feedback_session', 'feedback_reports', ['session_id'], unique=False)

    # Table 9: audit_events (P2_RESPONSIBILITY_ANALYSIS.md lines 403-416)
    op.create_table(
        'audit_events',
        sa.Column('event_id', sa.UUID(), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', sa.UUID(), nullable=True),
        sa.Column('session_id', sa.UUID(), nullable=True),
        sa.Column('event_type', sa.String(100), nullable=False),
        sa.Column('source', sa.String(100), nullable=False),
        sa.Column('payload', JSONB(), nullable=True),
        sa.Column('occurred_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id']),
        sa.ForeignKeyConstraint(['session_id'], ['challenge_sessions.session_id']),
        sa.PrimaryKeyConstraint('event_id')
    )
    op.create_index('idx_audit_user', 'audit_events', ['user_id'], unique=False)
    op.create_index('idx_audit_session', 'audit_events', ['session_id'], unique=False)
    op.create_index('idx_audit_event_type', 'audit_events', ['event_type'], unique=False)


def downgrade() -> None:
    op.drop_index('idx_audit_event_type', table_name='audit_events')
    op.drop_index('idx_audit_session', table_name='audit_events')
    op.drop_index('idx_audit_user', table_name='audit_events')
    op.drop_table('audit_events')

    op.drop_index('idx_feedback_session', table_name='feedback_reports')
    op.drop_table('feedback_reports')

    op.drop_index('idx_evaluations_session', table_name='evaluations')
    op.drop_table('evaluations')

    op.drop_index('idx_submissions_session', table_name='submissions')
    op.drop_table('submissions')

    op.drop_index('idx_environments_active_prefix', table_name='environments')
    op.drop_table('environments')

    op.drop_index('idx_sessions_mission', table_name='challenge_sessions')
    op.drop_index('idx_sessions_user', table_name='challenge_sessions')
    op.drop_table('challenge_sessions')

    op.drop_index('idx_missions_difficulty', table_name='missions')
    op.drop_index('idx_missions_track', table_name='missions')
    op.drop_table('missions')

    op.drop_index('idx_refresh_tokens_user', table_name='refresh_tokens')
    op.drop_table('refresh_tokens')

    op.drop_index('idx_users_email', table_name='users')
    op.drop_table('users')
