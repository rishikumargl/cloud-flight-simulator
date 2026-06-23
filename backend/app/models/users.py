"""User model — ORM mapping for users table."""
from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import String, DateTime
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import expression

from app.database import Base


class User(Base):
    """User account model (Clerk-backed with local role authorization)."""

    __tablename__ = "users"

    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        server_default=expression.text("gen_random_uuid()"),
    )
    clerk_id: Mapped[str] = mapped_column(String(255), unique=True, nullable=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=True, default=None)
    role: Mapped[str] = mapped_column(String(50), nullable=False, default="LEARNER")
    last_login_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=expression.text("NOW()"),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=expression.text("NOW()"),
    )
