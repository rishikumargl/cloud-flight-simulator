"""Evaluation ORM model — maps to evaluations table."""

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import Numeric, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PGUUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import expression

from app.database import Base


class Evaluation(Base):
    """Evaluation model — stores hybrid evaluation results.

    Deterministic phase: Validates mission success criteria against live GCP resources.
    LLM phase (optional): Assesses learner understanding of repairs (future enhancement).
    """

    __tablename__ = "evaluations"

    evaluation_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        server_default=expression.text("gen_random_uuid()"),
    )
    session_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("challenge_sessions.session_id"),
        nullable=False,
    )
    percentage: Mapped[float] = mapped_column(
        Numeric(precision=5, scale=2),
        nullable=False,
        comment="Weighted score 0-100"
    )
    criteria_results: Mapped[dict] = mapped_column(
        JSONB(),
        nullable=False,
        comment="Per-criterion results: {criteria: [{criterion_id, passed, details, weight}, ...]}"
    )
    resource_snapshot: Mapped[dict] = mapped_column(
        JSONB(),
        nullable=False,
        comment="Live GCP state at evaluation time: {vm_name, zone, status, metadata, tags}"
    )
    evaluated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=expression.text("NOW()"),
    )
