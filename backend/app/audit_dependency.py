"""Audit service dependency - provides audit event writing capability."""
from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from backend.app.database import AuditEvent
import uuid as python_uuid


class AuditService:
    """Service for writing audit events (append-only)."""

    def write_event(
        self,
        db: Session,
        event_type: str,
        source: str,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None,
        payload: Optional[Dict[str, Any]] = None,
    ) -> AuditEvent:
        """
        Write an audit event.

        Allowed event_type values:
        - USER_REGISTERED, USER_LOGIN, USER_LOGOUT (P2)
        - MISSION_GENERATED (P3)
        - CHALLENGE_STARTED, ENVIRONMENT_PROVISIONED, ENVIRONMENT_DESTROYED, CHALLENGE_COMPLETED, CHALLENGE_TIMEOUT (P4)
        - EVALUATION_RUN, EVALUATION_COMPLETED (P5)
        - FEEDBACK_GENERATED (P6)
        """
        event = AuditEvent(
            event_id=python_uuid.uuid4(),
            event_type=event_type,
            source=source,
            user_id=user_id,
            session_id=session_id,
            payload=payload or {},
            created_at=datetime.utcnow(),
        )
        db.add(event)
        db.commit()
        return event


# Singleton instance
_audit_service = None


def get_audit_service() -> AuditService:
    """Get the audit service singleton."""
    global _audit_service
    if _audit_service is None:
        _audit_service = AuditService()
    return _audit_service
