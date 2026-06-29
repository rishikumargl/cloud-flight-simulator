"""Progress endpoint router — GET /progress/{user_id}/stats, GET /progress/{user_id}/history."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.dependencies.auth import get_current_user
from app.dependencies import get_db
from app.progress.service import ProgressService
from fastapi.responses import JSONResponse
from starlette import status

router = APIRouter(prefix="/progress", tags=["progress"])


@router.get("/me")
async def get_my_progress(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """GET /progress/me — Get current user's complete progress (stats + history + skills)."""
    try:
        stats = ProgressService.get_user_stats(str(current_user.user_id), db)
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"success": True, "data": stats},
        )
    except Exception as e:
        import traceback
        print(f"[ERROR] GET /progress/me: {str(e)}")
        traceback.print_exc()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "Failed to load progress: " + str(e),
                },
            },
        )


@router.get("/{user_id}/stats")
async def get_user_stats(
    user_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """GET /progress/{user_id}/stats — Get user stats (level, streak, achievements, skills)."""
    # Verify user owns this request
    if str(current_user.user_id) != user_id:
        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content={
                "success": False,
                "error": {"code": "FORBIDDEN", "message": "Access denied"},
            },
        )

    try:
        stats = ProgressService.get_user_stats(user_id, db)
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"success": True, "data": stats},
        )
    except Exception as e:
        print(f"[ERROR] GET /progress/{user_id}/stats: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "Failed to load stats",
                },
            },
        )


@router.get("/{user_id}/history")
async def get_user_history(
    user_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """GET /progress/{user_id}/history — Get full mission history with evaluation details."""
    # Verify user owns this request
    if str(current_user.user_id) != user_id:
        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content={
                "success": False,
                "error": {"code": "FORBIDDEN", "message": "Access denied"},
            },
        )

    try:
        history = ProgressService.get_user_history(user_id, db)
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"success": True, "data": history},
        )
    except Exception as e:
        print(f"[ERROR] GET /progress/{user_id}/history: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "Failed to load history",
                },
            },
        )
