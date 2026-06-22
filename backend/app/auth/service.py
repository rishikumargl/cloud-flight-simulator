"""Authentication service — business logic for auth operations."""
from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth.schemas import TokenResponse, UserResponse
from app.auth.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    hash_token,
    verify_password,
)
from app.models.users import User
from app.repositories.users import UserRepository
from app.repositories.refresh_tokens import RefreshTokenRepository


class AuthService:
    """Business logic for authentication."""

    def __init__(self, db: Session):
        """Initialize service with database session.

        Args:
            db: SQLAlchemy database session.
        """
        self.db = db
        self.users = UserRepository(db)
        self.refresh_tokens = RefreshTokenRepository(db)

    def register_user(
        self,
        email: str,
        password: str,
        full_name: str,
    ) -> UserResponse:
        """Register a new user.

        Args:
            email: User email address.
            password: Plain text password.
            full_name: User full name.

        Returns:
            UserResponse with created user data.

        Raises:
            ValueError: If email already exists.
        """
        # Check if email already exists
        existing = self.users.get_by_email(email)
        if existing:
            raise ValueError(f"Email {email} is already registered")

        # Hash password
        password_hash = hash_password(password)

        # Create user
        try:
            user = self.users.create_user(
                email=email,
                password_hash=password_hash,
                full_name=full_name,
            )
        except IntegrityError as e:
            self.db.rollback()
            raise ValueError(f"Failed to create user: {e}") from e

        return UserResponse.model_validate(user)

    def login_user(self, email: str, password: str) -> TokenResponse:
        """Authenticate user and issue tokens.

        Args:
            email: User email address.
            password: Plain text password.

        Returns:
            TokenResponse with access and refresh tokens.

        Raises:
            ValueError: If email not found or password incorrect.
        """
        # Find user by email
        user = self.users.get_by_email(email)
        if not user:
            raise ValueError("Invalid email or password")

        # Verify password
        if not verify_password(password, user.password_hash):
            raise ValueError("Invalid email or password")

        # Create tokens
        access_token = create_access_token(
            {"sub": str(user.user_id)},
            expires_delta=timedelta(minutes=60),
        )
        refresh_token_str = create_refresh_token(
            {"sub": str(user.user_id)},
            expires_delta=timedelta(days=7),
        )

        # Store refresh token hash in database
        refresh_token_hash = hash_token(refresh_token_str)
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        self.refresh_tokens.create(
            user_id=user.user_id,
            token_hash=refresh_token_hash,
            expires_at=expires_at,
        )

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token_str,
            token_type="bearer",
        )

    def refresh_access_token(self, refresh_token_str: str) -> TokenResponse:
        """Issue a new access token using a refresh token.

        Args:
            refresh_token_str: Valid refresh token string.

        Returns:
            TokenResponse with new access and refresh tokens.

        Raises:
            ValueError: If refresh token is invalid, expired, or not found in DB.
        """
        from app.auth.security import decode_token

        # Validate JWT
        try:
            payload = decode_token(refresh_token_str, token_type="refresh")
        except Exception as e:
            raise ValueError(f"Invalid refresh token: {e}") from e

        user_id_str = payload.get("sub")
        if not user_id_str:
            raise ValueError("Invalid refresh token: missing user ID")

        try:
            user_id = UUID(user_id_str)
        except ValueError as e:
            raise ValueError(f"Invalid user ID in token: {e}") from e

        # Verify token exists in database (not revoked)
        token_hash = hash_token(refresh_token_str)
        stored_token = self.refresh_tokens.get_by_hash(token_hash)
        if not stored_token:
            raise ValueError("Refresh token not found or revoked")

        # Check if token is expired
        expires_at = stored_token.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) >= expires_at:
            raise ValueError("Refresh token expired")

        # Verify user still exists
        user = self.users.get_by_id(user_id)
        if not user:
            raise ValueError("User not found")

        # Delete old token
        self.refresh_tokens.delete_by_id(stored_token.token_id)

        # Create new tokens
        access_token = create_access_token(
            {"sub": str(user.user_id)},
            expires_delta=timedelta(minutes=60),
        )
        new_refresh_token_str = create_refresh_token(
            {"sub": str(user.user_id)},
            expires_delta=timedelta(days=7),
        )

        # Store new refresh token hash
        new_token_hash = hash_token(new_refresh_token_str)
        new_expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        self.refresh_tokens.create(
            user_id=user.user_id,
            token_hash=new_token_hash,
            expires_at=new_expires_at,
        )

        return TokenResponse(
            access_token=access_token,
            refresh_token=new_refresh_token_str,
            token_type="bearer",
        )

    def logout_user(self, user_id: UUID) -> None:
        """Invalidate all refresh tokens for a user.

        Args:
            user_id: User ID to log out.
        """
        self.refresh_tokens.delete_by_user(user_id)
