"""FastAPI dependency boundary for the audit service."""

from app.audit.service import AuditService


def get_audit_service() -> AuditService:
    """Integration hook to be wired to P2's database-session dependency."""
    raise NotImplementedError("Configure the database session dependency")
