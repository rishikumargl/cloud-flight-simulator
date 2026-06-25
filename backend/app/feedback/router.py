"""FastAPI routes for feedback domain — P6 owned."""
from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from uuid import UUID

from app.dependencies.auth import get_current_user
from app.dependencies import get_db
from app.feedback.service import FeedbackService
from app.feedback.schemas import FeedbackReportSchema

router = APIRouter(prefix="/feedback", tags=["feedback"])


def get_feedback_service() -> FeedbackService:
    """Dependency to provide FeedbackService."""
    return FeedbackService()


@router.post("/generate")
async def generate_feedback(
    request: dict,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
    feedback_service: FeedbackService = Depends(get_feedback_service),
):
    """
    POST /feedback/generate

    Generate feedback for a completed challenge session.

    Request body:
    {
        "session_id": "uuid"
    }

    Response: {"success": true, "data": FeedbackReportSchema}
    """
    session_id = request.get("session_id")

    if not session_id:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content=error_response("MISSING_FIELDS", "Missing session_id"),
        )

    try:
        feedback = feedback_service.generate(
            db=db,
            user_id=current_user.user_id,
            session_id=UUID(session_id),
        )

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=success_response(feedback.model_dump(mode="json")),
        )

    except ValueError as e:
        error_msg = str(e)
        if "not found" in error_msg.lower():
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content=error_response("NOT_FOUND", error_msg),
            )
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=error_response("VALIDATION_ERROR", error_msg),
        )

    except PermissionError as e:
        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content=error_response("FORBIDDEN", str(e)),
        )

    except Exception as e:
        db.rollback()
        print(f"[ERROR] generate_feedback failed: {e}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=error_response("INTERNAL_ERROR", "Failed to generate feedback"),
        )


@router.get("/{session_id}")
async def get_feedback(
    session_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
    feedback_service: FeedbackService = Depends(get_feedback_service),
):
    """
    GET /feedback/{session_id}

    Retrieve feedback for a challenge session.

    Response: {"success": true, "data": FeedbackReportSchema}
    """
    try:
        feedback = feedback_service.get_feedback(
            db=db,
            user_id=current_user.user_id,
            session_id=UUID(session_id),
        )

        if not feedback:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content=error_response("NOT_FOUND", f"Feedback not found for session {session_id}"),
            )

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=success_response(feedback.model_dump(mode="json")),
        )

    except PermissionError as e:
        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content=error_response("FORBIDDEN", str(e)),
        )

    except Exception as e:
        print(f"[ERROR] get_feedback failed: {e}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=error_response("INTERNAL_ERROR", "Failed to retrieve feedback"),
        )


def success_response(data):
    """Format successful response per contract."""
    return {"success": True, "data": data}


def error_response(code: str, message: str):
    """Format error response per contract."""
    return {"success": False, "error": {"code": code, "message": message}}
