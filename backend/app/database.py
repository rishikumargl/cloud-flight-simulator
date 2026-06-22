"""SQLAlchemy database models and session management."""
from sqlalchemy import create_engine, Column, String, DateTime, Integer, Float, Text, UUID, ForeignKey, JSONB, Boolean, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from datetime import datetime
import uuid as python_uuid
import os

# Database connection
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://user:password@localhost/cloud_flight_simulator"
)

engine = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


# ==================== P2: AUTH ====================

class User(Base):
    __tablename__ = "users"

    user_id = Column(PGUUID(as_uuid=True), primary_key=True, default=python_uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255))
    role = Column(String(20), nullable=False, default="LEARNER", index=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    token_id = Column(PGUUID(as_uuid=True), primary_key=True, default=python_uuid.uuid4)
    user_id = Column(PGUUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False, index=True)
    token_hash = Column(String(255), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)


# ==================== P3: SCENARIOS ====================

class Mission(Base):
    __tablename__ = "missions"

    mission_id = Column(PGUUID(as_uuid=True), primary_key=True, default=python_uuid.uuid4)
    track = Column(String(50), nullable=False)
    difficulty = Column(String(50), nullable=False)
    title = Column(String(255), nullable=False)
    business_context = Column(Text, nullable=False)
    objectives = Column(JSONB, nullable=False)  # ["Create a VM", "Expose HTTP access"]
    success_criteria = Column(JSONB, nullable=False)  # [{criterion_id, description, resource_type, expected_state, weight}, ...]
    time_limit_minutes = Column(Integer, nullable=False)
    generated_by = Column(String(100), default="scenario-generator")
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)


# ==================== P4: CHALLENGES ====================

class ChallengeSession(Base):
    __tablename__ = "challenge_sessions"

    session_id = Column(PGUUID(as_uuid=True), primary_key=True, default=python_uuid.uuid4)
    user_id = Column(PGUUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    mission_id = Column(PGUUID(as_uuid=True), ForeignKey("missions.mission_id"), nullable=False)
    env_id = Column(PGUUID(as_uuid=True), ForeignKey("environments.env_id"), nullable=True)
    status = Column(String(50), nullable=False, default="CREATED")  # CREATED, ACTIVE, COMPLETED, TIMEOUT, FAILED
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    expires_at = Column(DateTime)
    score = Column(Float)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)


class Environment(Base):
    __tablename__ = "environments"

    env_id = Column(PGUUID(as_uuid=True), primary_key=True, default=python_uuid.uuid4)
    session_id = Column(PGUUID(as_uuid=True), ForeignKey("challenge_sessions.session_id"), unique=True, nullable=False)
    gcp_project_id = Column(String(255), nullable=False)
    scoped_sa_email = Column(String(500), nullable=False)  # Platform service account email
    resource_prefix = Column(String(20), nullable=False, unique=True)
    granted_principal = Column(String(255))  # Learner's Google email
    iam_binding_title = Column(String(255))  # For targeted revocation
    status = Column(String(20), nullable=False, default="PROVISIONING")  # PROVISIONING, READY, DESTROYED
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    destroyed_at = Column(DateTime)


# ==================== P1: SUBMISSIONS ====================

class Submission(Base):
    __tablename__ = "submissions"

    submission_id = Column(PGUUID(as_uuid=True), primary_key=True, default=python_uuid.uuid4)
    session_id = Column(PGUUID(as_uuid=True), ForeignKey("challenge_sessions.session_id"), nullable=False)
    description = Column(Text, nullable=False)
    submitted_at = Column(DateTime, nullable=False, default=datetime.utcnow)


# ==================== P5: EVALUATIONS ====================

class Evaluation(Base):
    __tablename__ = "evaluations"

    evaluation_id = Column(PGUUID(as_uuid=True), primary_key=True, default=python_uuid.uuid4)
    session_id = Column(PGUUID(as_uuid=True), ForeignKey("challenge_sessions.session_id"), nullable=False)
    submission_id = Column(PGUUID(as_uuid=True), ForeignKey("submissions.submission_id"), nullable=True)
    percentage = Column(Float, nullable=False)
    evaluation_mode = Column(String(50), nullable=False)  # "LLM_GROUNDED"
    criteria_results = Column(JSONB, nullable=False)  # [{criterion_id, description, resource_met, understanding_score, reasoning, points_awarded}, ...]
    resource_snapshot = Column(JSONB, nullable=False)  # {gcp_project_id, resource_prefix, resources: {...}, fetched_at}
    evaluated_at = Column(DateTime, nullable=False, default=datetime.utcnow)


# ==================== P6: FEEDBACK ====================

class FeedbackReport(Base):
    __tablename__ = "feedback_reports"

    feedback_id = Column(PGUUID(as_uuid=True), primary_key=True, default=python_uuid.uuid4)
    session_id = Column(PGUUID(as_uuid=True), ForeignKey("challenge_sessions.session_id"), nullable=False)
    evaluation_id = Column(PGUUID(as_uuid=True), ForeignKey("evaluations.evaluation_id"), nullable=True)
    summary = Column(Text, nullable=False)
    strengths = Column(JSONB)  # ["Correct machine type", ...]
    mistakes = Column(JSONB)  # ["Firewall rule missing", ...]
    improvements = Column(JSONB)  # ["Review ingress configuration", ...]
    next_recommendation = Column(JSONB)  # {track, difficulty, reason}
    generated_at = Column(DateTime, nullable=False, default=datetime.utcnow)


# ==================== P7: AUDIT ====================

class AuditEvent(Base):
    __tablename__ = "audit_events"

    event_id = Column(PGUUID(as_uuid=True), primary_key=True, default=python_uuid.uuid4)
    event_type = Column(String(100), nullable=False)
    source = Column(String(100), nullable=False)
    user_id = Column(PGUUID(as_uuid=True), ForeignKey("users.user_id"), nullable=True)
    session_id = Column(PGUUID(as_uuid=True), ForeignKey("challenge_sessions.session_id"), nullable=True)
    payload = Column(JSONB)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)

    __table_args__ = (
        Index("idx_audit_events_created_at", "created_at"),
        Index("idx_audit_events_user_id", "user_id"),
        Index("idx_audit_events_event_type", "event_type"),
    )


def init_db():
    """Create all tables."""
    Base.metadata.create_all(bind=engine)


def get_db_session():
    """Get database session for dependency injection."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
