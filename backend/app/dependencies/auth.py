"""Authentication dependencies for FastAPI."""
from datetime import datetime, timezone
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

    Hierarchy: platform_admin > admin > learner (default)

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

    Validates token against Keycloak JWKS endpoint. On first login, provisions
    a local user record for application use (audit, user tracking, permissions).

    Flow:
    1. Extract JWT from Authorization header (Bearer <token>)
    2. Validate signature against Keycloak JWKS public keys
    3. Verify issuer, audience, expiration claims
    4. Extract user identity (sub, email, name) from JWT claims
    5. Query local users table by keycloak_id
    6. If not found: create local user (first login)
    7. If found: update last_login_at timestamp
    8. Extract role from realm_access.roles claim
    9. Return UserResponse (user_id, email, full_name, role, created_at)

    Args:
        authorization: Authorization header (format: "Bearer <token>").
        db: Database session.

    Returns:
        UserResponse with current user data and role.

    Raises:
        HTTPException 401: If header missing, format invalid, or token invalid.
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

    # Extract claims from validated JWT
    keycloak_id = claims.get("sub")
    email = claims.get("email")
    full_name = claims.get("name", "")
    realm_roles = claims.get("realm_access", {}).get("roles", [])

    if not keycloak_id or not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: missing required claims (sub, email)",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Lookup or create local user
    user = db.query(User).filter(User.keycloak_id == keycloak_id).first()

    if not user:
        # First login: create local user record
        user = User(
            user_id=uuid4(),
            keycloak_id=keycloak_id,
            email=email,
            full_name=full_name,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
            last_login_at=datetime.now(timezone.utc),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Returning user: update last login timestamp
        user.last_login_at = datetime.now(timezone.utc)
        db.commit()

    # Determine application role from Keycloak realm roles
    app_role = _determine_role(realm_roles)

    return UserResponse(
        user_id=user.user_id,
        email=user.email,
        full_name=user.full_name,
        role=app_role,
        created_at=user.created_at,
    )
