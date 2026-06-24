"""Public audit event contracts."""

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from .models import AuditEventType, AuditSource


class AuditEventCreate(BaseModel):
    event_id: UUID
    event_type: AuditEventType
    user_id: UUID
    session_id: UUID
    source: AuditSource
    payload: dict[str, Any] = Field(default_factory=dict)
    occurred_at: datetime


class AuditEventResponse(AuditEventCreate):
    model_config = ConfigDict(from_attributes=True)
