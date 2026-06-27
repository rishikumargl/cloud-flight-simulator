"""Evaluation schemas — Pydantic models for evaluation requests/responses."""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID


class RunEvaluationRequest(BaseModel):
    """Request to run evaluation on a session."""

    session_id: str = Field(..., description="UUID of the challenge session")
    solution_description: Optional[str] = Field(None, description="Learner's explanation of their solution (max 1000 chars)")


class DeterministicCheck(BaseModel):
    """Result of a single deterministic check (criterion validation)."""

    criterion_id: str = Field(..., description="UUID of the criterion")
    passed: bool = Field(..., description="Whether this criterion passed")
    details: str = Field(default="", description="Detailed explanation of pass/fail")
    weight: int = Field(..., description="Weight of this criterion")


class EvaluationResponse(BaseModel):
    """Evaluation result response — matches EvaluationResultSchema contract."""

    evaluation_id: str = Field(..., description="UUID of evaluation result")
    session_id: str = Field(..., description="UUID of challenge session")
    status: str = Field(..., description="PASSED, PARTIAL, or FAILED")
    score: int = Field(..., description="Weighted score 0-100")
    deterministic_checks: Dict[str, List[DeterministicCheck]] = Field(
        ...,
        description="Categorized checks: {passed: [...], failed: [...]}"
    )
    evaluated_at: str = Field(..., description="ISO 8601 timestamp of evaluation")

    class Config:
        json_schema_extra = {
            "example": {
                "evaluation_id": "123e4567-e89b-12d3-a456-426614174000",
                "session_id": "223e4567-e89b-12d3-a456-426614174000",
                "status": "PASSED",
                "score": 95,
                "deterministic_checks": {
                    "passed": [
                        {
                            "criterion_id": "uuid-1",
                            "passed": True,
                            "details": "Metadata matches expected state",
                            "weight": 34
                        }
                    ],
                    "failed": []
                },
                "evaluated_at": "2026-06-25T10:30:00Z"
            }
        }


class MissionAnalyticsSchema(BaseModel):
    """Analytics for a single mission attempt."""

    session_id: str = Field(..., description="Session UUID")
    mission_id: str = Field(..., description="Mission UUID")
    mission_title: str = Field(..., description="Mission title")
    difficulty: str = Field(..., description="BEGINNER, INTERMEDIATE, ADVANCED")
    score: int = Field(..., description="Final score 0-100")
    status: str = Field(..., description="PASSED, PARTIAL, FAILED")
    completion_time_minutes: int = Field(..., description="Total time from start to completion")
    expected_time_minutes: int = Field(..., description="Expected time for mission difficulty")
    time_efficiency: float = Field(..., description="completion_time / expected_time ratio")
    provisioning_minutes: Optional[int] = Field(None, description="Time spent in provisioning")
    verification_minutes: Optional[int] = Field(None, description="Time spent verifying")
    retry_count: int = Field(default=0, description="Number of verification attempts")
    completed_at: datetime = Field(..., description="When mission was completed")


class SkillSchema(BaseModel):
    """Single skill proficiency estimate."""

    category: str = Field(..., description="Skill category: COMPUTE, IAM, NETWORKING, STORAGE, MONITORING, SECURITY, DEVOPS")
    proficiency: int = Field(..., description="0-100 estimated skill level")
    confidence: float = Field(..., description="Confidence in estimate (0-100)")
    missions_attempted: int = Field(..., description="Number of related missions")
    success_rate: float = Field(..., description="Percentage of successful missions")


class SkillMatrixSchema(BaseModel):
    """Complete skill profile for user."""

    user_id: str = Field(..., description="User UUID")
    skills: Dict[str, SkillSchema] = Field(..., description="Skills by category")
    overall_proficiency: int = Field(..., description="Average across all skills")
    total_missions: int = Field(..., description="Total completed missions")
    total_attempts: int = Field(..., description="Total attempts")
    last_updated: datetime = Field(..., description="When matrix was calculated")


class MissionInsightsSchema(BaseModel):
    """Insights for a specific mission."""

    mission_id: str = Field(..., description="Mission UUID")
    mission_title: str = Field(..., description="Mission title")
    total_attempts: int = Field(..., description="Total attempts by all learners")
    average_score: float = Field(..., description="Average score 0-100")
    average_completion_time: float = Field(..., description="Average time in minutes")
    current_learner_time: Optional[float] = Field(None, description="Current learner's time")
    current_learner_score: Optional[int] = Field(None, description="Current learner's score")
    time_percentile: Optional[int] = Field(None, description="Current learner percentile (0-100)")
    improvement_potential: Optional[str] = Field(None, description="FAST_SOLVER, AVERAGE, SLOW_START, NOT_ATTEMPTED")


class AdminAnalyticsSchema(BaseModel):
    """System-wide analytics for admin dashboard."""

    total_users: int = Field(..., description="Total registered users")
    total_missions_generated: int = Field(..., description="Total scenarios created")
    total_missions_completed: int = Field(..., description="Total missions completed")
    average_completion_rate: float = Field(..., description="% of started missions completed")
    average_score: float = Field(..., description="Average score across all attempts")
    average_completion_time: float = Field(..., description="Average time in minutes")
    most_attempted_mission: Optional[str] = Field(None, description="Mission title")
    most_failed_mission: Optional[str] = Field(None, description="Mission title")
    weakest_skill_category: Optional[str] = Field(None, description="Skill with lowest avg score")
    strongest_skill_category: Optional[str] = Field(None, description="Skill with highest avg score")
    difficulty_distribution: Dict[str, int] = Field(..., description="Count by difficulty")
    track_distribution: Dict[str, int] = Field(..., description="Count by track")
    last_updated: datetime = Field(..., description="When analytics were calculated")
