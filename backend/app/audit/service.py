"""Persistence-only operations for audit events."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import AuditEvent, AuditEventType, AuditSource
from .schemas import AuditEventCreate


class AuditService:
    def __init__(self, session: Session) -> None:
        self._session = session

    def write_event(self, event: AuditEventCreate) -> AuditEvent:
        """Append an event; existing audit rows are never mutated."""
        record = AuditEvent(**event.model_dump(mode="python"))
        self._session.add(record)
        self._session.commit()
        self._session.refresh(record)
        return record

    def get_events(
        self,
        *,
        user_id: UUID | None = None,
        session_id: UUID | None = None,
        event_type: AuditEventType | None = None,
        source: AuditSource | None = None,
    ) -> list[AuditEvent]:
        statement = select(AuditEvent)
        filters = {
            AuditEvent.user_id: user_id,
            AuditEvent.session_id: session_id,
            AuditEvent.event_type: event_type.value if event_type else None,
            AuditEvent.source: source.value if source else None,
        }
        for column, value in filters.items():
            if value is not None:
                statement = statement.where(column == value)
        statement = statement.order_by(AuditEvent.occurred_at.desc())
        return list(self._session.scalars(statement).all())
