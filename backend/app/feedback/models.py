from sqlalchemy import Column, String, DateTime, JSON, Index, ForeignKey, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base
from datetime import datetime
import uuid

Base = declarative_base()


class FeedbackReport(Base):
    """Persisted feedback report for learners."""
    __tablename__ = "feedback_reports"

    feedback_id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False
    )
    session_id = Column(
        UUID(as_uuid=True),
        ForeignKey("challenge_sessions.session_id"),
        nullable=False,
        index=True
    )
    summary = Column(String, nullable=False)
    strengths = Column(JSON, nullable=True)
    mistakes = Column(JSON, nullable=True)
    improvements = Column(JSON, nullable=True)
    next_recommendation = Column(JSON, nullable=False)
    generated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow,
        server_default=text("NOW()")
    )

    __table_args__ = (
        Index("idx_feedback_session", "session_id"),
    )

    def to_dict(self):
        """Convert to dictionary for serialization."""
        return {
            "feedback_id": str(self.feedback_id),
            "session_id": str(self.session_id),
            "summary": self.summary,
            "strengths": self.strengths or [],
            "mistakes": self.mistakes or [],
            "improvements": self.improvements or [],
            "next_recommendation": self.next_recommendation,
            "generated_at": self.generated_at.isoformat() if self.generated_at else None
        }
