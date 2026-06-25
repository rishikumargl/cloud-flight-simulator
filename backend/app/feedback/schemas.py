"""Pydantic schemas for feedback domain — P6 owned."""
from typing import List, Optional
from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime


class NextRecommendation(BaseModel):
    """Next challenge recommendation."""
    track: str = Field(..., description="Recommended track (COMPUTE, STORAGE, etc.)")
    difficulty: str = Field(..., description="Recommended difficulty (BEGINNER, INTERMEDIATE, ADVANCED)")
    reason: str = Field(..., description="Reason grounded in learner performance")


class FeedbackReportSchema(BaseModel):
    """Feedback report contract — produced by P6."""
    feedback_id: UUID = Field(..., description="Unique feedback identifier")
    session_id: UUID = Field(..., description="Associated challenge session")
    summary: str = Field(..., description="Overall feedback text (AI-generated)")
    strengths: List[str] = Field(default_factory=list, description="What the learner did well")
    mistakes: List[str] = Field(default_factory=list, description="What went wrong")
    improvements: List[str] = Field(default_factory=list, description="Topics to study more")
    next_recommendation: NextRecommendation = Field(..., description="Next challenge recommendation")
    generated_at: datetime = Field(..., description="Feedback generation timestamp")

    class Config:
        json_schema_extra = {
            "example": {
                "feedback_id": "550e8400-e29b-41d4-a716-446655440000",
                "session_id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
                "summary": "Good work completing the VM deployment. You correctly configured the firewall rules.",
                "strengths": ["Correct machine type selection", "Proper firewall rule configuration"],
                "mistakes": ["Network was not properly tagged"],
                "improvements": ["Review VPC tagging best practices"],
                "next_recommendation": {
                    "track": "COMPUTE",
                    "difficulty": "INTERMEDIATE",
                    "reason": "You scored 85% on BEGINNER challenges. Ready for intermediate complexity."
                },
                "generated_at": "2026-06-25T14:30:00Z"
            }
        }
