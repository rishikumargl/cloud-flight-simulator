
"""Authentication dependencies for FastAPI."""
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import Depends, HTTPException, Header, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from jose import jwt, JWTError

from app.auth.schemas import UserResponse
from app.config import CLERK_PEM_PUBLIC_KEY, CLERK_ISSUER, CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY
from app.dependencies import get_db
from app.models.users import User

try:
    from clerk_backend_api import Clerk
    clerk_client = Clerk(bearer_auth=CLERK_SECRET_KEY)
    print("[AUTH] Clerk SDK (clerk-backend-api) initialized successfully")
except ImportError:
    try:
        from clerk import Clerk
        clerk_client = Clerk(api_key=CLERK_SECRET_KEY)
        print("[AUTH] Clerk SDK (clerk) initialized successfully")
    except Exception as e:
        print(f"[AUTH] Warning: Could not initialize Clerk SDK: {e}")
        clerk_client = None
except Exception as e:
    print(f"[AUTH] Warning: Could not initialize Clerk SDK: {e}")
    clerk_client = None


def _extract_clerk_email_and_name(clerk_user) -> tuple[str | None, str | None]:
    """
    Safely extract email and full_name from a Clerk user object.

    The Clerk SDK returns email addresses as a list of EmailAddress objects.
    Primary email is identified via primary_email_address_id.
    clerk_user.primary_email_address is NOT a string — it's an object or doesn't exist.
    """
    email = None
    full_name = None

    try:
        # Get all email addresses
        email_addresses = getattr(clerk_user, "email_addresses", None) or []

        # Find the primary email by matching primary_email_address_id
        primary_id = getattr(clerk_user, "primary_email_address_id", None)

        if primary_id and email_addresses:
            for ea in email_addresses:
                ea_id = getattr(ea, "id", None)
                if ea_id == primary_id:
                    email = getattr(ea, "email_address", None)
                    break

        # Fallback: just take the first email if no primary match
        if not email and email_addresses:
            email = getattr(email_addresses[0], "email_address", None)

        # Build full name
        first_name = getattr(clerk_user, "first_name", None) or ""
        last_name = getattr(clerk_user, "last_name", None) or ""
        full_name = f"{first_name} {last_name}".strip() or None

        print(f"[AUTH_SYNC] Extracted email={email!r}, full_name={full_name!r}")
    except Exception as e:
        print(f"[AUTH_SYNC] Warning: Error extracting Clerk profile fields: {type(e).__name__}: {e}")

    return email, full_name


async def _fetch_clerk_profile(clerk_id: str) -> tuple[str | None, str | None]:
    """Fetch email and full_name from Clerk API for a given user ID."""
    if not clerk_client:
        print("[AUTH_SYNC] Clerk SDK not initialized — skipping profile fetch")
        return None, None

    try:
        print(f"[AUTH_SYNC] Fetching Clerk user profile for: {clerk_id}")
        clerk_user = clerk_client.users.get(user_id=clerk_id)
        return _extract_clerk_email_and_name(clerk_user)
    except Exception as e:
        print(f"[AUTH_SYNC] Warning: Could not fetch Clerk user profile: {type(e).__name__}: {e}")
        return None, None


async def get_current_user(
    authorization: str | None = Header(None),
    db: Session = Depends(get_db),
) -> UserResponse:
    """Get the current authenticated user from Clerk JWT.

    Validates Clerk session token using RS256 public key verification.
    On first login, provisions a local user record.
    On subsequent logins, syncs email/full_name if they were previously NULL
    (covers the case where Clerk SDK was unavailable during initial provisioning).

    Args:
        authorization: Authorization header (format: "Bearer <token>").
        db: Database session.

    Returns:
        UserResponse with user data, email, and role.

    Raises:
        HTTPException 401: If token missing, invalid, or unverifiable.
    """
    print(f"[AUTH_BACKEND] Authorization header received: {bool(authorization)}")

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

    # Log unverified claims for debugging
    try:
        unverified_claims = jwt.get_unverified_claims(token)
        print(f"[AUTH_BACKEND] Claims: iss={unverified_claims.get('iss')}, sub={unverified_claims.get('sub')}")
    except Exception as e:
        print(f"[AUTH_BACKEND] Could not decode unverified claims: {e}")

    # Verify RS256 signature using Clerk PEM public key
    try:
        claims = jwt.decode(
            token,
            CLERK_PEM_PUBLIC_KEY,
            algorithms=["RS256"],
            options={"verify_exp": True, "verify_aud": False},
        )
    except JWTError as e:
        print(f"[AUTH_BACKEND] JWT DECODE FAILED: {type(e).__name__}: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )

    clerk_id = claims.get("sub")
    if not clerk_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: missing 'sub' claim",
            headers={"WWW-Authenticate": "Bearer"},
        )

    print(f"[AUTH_SYNC] JWT verified. clerk_id={clerk_id}")

    # ── Look up user in local DB ───────────────────────────────────────────
    user = db.query(User).filter(User.clerk_id == clerk_id).first()

    if not user:
        # ── First login: fetch profile then provision ──────────────────────
        print(f"[AUTH_SYNC] New user — provisioning. clerk_id={clerk_id}")
        email, full_name = await _fetch_clerk_profile(clerk_id)

        try:
            user = User(
                user_id=uuid4(),
                clerk_id=clerk_id,
                email=email,
                full_name=full_name,
                role="LEARNER",
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
                last_login_at=datetime.now(timezone.utc),
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"[AUTH_SYNC] USER_CREATED user_id={user.user_id} email={email!r}")
        except IntegrityError:
            db.rollback()
            user = db.query(User).filter(User.clerk_id == clerk_id).first()
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to provision user",
                )
            print(f"[AUTH_SYNC] USER_FOUND_AFTER_RACE user_id={user.user_id}")
    else:
        print(f"[AUTH_SYNC] Existing user found. user_id={user.user_id} email={user.email!r}")

        # ── Sync email/name if they are NULL (backfill existing null rows) ──
        needs_sync = not user.email or not user.full_name
        if needs_sync:
            print(f"[AUTH_SYNC] email or full_name is NULL — fetching from Clerk to backfill")
            email, full_name = await _fetch_clerk_profile(clerk_id)
            if email and not user.email:
                user.email = email
                print(f"[AUTH_SYNC] Backfilled email={email!r}")
            if full_name and not user.full_name:
                user.full_name = full_name
                print(f"[AUTH_SYNC] Backfilled full_name={full_name!r}")

        user.last_login_at = datetime.now(timezone.utc)
        user.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(user)

    # ── Build response ─────────────────────────────────────────────────────
    print(f"[AUTH] Returning user_id={user.user_id} email={user.email!r} role={user.role}")
    return UserResponse(
        user_id=user.user_id,
        email=user.email or "",        # GCP IAM grant uses this Gmail
        full_name=user.full_name or "",
        role=user.role,
        created_at=user.created_at,
    )