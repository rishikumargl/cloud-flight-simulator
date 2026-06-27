"""Feedback schemas for AI coaching."""

from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime


class FeedbackSchema(BaseModel):
    """AI coaching feedback for a completed mission."""

    session_id: str = Field(..., description="Session UUID")
    user_id: str = Field(..., description="User UUID")
    mission_id: str = Field(..., description="Mission UUID")
    score: int = Field(..., description="Evaluation score 0-100")
    status: str = Field(..., description="PASSED, PARTIAL, or FAILED")
    strengths: List[str] = Field(..., description="What learner did well")
    weaknesses: List[str] = Field(..., description="What learner should improve")
    biggest_mistake: str = Field(..., description="Primary error or misconception")
    recommendation: str = Field(..., description="Actionable recommendation for next steps")
    cloud_concept: str = Field(..., description="GCP concept to review or study")
    suggested_next_mission: Optional[str] = Field(None, description="Type of next mission to try")
    estimated_readiness: str = Field(..., description="READY_FOR_HARDER, REPEAT_THIS_LEVEL, or NEEDS_FOUNDATION")
    generated_at: datetime = Field(..., description="When feedback was generated")
