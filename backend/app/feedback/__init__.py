"""
P6 Feedback & Recommendation Generation Domain

This package handles personalized learner feedback and next-challenge recommendations
based on evaluation results from P5.

Owned by: P6 AI Engineer (Feedback)
Domain: feedback/

Contracts:
- Produces: FeedbackReportSchema
- Consumes: EvaluationResultSchema (P5), MissionSchema (P3), ChallengeSessionSchema (P4)

Key Responsibility:
Explain evaluation scores and provide actionable feedback WITHOUT modifying scores.
"""

from .schemas import (
    FeedbackReportSchema,
    EvaluationResultSchema,
    MissionSchema,
    GenerateFeedbackRequest,
    FeedbackResponse,
    NextRecommendationSchema
)
from .service import FeedbackService
from .router import router
from .models import FeedbackReport

__all__ = [
    "FeedbackReportSchema",
    "EvaluationResultSchema",
    "MissionSchema",
    "GenerateFeedbackRequest",
    "FeedbackResponse",
    "NextRecommendationSchema",
    "FeedbackService",
    "FeedbackReport",
    "router"
]
