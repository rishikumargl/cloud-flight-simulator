"""Read-only HTTP interface for audit events."""

from uuid import UUID

from fastapi import APIRouter, Depends

from app.audit_dependency import get_audit_service

from .models import AuditEventType, AuditSource
from .schemas import AuditEventResponse
from .service import AuditService

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("/events", response_model=list[AuditEventResponse])
def get_events(
    user_id: UUID | None = None,
    session_id: UUID | None = None,
    event_type: AuditEventType | None = None,
    source: AuditSource | None = None,
    service: AuditService = Depends(get_audit_service),
) -> list[AuditEventResponse]:
    return service.get_events(
        user_id=user_id,
        session_id=session_id,
        event_type=event_type,
        source=source,
    )
