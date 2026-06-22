"""Cryptographic operations for authentication."""
import hashlib
import os
from datetime import datetime, timedelta, timezone
from typing import Any

import bcrypt
import jwt

from app.config import SECRET_KEY


def hash_token(token: str) -> str:
    """Hash a token string using SHA256.

    Args:
        token: Plain token string to hash.

    Returns:
        Hashed token as hex string.
    """
    return hashlib.sha256(token.encode()).hexdigest()


def hash_password(password: str) -> str:
    """Hash a password using bcrypt.

    Args:
        password: Plain text password to hash.

    Returns:
        Hashed password as string.
    """
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode(), salt).decode()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a bcrypt hash.

    Args:
        plain_password: Plain text password to verify.
        hashed_password: Hashed password from database.

    Returns:
        True if password matches, False otherwise.
    """
    return bcrypt.checkpw(plain_password.encode(), hashed_password.encode())


def create_access_token(
    data: dict[str, Any],
    expires_delta: timedelta | None = None,
) -> str:
    """Create a JWT access token.

    Args:
        data: Payload data to encode.
        expires_delta: Optional custom expiration time. Defaults to 60 minutes.

    Returns:
        Encoded JWT token string.
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=60)

    to_encode.update({"exp": expire, "type": "access"})

    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm="HS256")
    return encoded_jwt


def create_refresh_token(
    data: dict[str, Any],
    expires_delta: timedelta | None = None,
) -> str:
    """Create a JWT refresh token.

    Args:
        data: Payload data to encode.
        expires_delta: Optional custom expiration time. Defaults to 7 days.

    Returns:
        Encoded JWT token string.
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=7)

    to_encode.update({"exp": expire, "type": "refresh"})

    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm="HS256")
    return encoded_jwt


def decode_token(token: str, token_type: str = "access") -> dict[str, Any]:
    """Decode and validate a JWT token.

    Args:
        token: Encoded JWT token string.
        token_type: Expected token type ('access' or 'refresh').

    Returns:
        Decoded token payload.

    Raises:
        jwt.InvalidTokenError: If token is invalid or expired.
        ValueError: If token type does not match.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    except jwt.InvalidTokenError as e:
        raise jwt.InvalidTokenError(f"Invalid token: {e}") from e

    if payload.get("type") != token_type:
        raise ValueError(f"Invalid token type. Expected {token_type}")

    return payload
