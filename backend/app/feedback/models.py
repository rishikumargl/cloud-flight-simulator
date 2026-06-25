"""FeedbackReport ORM model — P6 owned."""
from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID as PGUUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import expression

from app.database import Base


class FeedbackReport(Base):
    """Feedback report model — AI-generated learner feedback."""

    __tablename__ = "feedback_reports"

    feedback_id: Mapped[UUID] = mapped_column(
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
    summary: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    strengths: Mapped[dict] = mapped_column(
        JSONB,
        nullable=True,
    )
    mistakes: Mapped[dict] = mapped_column(
        JSONB,
        nullable=True,
    )
    improvements: Mapped[dict] = mapped_column(
        JSONB,
        nullable=True,
    )
    next_recommendation: Mapped[dict] = mapped_column(
        JSONB,
        nullable=True,
    )
    generated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=expression.text("NOW()"),
    )
