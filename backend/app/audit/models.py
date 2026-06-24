"""Database model for immutable audit events."""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import DateTime, JSON, String, Uuid, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from app import database


if hasattr(database, "Base"):
    # P2's application-wide Base becomes authoritative as soon as it exists.
    Base = database.Base
else:
    class Base(DeclarativeBase):
        """Temporary Phase 1 base until the shared database Base is available."""


class AuditEventType(str, Enum):
    USER_REGISTERED = "USER_REGISTERED"
    USER_LOGIN = "USER_LOGIN"
    USER_LOGOUT = "USER_LOGOUT"
    MISSION_GENERATED = "MISSION_GENERATED"
    CHALLENGE_STARTED = "CHALLENGE_STARTED"
    CHALLENGE_COMPLETED = "CHALLENGE_COMPLETED"
    CHALLENGE_TIMEOUT = "CHALLENGE_TIMEOUT"
    ENVIRONMENT_PROVISIONED = "ENVIRONMENT_PROVISIONED"
    ENVIRONMENT_DESTROYED = "ENVIRONMENT_DESTROYED"
    EVALUATION_RUN = "EVALUATION_RUN"
    EVALUATION_COMPLETED = "EVALUATION_COMPLETED"
    FEEDBACK_GENERATED = "FEEDBACK_GENERATED"


class AuditSource(str, Enum):
    AUTH_SERVICE = "AUTH_SERVICE"
    SCENARIO_SERVICE = "SCENARIO_SERVICE"
    CHALLENGE_SERVICE = "CHALLENGE_SERVICE"
    EVALUATION_SERVICE = "EVALUATION_SERVICE"
    FEEDBACK_SERVICE = "FEEDBACK_SERVICE"


class AuditEvent(Base):
    """An append-only fact emitted by another platform service."""

    __tablename__ = "audit_events"

    event_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    event_type: Mapped[str] = mapped_column(String, nullable=False, index=True)
    user_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), nullable=False, index=True)
    session_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), nullable=False, index=True)
    source: Mapped[str] = mapped_column(String, nullable=False, index=True)
    payload: Mapped[dict[str, Any]] = mapped_column(
        JSON().with_variant(JSONB, "postgresql"), nullable=False, default=dict
    )
    occurred_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), index=True
    )
