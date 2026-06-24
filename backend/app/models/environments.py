"""Environment model — ORM mapping for environments table."""
from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PGUUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import expression

from app.database import Base


class Environment(Base):
    """Environment model — tracks GCP environments for challenge sessions."""

    __tablename__ = "environments"

    env_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        server_default=expression.text("gen_random_uuid()"),
    )
    session_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("challenge_sessions.session_id"),
        nullable=False,
        unique=True,
    )
    gcp_project_id: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    scoped_sa_email: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )
    resource_prefix: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        unique=True,
    )
    vm_name: Mapped[str] = mapped_column(
        String(255),
        nullable=True,
    )
    zone: Mapped[str] = mapped_column(
        String(100),
        nullable=True,
    )
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="PROVISIONING",
        server_default="PROVISIONING",
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=expression.text("NOW()"),
    )
    destroyed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
