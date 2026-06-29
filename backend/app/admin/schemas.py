"""Admin schemas."""

from pydantic import BaseModel, Field
from typing import Dict, Optional
from datetime import datetime


class AdminAnalyticsSchema(BaseModel):
    """System-wide analytics."""

    total_users: int = Field(..., description="Total registered users")
    total_missions_generated: int = Field(..., description="Total scenarios created")
    total_missions_completed: int = Field(..., description="Total missions completed")
    average_completion_rate: float = Field(..., description="% of started missions completed")
    average_score: float = Field(..., description="Average score across all attempts")
    average_completion_time: float = Field(..., description="Average time in minutes")
    most_attempted_mission: Optional[str] = Field(None, description="Mission title")
    most_failed_mission: Optional[str] = Field(None, description="Mission title")
    difficulty_distribution: Dict[str, int] = Field(..., description="Count by difficulty")
    track_distribution: Dict[str, int] = Field(..., description="Count by track")
    last_updated: str = Field(..., description="ISO 8601 timestamp")
