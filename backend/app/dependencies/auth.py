
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
    On first login, extracts email/name from JWT claims (avoids Clerk SDK bugs).
    On subsequent logins, syncs email/full_name if they were previously NULL
    (backfill from Clerk API, with graceful fallback if fetch fails).

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

    # ── Extract email/name from JWT claims (primary source) ──────────────────
    jwt_email = None
    jwt_full_name = None

    # Clerk includes email_address and name in the token
    jwt_email = claims.get("email")
    if not jwt_email and claims.get("email_verified"):
        # Sometimes it's email_address instead of email
        jwt_email = claims.get("email_address")

    # Get full name from JWT claims
    first_name = claims.get("given_name") or ""
    last_name = claims.get("family_name") or ""
    jwt_full_name = f"{first_name} {last_name}".strip() or None

    print(f"[AUTH_SYNC] JWT contains: email={jwt_email!r}, name={jwt_full_name!r}")

    # ── Look up user in local DB ───────────────────────────────────────────
    user = db.query(User).filter(User.clerk_id == clerk_id).first()

    if not user:
        # ── First login: use JWT claims directly, avoid Clerk SDK issues ─────
        print(f"[AUTH_SYNC] New user — provisioning from JWT. clerk_id={clerk_id}")

        # If JWT doesn't have email, try Clerk SDK as fallback (but don't crash if it fails)
        email = jwt_email
        full_name = jwt_full_name

        if not email:
            print(f"[AUTH_SYNC] Email missing from JWT — attempting Clerk API fetch")
            fallback_email, fallback_name = await _fetch_clerk_profile(clerk_id)
            if fallback_email:
                email = fallback_email
                print(f"[AUTH_SYNC] Got email from Clerk API: {email!r}")
            if fallback_name:
                full_name = fallback_name
                print(f"[AUTH_SYNC] Got name from Clerk API: {full_name!r}")

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
        # Priority: JWT claims > Clerk API > existing value
        needs_sync = not user.email or not user.full_name
        if needs_sync:
            print(f"[AUTH_SYNC] email or full_name is NULL — syncing from JWT/Clerk")

            # Try JWT first
            if jwt_email and not user.email:
                user.email = jwt_email
                print(f"[AUTH_SYNC] Backfilled email from JWT: {jwt_email!r}")
            elif not user.email:
                # Fall back to Clerk API (but don't crash if it fails)
                fallback_email, _ = await _fetch_clerk_profile(clerk_id)
                if fallback_email:
                    user.email = fallback_email
                    print(f"[AUTH_SYNC] Backfilled email from Clerk API: {fallback_email!r}")

            if jwt_full_name and not user.full_name:
                user.full_name = jwt_full_name
                print(f"[AUTH_SYNC] Backfilled name from JWT: {jwt_full_name!r}")
            elif not user.full_name:
                # Fall back to Clerk API
                _, fallback_name = await _fetch_clerk_profile(clerk_id)
                if fallback_name:
                    user.full_name = fallback_name
                    print(f"[AUTH_SYNC] Backfilled name from Clerk API: {fallback_name!r}")

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