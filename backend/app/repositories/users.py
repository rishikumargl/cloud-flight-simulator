"""User repository — data access for users table."""
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.users import User


class UserRepository:
    """Data access layer for users."""

    def __init__(self, db: Session):
        """Initialize repository with database session.

        Args:
            db: SQLAlchemy database session.
        """
        self.db = db

    def get_by_email(self, email: str) -> User | None:
        """Get user by email address.

        Args:
            email: User email to search for.

        Returns:
            User object if found, None otherwise.
        """
        stmt = select(User).where(User.email == email)
        return self.db.execute(stmt).scalar_one_or_none()

    def get_by_id(self, user_id: UUID) -> User | None:
        """Get user by user ID.

        Args:
            user_id: User ID to search for.

        Returns:
            User object if found, None otherwise.
        """
        return self.db.get(User, user_id)

    def create_user(
        self,
        email: str,
        password_hash: str,
        full_name: str,
    ) -> User:
        """Create a new user.

        Args:
            email: User email address.
            password_hash: Hashed password.
            full_name: User full name.

        Returns:
            Created User object.

        Raises:
            sqlalchemy.exc.IntegrityError: If email already exists.
        """
        user = User(
            email=email,
            password_hash=password_hash,
            full_name=full_name,
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user
