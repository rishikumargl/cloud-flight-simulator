"""JWT validation against Keycloak JWKS."""
from typing import Any, Dict

from fastapi import HTTPException
from jose import JWTError, jwt

from .config import KeycloakConfig
from .jwks import JWKSCache


async def validate_keycloak_jwt(
    token: str,
    config: KeycloakConfig,
    jwks_cache: JWKSCache,
    force_refresh: bool = False,
) -> Dict[str, Any]:
    """Validate Keycloak JWT and return claims.

    Args:
        token: JWT token string
        config: Keycloak configuration
        jwks_cache: JWKS cache instance
        force_refresh: Force refresh JWKS cache

    Returns:
        Decoded JWT claims

    Raises:
        HTTPException: If JWT is invalid (401)
    """
    try:
        # Get JWKS (use force_refresh if kid not found)
        keys = await jwks_cache.get_keys(force_refresh=force_refresh)

        # Get kid from JWT header
        try:
            header = jwt.get_unverified_header(token)
        except JWTError as e:
            raise HTTPException(status_code=401, detail=f"Invalid JWT format: {str(e)}")

        kid = header.get("kid")
        if not kid:
            raise HTTPException(status_code=401, detail="Missing key ID in JWT header")

        # Find matching public key
        key = None
        for k in keys:
            if k.get("kid") == kid:
                key = k
                break

        if not key:
            # Key not found, try refreshing JWKS cache
            if not force_refresh:
                return await validate_keycloak_jwt(
                    token, config, jwks_cache, force_refresh=True
                )
            raise HTTPException(status_code=401, detail="Key ID not found in Keycloak JWKS")

        # Validate and decode JWT
        claims = jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            audience=config.client_id,
            issuer=config.issuer,
            options={
                "verify_signature": True,
                "verify_aud": True,
                "verify_iss": True,
                "verify_exp": True,
            },
        )

        return claims

    except HTTPException:
        raise
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid JWT: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Token validation error: {str(e)}")
