"""P5 Evaluation API Routes - GET /evaluate/{session_id}, POST /evaluate/{session_id}/run"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.dependencies import get_current_user, get_db
from backend.app.evaluation.service import EvaluationService
from backend.app.evaluation.schemas import EvaluationResultSchema

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/evaluate", tags=["evaluation"])


@router.get("/{session_id}")
async def get_evaluation(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """
    GET /evaluate/{session_id}

    Returns the latest EvaluationResultSchema for a session.
    Used by frontend polling mechanism (every 3 seconds).

    Authorization: Return 403 if user_id does not match session's user_id.
    """
    from backend.app.database import ChallengeSession

    # Get session
    session = db.query(ChallengeSession).filter(
        ChallengeSession.session_id == session_id
    ).first()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found",
        )

    # Authorization check
    if str(session.user_id) != str(current_user["user_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this session",
        )

    # Get latest evaluation
    service = EvaluationService(db)
    evaluation = service.get_latest_evaluation(session_id)

    if not evaluation:
        # No evaluation yet
        return {
            "success": True,
            "data": None,
        }

    return {
        "success": True,
        "data": evaluation.dict(),
    }


@router.post("/{session_id}/run")
async def run_evaluation(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """
    POST /evaluate/{session_id}/run

    Triggers a full evaluation run:
    1. Fetch resource snapshot from GCP
    2. Run deterministic validation
    3. Invoke evaluation LLM
    4. Apply scoring gate
    5. Persist result
    6. Write audit events

    Output: EvaluationResultSchema
    """
    from backend.app.database import ChallengeSession, Submission, Mission, Environment
    from backend.app.audit_dependency import get_audit_service

    try:
        # Get session
        session = db.query(ChallengeSession).filter(
            ChallengeSession.session_id == session_id
        ).first()

        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found",
            )

        # Authorization check
        if str(session.user_id) != str(current_user["user_id"]):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this session",
            )

        # Get mission
        mission = db.query(Mission).filter(
            Mission.mission_id == session.mission_id
        ).first()

        if not mission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Mission not found",
            )

        # Get environment
        environment = db.query(Environment).filter(
            Environment.session_id == session_id
        ).first()

        if not environment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Environment not found",
            )

        # Get latest submission
        submission = db.query(Submission).filter(
            Submission.session_id == session_id
        ).order_by(Submission.submitted_at.desc()).first()

        if not submission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No submission found",
            )

        # Run evaluation
        logger.info(f"[P5] Running evaluation for session {session_id}")
        service = EvaluationService(db)
        result = service.run_evaluation(
            session_id=str(session_id),
            user_id=str(session.user_id),
            mission_id=str(session.mission_id),
            env_id=str(environment.env_id),
            submission_id=str(submission.submission_id),
            submission_text=submission.description,
            gcp_project_id=environment.gcp_project_id,
            resource_prefix=environment.resource_prefix,
            track=mission.track,
            mission_title=mission.title,
            mission_objectives=mission.objectives,
            success_criteria=mission.success_criteria,
        )

        # Write audit events
        audit_service = get_audit_service()
        audit_service.write_event(
            db=db,
            event_type="EVALUATION_RUN",
            source="EVALUATION_SERVICE",
            user_id=str(session.user_id),
            session_id=str(session_id),
            payload={"submission_id": str(submission.submission_id)},
        )

        audit_service.write_event(
            db=db,
            event_type="EVALUATION_COMPLETED",
            source="EVALUATION_SERVICE",
            user_id=str(session.user_id),
            session_id=str(session_id),
            payload={
                "evaluation_id": str(result.evaluation_id),
                "percentage": float(result.percentage),
            },
        )

        return {
            "success": True,
            "data": result.dict(),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[P5] Evaluation error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Evaluation failed: {str(e)}",
        )
