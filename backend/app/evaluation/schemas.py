"""EvaluationResultSchema and supporting models for P5 Evaluation Engine."""
from typing import List
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field


class CriterionResult(BaseModel):
    """Single criterion evaluation result."""
    criterion_id: str
    description: str
    resource_met: bool
    understanding_score: int = Field(..., ge=0, le=100)
    reasoning: str
    points_awarded: int = Field(..., ge=0)


class EvaluationResultSchema(BaseModel):
    """Contract: produced by P5, consumed by P1 and P6."""
    evaluation_id: str
    session_id: str
    resource_snapshot: dict
    submission_id: str
    criteria_results: List[CriterionResult]
    percentage: float = Field(..., ge=0, le=100)
    evaluation_mode: str  # "LLM_GROUNDED"
    evaluated_at: datetime

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            UUID: lambda v: str(v),
        }


class LLMEvaluationInput(BaseModel):
    """Input to evaluation LLM chain."""
    mission_title: str
    mission_objectives: List[str]
    criteria_descriptions: List[str]
    learner_submission: str
    resource_snapshot_json: dict


class LLMEvaluationOutput(BaseModel):
    """Output from evaluation LLM chain."""
    criterion_scores: List[dict]  # [{criterion_id, understanding_score, reasoning}, ...]
