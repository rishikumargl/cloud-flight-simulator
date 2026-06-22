"""Authentication dependencies for FastAPI."""
from datetime import datetime
from uuid import uuid4

from fastapi import Depends, HTTPException, Header, status
from sqlalchemy.orm import Session

from app.auth.schemas import UserResponse
from app.dependencies import get_db
from app.keycloak.config import keycloak_config
from app.keycloak.jwks import JWKSCache
from app.keycloak.validation import validate_keycloak_jwt
from app.models.users import User

# Global JWKS cache
_jwks_cache = JWKSCache(keycloak_config.jwks_url)


def _determine_role(realm_roles: list[str]) -> str:
    """Determine application role from Keycloak realm roles.

    Args:
        realm_roles: List of realm role names from JWT

    Returns:
        Application role: 'PLATFORM_ADMIN', 'ADMIN', or 'LEARNER'
    """
    if "platform_admin" in realm_roles:
        return "PLATFORM_ADMIN"
    elif "admin" in realm_roles:
        return "ADMIN"
    else:
        return "LEARNER"


async def get_current_user(
    authorization: str | None = Header(None),
    db: Session = Depends(get_db),
) -> UserResponse:
    """Get the current authenticated user from Keycloak JWT.

    Validates token against Keycloak JWKS and provisions local user on first login.

    Args:
        authorization: Authorization header (Bearer <token>).
        db: Database session.

    Returns:
        UserResponse with current user data and role from Keycloak.

    Raises:
        HTTPException: If token is invalid or validation fails.
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

    # Validate JWT against Keycloak JWKS
    claims = await validate_keycloak_jwt(token, keycloak_config, _jwks_cache)

    # Extract claims
    keycloak_id = claims.get("sub")
    email = claims.get("email")
    full_name = claims.get("name", "")
    realm_roles = claims.get("realm_access", {}).get("roles", [])

    if not keycloak_id or not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: missing required claims",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Lookup or create local user
    user = db.query(User).filter(User.keycloak_id == keycloak_id).first()

    if not user:
        # First login: create local user
        user = User(
            user_id=uuid4(),
            keycloak_id=keycloak_id,
            email=email,
            full_name=full_name,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            last_login_at=datetime.utcnow(),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Update last login timestamp
        user.last_login_at = datetime.utcnow()
        db.commit()

    # Determine role from Keycloak roles
    app_role = _determine_role(realm_roles)

    return UserResponse(
        user_id=user.user_id,
        email=user.email,
        full_name=user.full_name,
        role=app_role,
        created_at=user.created_at,
    )
