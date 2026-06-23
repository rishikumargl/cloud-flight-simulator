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

    Returns user from Keycloak JWT. First-login provisioning occurs in get_current_user dependency.

    Args:
        current_user: Current user from Keycloak JWT (injected).

    Returns:
        UserResponse with current user data.

    Raises:
        HTTPException 401: If token is missing or invalid.
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
    """Logout user and write audit event.

    Args:
        current_user: Current user from Keycloak JWT (injected).
        db: Database session.

    Returns:
        204 No Content on success.

    Raises:
        HTTPException 401: If token is missing or invalid.
    """
    # Import here to avoid circular imports
    from app.audit.service import AuditService

    audit_service = AuditService()
    audit_service.write_event(
        db=db,
        event_type="USER_LOGOUT",
        source="AUTH_SERVICE",
        user_id=str(current_user.user_id),
    )

    return Response(status_code=status.HTTP_204_NO_CONTENT)
