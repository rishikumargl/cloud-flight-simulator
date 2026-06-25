"""Evaluation API routes — P5 owned.

Routes:
- GET /evaluate/{session_id} — Retrieve cached evaluation result
- POST /evaluate/{session_id}/run — Trigger live evaluation
"""

from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.dependencies.auth import get_current_user
from app.models.challenge_sessions import ChallengeSession
from app.evaluation.service import EvaluationService
from app.evaluation.models import Evaluation
from app.evaluation.schemas import EvaluationResponse, DeterministicCheck

router = APIRouter(prefix="/evaluate", tags=["evaluation"])


def _build_response(evaluation: Evaluation) -> dict:
    """Convert Evaluation ORM to EvaluationResponse schema.

    Maps database percentage to contract score (0-100).
    Converts criteria_results to deterministic_checks format.
    """
    # Determine status from score
    score = int(evaluation.percentage)
    if score >= 80:
        status = "PASSED"
    elif score >= 50:
        status = "PARTIAL"
    else:
        status = "FAILED"

    # Extract criteria results
    criteria_data = evaluation.criteria_results.get("criteria", [])

    passed_checks = []
    failed_checks = []

    for criterion in criteria_data:
        check = DeterministicCheck(
            criterion_id=criterion.get("criterion_id"),
            passed=criterion.get("passed", False),
            details=criterion.get("details", ""),
            weight=criterion.get("weight", 0)
        )

        if criterion.get("passed"):
            passed_checks.append(check)
        else:
            failed_checks.append(check)

    response = EvaluationResponse(
        evaluation_id=str(evaluation.evaluation_id),
        session_id=str(evaluation.session_id),
        status=status,
        score=score,
        deterministic_checks={
            "passed": passed_checks,
            "failed": failed_checks
        },
        evaluated_at=evaluation.evaluated_at.isoformat()
    )

    return response.model_dump(mode="json")


@router.get("/{session_id}")
async def get_evaluation(
    session_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """GET /evaluate/{session_id}

    Retrieve cached evaluation result for a session, or None if not yet evaluated.

    Constraint: Returns cached result only. To trigger live evaluation, use POST /run.

    Response:
    {
        "success": true,
        "data": EvaluationResponse or null
    }
    """
    try:
        # Load session to verify ownership
        session = db.query(ChallengeSession).filter(
            ChallengeSession.session_id == session_id
        ).first()

        if not session:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={
                    "success": False,
                    "error": {"code": "SESSION_NOT_FOUND", "message": "Session not found"}
                }
            )

        # Verify user owns this session
        if session.user_id != current_user.user_id:
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={
                    "success": False,
                    "error": {"code": "FORBIDDEN", "message": "Access denied"}
                }
            )

        # Query for cached evaluation
        evaluation = db.query(Evaluation).filter(
            Evaluation.session_id == session_id
        ).first()

        # Return cached result (or null if not evaluated yet)
        if evaluation:
            return JSONResponse(
                status_code=status.HTTP_200_OK,
                content={
                    "success": True,
                    "data": _build_response(evaluation)
                }
            )
        else:
            return JSONResponse(
                status_code=status.HTTP_200_OK,
                content={
                    "success": True,
                    "data": None
                }
            )

    except Exception as e:
        print(f"[ERROR] GET /evaluate/{session_id}: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "error": {"code": "INTERNAL_ERROR", "message": "Failed to retrieve evaluation"}
            }
        )


@router.post("/{session_id}/run")
async def run_evaluation(
    session_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """POST /evaluate/{session_id}/run

    Trigger live evaluation against GCP resource state.

    Always evaluates against live GCP state, never cached results.
    Fetches VM metadata, status, and tags from Compute API.
    Validates against mission success criteria expected_state.

    Response:
    {
        "success": true,
        "data": EvaluationResponse
    }
    """
    try:
        # Load session to verify ownership
        session = db.query(ChallengeSession).filter(
            ChallengeSession.session_id == session_id
        ).first()

        if not session:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={
                    "success": False,
                    "error": {"code": "SESSION_NOT_FOUND", "message": "Session not found"}
                }
            )

        # Verify user owns this session
        if session.user_id != current_user.user_id:
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={
                    "success": False,
                    "error": {"code": "FORBIDDEN", "message": "Access denied"}
                }
            )

        # Trigger live evaluation
        service = EvaluationService()
        evaluation = service.evaluate(session_id, db)

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "success": True,
                "data": _build_response(evaluation)
            }
        )

    except ValueError as e:
        print(f"[ERROR] POST /evaluate/{session_id}/run validation: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "success": False,
                "error": {"code": "VALIDATION_ERROR", "message": str(e)}
            }
        )

    except FileNotFoundError as e:
        print(f"[ERROR] POST /evaluate/{session_id}/run GCP auth: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "error": {"code": "GCP_AUTH_ERROR", "message": "GCP authentication failed"}
            }
        )

    except Exception as e:
        print(f"[ERROR] POST /evaluate/{session_id}/run: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "error": {"code": "INTERNAL_ERROR", "message": "Evaluation failed"}
            }
        )
