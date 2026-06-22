"""Authentication API routes."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.schemas import LoginRequest, RegisterRequest, TokenResponse, UserResponse
from app.auth.service import AuthService
from app.dependencies import get_db
from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
def register(
    request: RegisterRequest,
    db: Session = Depends(get_db),
) -> UserResponse:
    """Register a new user account.

    Args:
        request: Registration request with email, password, and full_name.
        db: Database session.

    Returns:
        UserResponse with created user data.

    Raises:
        HTTPException 400: If email is already registered.
        HTTPException 422: If request validation fails.
    """
    service = AuthService(db)

    try:
        user = service.register_user(
            email=request.email,
            password=request.password,
            full_name=request.full_name,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e

    return user


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="User login",
)
def login(
    request: LoginRequest,
    db: Session = Depends(get_db),
) -> TokenResponse:
    """Authenticate user and return access + refresh tokens.

    Args:
        request: Login request with email and password.
        db: Database session.

    Returns:
        TokenResponse with access_token and refresh_token.

    Raises:
        HTTPException 401: If email/password is invalid.
        HTTPException 422: If request validation fails.
    """
    service = AuthService(db)

    try:
        tokens = service.login_user(
            email=request.email,
            password=request.password,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        ) from e

    return tokens


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Refresh access token",
)
def refresh(
    request: dict[str, str],
    db: Session = Depends(get_db),
) -> TokenResponse:
    """Issue a new access token using a valid refresh token.

    Args:
        request: Must contain 'refresh_token' key.
        db: Database session.

    Returns:
        TokenResponse with new access_token and refresh_token.

    Raises:
        HTTPException 401: If refresh token is invalid or expired.
        HTTPException 422: If request validation fails.
    """
    refresh_token = request.get("refresh_token")
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Missing 'refresh_token' in request body",
        )

    service = AuthService(db)

    try:
        tokens = service.refresh_access_token(refresh_token)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        ) from e

    return tokens


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="User logout",
)
def logout(
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    """Invalidate user's refresh tokens.

    Args:
        current_user: Current user from JWT token (injected).
        db: Database session.

    Returns:
        204 No Content on success.

    Raises:
        HTTPException 401: If token is missing or invalid.
    """
    from uuid import UUID
    service = AuthService(db)
    service.logout_user(UUID(str(current_user.user_id)))


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user",
)
def get_me(
    current_user: UserResponse = Depends(get_current_user),
) -> UserResponse:
    """Get the current authenticated user.

    Args:
        current_user: Current user from JWT token (injected).

    Returns:
        UserResponse with current user data.

    Raises:
        HTTPException 401: If token is missing or invalid.
    """
    return current_user
