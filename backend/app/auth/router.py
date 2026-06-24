"""Authentication API routes."""
from fastapi import APIRouter, Depends, Response, status

from app.auth.schemas import UserResponse
from app.dependencies import get_db
from app.dependencies.auth import get_current_user
from sqlalchemy.orm import Session

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user",
)
async def get_me(
    current_user: UserResponse = Depends(get_current_user),
) -> UserResponse:
    """Get the current authenticated user.

    Returns user from Clerk JWT. First-login provisioning occurs in get_current_user dependency.
    """
    return current_user


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="User logout",
)
async def logout(
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    """Logout user — clears server-side session state if any."""
    # Audit logging removed: app.audit module not yet implemented.
    # Re-add when AuditService is available.
    return Response(status_code=status.HTTP_204_NO_CONTENT)
