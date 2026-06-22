"""Dependency injection — FastAPI dependencies."""
from sqlalchemy.orm import Session

from app.database import SessionLocal


def get_db() -> Session:
    """Get database session dependency.

    Yields:
        SQLAlchemy database session.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
