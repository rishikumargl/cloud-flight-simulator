"""Authentication dependencies for FastAPI."""
from uuid import UUID

from fastapi import Depends, HTTPException, Header, status
from sqlalchemy.orm import Session

from app.auth.schemas import UserResponse
from app.auth.security import decode_token
from app.dependencies import get_db
from app.models.users import User


def get_current_user(
    authorization: str | None = Header(None),
    db: Session = Depends(get_db),
) -> UserResponse:
    """Get the current authenticated user from JWT token.

    Args:
        authorization: Authorization header (Bearer <token>).
        db: Database session.

    Returns:
        UserResponse with current user data.

    Raises:
        HTTPException: If token is invalid or user not found.
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = parts[1]

    try:
        payload = decode_token(token, token_type="access")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from e

    user_id_str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: missing user ID",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user_id = UUID(user_id_str)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID in token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from e

    user = db.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return UserResponse.model_validate(user)
