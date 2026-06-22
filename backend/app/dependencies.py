"""Shared FastAPI dependencies - JWT validation, current user, database session."""
import os
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthCredentials
import jwt

from backend.app.database import SessionLocal

security = HTTPBearer()

JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60


def get_db():
    """Dependency: Get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(credentials: HTTPAuthCredentials = Depends(security)) -> Dict[str, Any]:
    """
    Dependency: Validate JWT and extract current user.

    Returns user dict: {user_id, email, full_name, role}
    """
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        email = payload.get("email")
        full_name = payload.get("full_name")
        role = payload.get("role", "LEARNER")

        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )

        return {
            "user_id": user_id,
            "email": email,
            "full_name": full_name,
            "role": role,
        }
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )


def create_access_token(user_id: str, email: str, full_name: str, role: str = "LEARNER") -> str:
    """Create JWT access token."""
    expires = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": user_id,
        "email": email,
        "full_name": full_name,
        "role": role,
        "exp": expires,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    """Create JWT refresh token (7 days)."""
    expires = datetime.utcnow() + timedelta(days=7)
    payload = {
        "sub": user_id,
        "type": "refresh",
        "exp": expires,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
