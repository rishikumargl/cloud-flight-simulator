"""Admin routes."""

from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.dependencies.auth import get_current_user
from .service import AdminService
from .schemas import AdminAnalyticsSchema

router = APIRouter(prefix="/admin", tags=["admin"])


def get_admin_service() -> AdminService:
    """Dependency to provide AdminService."""
    return AdminService()


@router.get("/analytics")
async def get_analytics(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
    admin_service: AdminService = Depends(get_admin_service),
):
    """GET /admin/analytics

    Get system-wide analytics.

    Returns: user counts, mission stats, popular/failed missions, distributions

    Response:
    {
        "success": true,
        "data": AdminAnalyticsSchema
    }
    """
    try:
        analytics = admin_service.get_system_analytics(db)

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=success_response(analytics)
        )

    except Exception as e:
        print(f"[ERROR] GET /admin/analytics: {e}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=error_response("INTERNAL_ERROR", "Failed to get analytics")
        )


def success_response(data):
    """Format successful response."""
    return {"success": True, "data": data}


def error_response(code: str, message: str):
    """Format error response."""
    return {"success": False, "error": {"code": code, "message": message}}
