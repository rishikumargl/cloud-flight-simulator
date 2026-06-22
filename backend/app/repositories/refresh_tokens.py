"""Refresh token repository — data access for refresh_tokens table."""
from datetime import datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.refresh_tokens import RefreshToken


class RefreshTokenRepository:
    """Data access layer for refresh tokens."""

    def __init__(self, db: Session):
        """Initialize repository with database session.

        Args:
            db: SQLAlchemy database session.
        """
        self.db = db

    def create(
        self,
        user_id: UUID,
        token_hash: str,
        expires_at: datetime,
    ) -> RefreshToken:
        """Create a new refresh token.

        Args:
            user_id: User ID for the token.
            token_hash: Hashed token value.
            expires_at: Expiration timestamp.

        Returns:
            Created RefreshToken object.
        """
        token = RefreshToken(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at,
        )
        self.db.add(token)
        self.db.commit()
        self.db.refresh(token)
        return token

    def get_by_hash(self, token_hash: str) -> RefreshToken | None:
        """Get refresh token by hash value.

        Args:
            token_hash: Token hash to search for.

        Returns:
            RefreshToken if found, None otherwise.
        """
        stmt = select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        return self.db.execute(stmt).scalar_one_or_none()

    def delete_by_id(self, token_id: UUID) -> None:
        """Delete a refresh token by ID.

        Args:
            token_id: Token ID to delete.
        """
        token = self.db.get(RefreshToken, token_id)
        if token:
            self.db.delete(token)
            self.db.commit()

    def delete_by_user(self, user_id: UUID) -> None:
        """Delete all refresh tokens for a user.

        Args:
            user_id: User ID to delete tokens for.
        """
        stmt = select(RefreshToken).where(RefreshToken.user_id == user_id)
        tokens = self.db.execute(stmt).scalars().all()
        for token in tokens:
            self.db.delete(token)
        self.db.commit()
