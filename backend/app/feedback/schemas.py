from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import UUID


class NextRecommendationSchema(BaseModel):
    """Next challenge recommendation based on performance."""
    track: str = Field(..., description="Track name (COMPUTE, NETWORK, STORAGE, etc.)")
    difficulty: str = Field(..., description="Difficulty level (BEGINNER, INTERMEDIATE, ADVANCED, EXPERT, MASTER)")
    reason: str = Field(..., description="Reasoning for the recommendation based on actual performance")


class FeedbackReportSchema(BaseModel):
    """Contract output for feedback generation - exactly as specified."""
    feedback_id: UUID = Field(..., description="Unique feedback identifier")
    session_id: UUID = Field(..., description="Associated challenge session ID")
    summary: str = Field(..., description="1-2 sentence summary of overall performance")
    strengths: List[str] = Field(..., description="List of specific strengths demonstrated")
    mistakes: List[str] = Field(..., description="List of specific mistakes made")
    improvements: List[str] = Field(..., description="List of areas to improve")
    next_recommendation: NextRecommendationSchema = Field(..., description="Next challenge recommendation")
    generated_at: datetime = Field(default_factory=datetime.utcnow, description="When this feedback was generated")

    class Config:
        json_schema_extra = {
            "example": {
                "feedback_id": "123e4567-e89b-12d3-a456-426614174000",
                "session_id": "223e4567-e89b-12d3-a456-426614174000",
                "summary": "Good work completing the VM deployment.",
                "strengths": ["Correct machine type"],
                "mistakes": ["Firewall rule missing"],
                "improvements": ["Review ingress configuration"],
                "next_recommendation": {
                    "track": "COMPUTE",
                    "difficulty": "INTERMEDIATE",
                    "reason": "Successfully completed beginner compute challenges."
                },
                "generated_at": "2024-06-22T10:30:00"
            }
        }


class EvaluationResultSchema(BaseModel):
    """Schema for evaluation results from P5 - READ ONLY."""
    evaluation_id: UUID
    session_id: UUID
    resource_snapshot: Dict[str, Any]
    submission_id: UUID
    criteria_results: List[Dict[str, Any]]
    percentage: int = Field(..., ge=0, le=100)
    evaluation_mode: str
    evaluated_at: datetime


class MissionSchema(BaseModel):
    """Schema for mission context from P3 - READ ONLY."""
    mission_id: UUID
    track: str
    difficulty: str
    title: str
    business_context: str
    objectives: List[str]
    success_criteria: List[str]
    time_limit_minutes: int


class GenerateFeedbackRequest(BaseModel):
    """Request payload for POST /feedback/generate."""
    session_id: UUID = Field(..., description="Session ID to generate feedback for")


class FeedbackResponse(BaseModel):
    """Response wrapper for feedback endpoints."""
    success: bool
    data: Optional[FeedbackReportSchema] = None
    error: Optional[str] = None
