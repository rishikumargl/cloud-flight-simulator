"""SQLAlchemy ORM models for scenarios domain."""

from sqlalchemy import Column, String, Integer, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from datetime import datetime
import uuid

# Use the shared Base from app.database so all tables are created together
from app.database import Base


class Mission(Base):
    """ORM model for missions table."""

    __tablename__ = "missions"

    mission_id = Column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False
    )
    track = Column(String(50), nullable=False)
    difficulty = Column(String(50), nullable=False)
    title = Column(String(255), nullable=False)
    business_context = Column(Text, nullable=False)
    objectives = Column(JSONB, nullable=False)
    success_criteria = Column(JSONB, nullable=False)
    time_limit_minutes = Column(Integer, nullable=False)
    generated_by = Column(String(100), default="scenario-generator", nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
