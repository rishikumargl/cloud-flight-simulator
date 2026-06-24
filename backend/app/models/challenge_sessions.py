"""Challenge session model — ORM mapping for challenge_sessions table."""
from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import String, DateTime, ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import expression

from app.database import Base


class ChallengeSession(Base):
    """Challenge session model — tracks learner attempts at missions."""

    __tablename__ = "challenge_sessions"

    session_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        server_default=expression.text("gen_random_uuid()"),
    )
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("users.user_id"),
        nullable=False,
    )
    mission_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("missions.mission_id"),
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="CREATED",
        server_default="CREATED",
    )
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    completed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    score: Mapped[float] = mapped_column(
        Numeric(precision=5, scale=2),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=expression.text("NOW()"),
    )
