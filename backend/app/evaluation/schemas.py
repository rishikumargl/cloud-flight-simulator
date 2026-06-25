"""Evaluation schemas — Pydantic models for evaluation requests/responses."""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID


class RunEvaluationRequest(BaseModel):
    """Request to run evaluation on a session."""

    session_id: str = Field(..., description="UUID of the challenge session")


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
