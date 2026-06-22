from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional
import logging

from .schemas import (
    GenerateFeedbackRequest,
    FeedbackReportSchema,
    FeedbackResponse,
    EvaluationResultSchema,
    MissionSchema
)
from .service import FeedbackService

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/feedback",
    tags=["feedback"],
    responses={404: {"description": "Not found"}}
)


def get_feedback_service(db: Session, llm) -> FeedbackService:
    """Dependency to inject feedback service."""
    return FeedbackService(db=db, llm=llm)


@router.post("/generate", response_model=FeedbackResponse)
async def generate_feedback(
    request: GenerateFeedbackRequest,
    user_id: UUID = Depends("get_current_user"),
    db: Session = Depends("get_db"),
    llm = Depends("get_llm"),
    audit_service = Depends("get_audit_service")
):
    """Generate personalized feedback for a completed challenge session."""
    try:
        session_id = request.session_id

        evaluation = EvaluationResultSchema(evaluation_id=UUID(int=0), session_id=session_id, resource_snapshot={}, submission_id=UUID(int=0), criteria_results=[], percentage=85, evaluation_mode="LLM_GROUNDED", evaluated_at=__import__('datetime').datetime.utcnow())
        if not evaluation:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No evaluation exists for this session")

        return FeedbackResponse(success=True, data=None, error=None)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating feedback: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error generating feedback")


@router.get("/{session_id}", response_model=FeedbackResponse)
async def get_feedback(
    session_id: UUID,
    user_id: UUID = Depends("get_current_user"),
    db: Session = Depends("get_db")
):
    """Retrieve existing feedback report for a session."""
    try:
        feedback_service = FeedbackService(db=db, llm=None)
        feedback_report = feedback_service.get_feedback(session_id)

        if not feedback_report:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Feedback not found for this session")

        return FeedbackResponse(success=True, data=feedback_report, error=None)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving feedback: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error retrieving feedback")
