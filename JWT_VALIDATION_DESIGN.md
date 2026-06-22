# JWT Validation Design

**Date**: 2026-06-22  
**Status**: SPECIFICATION — AWAITING APPROVAL  
**Scope**: Keycloak JWT validation strategy for all protected endpoints  
**Owner**: P2 (Backend Platform Lead)  
**Security Level**: CRITICAL

---

## OVERVIEW

All protected API endpoints require a Keycloak-issued JWT in the Authorization header. The backend must validate this token to:

1. **Authenticate** the user (verify identity)
2. **Authorize** the user (check roles and permissions)
3. **Provision** the local user record (first-login flow)

This document specifies the exact validation process, caching strategy, and error handling.

---

## JWT STRUCTURE

### Keycloak JWT Claims

Keycloak issues JWTs (RS256 signed) with the following claims:

```json
{
  "jti": "9f3a8e2f-4d5c-4e6f-8a9b-1c2d3e4f5a6b",
  "exp": 1719070800,
  "nbf": 0,
  "iat": 1719066400,
  "iss": "http://localhost:8081/auth/realms/cloud-flight-simulator",
  "aud": ["cloud-flight-simulator-backend", "account"],
  "sub": "e6e63a5e-6f62-4afe-a546-a1234abcdef0",
  "typ": "Bearer",
  "azp": "cloud-flight-simulator-web",
  "session_state": "a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6",
  "acr": "1",
  "realm_access": {
    "roles": ["learner"]
  },
  "resource_access": {
    "account": {
      "roles": ["manage-account", "manage-account-links", "view-profile"]
    }
  },
  "name": "Alice Smith",
  "preferred_username": "alice@example.com",
  "given_name": "Alice",
  "family_name": "Smith",
  "email": "alice@example.com",
  "email_verified": true,
  "identity_provider": "email"
}
```

### Critical Claims for Application

| Claim | Source | Usage | Example |
|-------|--------|-------|---------|
| `sub` | Keycloak | Keycloak user ID (unique) | `e6e63a5e-6f62-4afe-a546-a1234abcdef0` |
| `iss` | Keycloak | Issuer (must match) | `http://localhost:8081/auth/realms/cloud-flight-simulator` |
| `aud` | Keycloak | Audience (must include backend client) | `["cloud-flight-simulator-backend", "account"]` |
| `exp` | Keycloak | Expiration timestamp | `1719070800` |
| `iat` | Keycloak | Issued-at timestamp | `1719066400` |
| `email` | Keycloak | User email | `alice@example.com` |
| `name` | Keycloak | User full name | `Alice Smith` |
| `realm_access.roles` | Keycloak | Assigned roles | `["learner", "admin"]` |

---

## VALIDATION PIPELINE

### Step 1: Extract Token from Header

```python
def extract_token(authorization_header: str) -> str:
    """
    Extract JWT from Authorization header.
    
    Expected format: "Bearer {token}"
    
    Raises:
    - HTTPException 400: Missing Authorization header
    - HTTPException 400: Malformed header (no "Bearer")
    - HTTPException 400: Missing token
    """
    if not authorization_header:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    
    parts = authorization_header.split(' ')
    
    if len(parts) != 2 or parts[0] != 'Bearer':
        raise HTTPException(
            status_code=400,
            detail="Invalid Authorization header format. Expected: Bearer {token}"
        )
    
    return parts[1]
```

### Step 2: Decode Header (Without Verification)

```python
from jose import jwt, JWTError

def get_jwt_header(token: str) -> dict:
    """
    Decode JWT header to extract 'kid' (key ID).
    
    This is done WITHOUT signature verification.
    Header format:
    {
      "alg": "RS256",
      "typ": "JWT",
      "kid": "key-id-123"
    }
    """
    try:
        # options={"verify_signature": False} is safe for header decode
        # We're only extracting the kid to find the right public key
        unverified = jwt.get_unverified_header(token)
        kid = unverified.get('kid')
        
        if not kid:
            raise ValueError("Missing 'kid' in JWT header")
        
        return unverified
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid JWT format: {str(e)}")
```

### Step 3: Fetch JWKS (Cached)

```python
from datetime import datetime, timedelta
import aiohttp

class JWKSCache:
    """
    Cache Keycloak's public keys (JWKS) to avoid fetching every request.
    
    Refresh strategy:
    - Cache TTL: 24 hours
    - Refresh-on-miss: If key not found, refresh cache and retry
    - Graceful: Serve stale cache if refresh fails
    """
    
    def __init__(self, keycloak_url: str, realm: str):
        self.jwks_url = f"{keycloak_url}/auth/realms/{realm}/.well-known/openid-configuration"
        self.cache = {}
        self.cache_time = None
        self.cache_ttl = timedelta(hours=24)
    
    async def fetch_jwks(self) -> dict:
        """Fetch JWKS from Keycloak."""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(self.jwks_url, timeout=5) as resp:
                    if resp.status != 200:
                        raise ValueError(f"Keycloak returned {resp.status}")
                    
                    data = await resp.json()
                    # Extract jwks_uri from openid-configuration
                    jwks_uri = data.get('jwks_uri')
                    
                    # Fetch actual JWKS
                    async with session.get(jwks_uri, timeout=5) as jwks_resp:
                        return await jwks_resp.json()
        except Exception as e:
            raise ValueError(f"Failed to fetch JWKS: {str(e)}")
    
    async def get_keys(self, force_refresh: bool = False) -> list:
        """
        Get public keys from cache, refreshing if needed.
        
        Args:
            force_refresh: If True, always fetch fresh JWKS from Keycloak
        
        Returns:
            List of JWK objects: [{"kty": "RSA", "kid": "...", "use": "sig", "n": "...", "e": "..."}]
        """
        now = datetime.utcnow()
        is_expired = self.cache_time is None or (now - self.cache_time) > self.cache_ttl
        
        if force_refresh or is_expired:
            try:
                jwks = await self.fetch_jwks()
                self.cache = jwks
                self.cache_time = now
            except Exception as e:
                if not self.cache:
                    # No cached data and fetch failed
                    raise
                else:
                    # Use stale cache and log warning
                    print(f"WARNING: JWKS fetch failed, using stale cache: {str(e)}")
        
        return self.cache.get('keys', [])

# Global instance
jwks_cache = JWKSCache(
    keycloak_url=config.KEYCLOAK_URL,
    realm=config.KEYCLOAK_REALM
)
```

### Step 4: Validate Signature

```python
def get_public_key(kid: str, keys: list) -> str:
    """
    Find public key matching the JWT's kid.
    
    Raises:
    - HTTPException 401: Key not found
    """
    for key in keys:
        if key.get('kid') == kid:
            # Convert JWK to PEM format for signature verification
            # This is handled by python-jose library
            return key
    
    raise HTTPException(
        status_code=401,
        detail="Key ID not found in Keycloak JWKS"
    )


async def validate_jwt_signature(token: str, keys: list) -> dict:
    """
    Validate JWT signature using public key.
    
    Returns:
        Decoded JWT claims (dict)
    
    Raises:
        HTTPException 401: Signature invalid, issuer mismatch, etc.
    """
    try:
        # Extract kid from header
        header = jwt.get_unverified_header(token)
        kid = header.get('kid')
        
        if not kid:
            raise JWTError("Missing 'kid' in JWT header")
        
        # Get public key
        key_data = get_public_key(kid, keys)
        
        # Validate and decode
        claims = jwt.decode(
            token,
            key_data,  # python-jose converts JWK to PEM internally
            algorithms=['RS256'],
            options={
                "verify_signature": True,
                "verify_aud": True,
                "verify_iss": True,
                "verify_exp": True
            },
            audience=config.KEYCLOAK_CLIENT_ID,
            issuer=f"{config.KEYCLOAK_URL}/auth/realms/{config.KEYCLOAK_REALM}"
        )
        
        return claims
    
    except JWTError as e:
        raise HTTPException(
            status_code=401,
            detail=f"Invalid JWT: {str(e)}"
        )
```

### Step 5: Verify Claims

```python
def verify_claims(claims: dict) -> None:
    """
    Verify required claims are present and valid.
    
    Raises:
        HTTPException 401: Missing or invalid claims
    """
    required_claims = ['sub', 'email', 'realm_access']
    
    for claim in required_claims:
        if claim not in claims:
            raise HTTPException(
                status_code=401,
                detail=f"Missing required claim: {claim}"
            )
    
    # Verify roles structure
    roles = claims.get('realm_access', {}).get('roles', [])
    if not isinstance(roles, list):
        raise HTTPException(
            status_code=401,
            detail="Invalid realm_access.roles format"
        )
    
    # Verify email is verified (optional, configurable)
    # if not claims.get('email_verified'):
    #     raise HTTPException(status_code=401, detail="Email not verified")
```

### Step 6: Full Validation Flow

```python
async def validate_keycloak_jwt(token: str) -> dict:
    """
    Complete JWT validation pipeline.
    
    Steps:
    1. Extract kid from header
    2. Get JWKS from cache (refresh if needed)
    3. Find public key by kid
    4. Validate signature (RS256)
    5. Verify issuer, audience, expiration
    6. Verify required claims
    
    Returns:
        Decoded JWT claims
    
    Raises:
        HTTPException 401: Validation failed
    """
    try:
        # Step 1-2: Get JWKS
        keys = await jwks_cache.get_keys()
        
        # Step 3-5: Validate signature and standard claims
        claims = await validate_jwt_signature(token, keys)
        
        # Step 6: Verify application-specific claims
        verify_claims(claims)
        
        return claims
    
    except HTTPException:
        raise  # Re-raise HTTP exceptions
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Token validation error: {str(e)}"
        )
```

---

## INTEGRATION INTO get_current_user()

```python
async def get_current_user(
    authorization: str = Header(...)
) -> UserSchema:
    """
    Extract, validate, and provision user from Keycloak JWT.
    
    This is the main dependency used by all protected endpoints.
    
    Contract:
    - Input: Authorization: Bearer {jwt}
    - Output: UserSchema
    - Side effect: Creates local user on first login
    - Raises: HTTPException 401 (invalid token)
    """
    
    # Step 1: Extract token
    token = extract_token(authorization)
    
    # Step 2: Validate JWT
    claims = await validate_keycloak_jwt(token)
    
    # Step 3: Extract user data from claims
    keycloak_id = claims['sub']
    email = claims['email']
    full_name = claims.get('name', '')
    roles = claims.get('realm_access', {}).get('roles', [])
    
    # Step 4: Lookup or create local user
    db = get_db()
    user = db.query(User).filter(User.keycloak_id == keycloak_id).first()
    
    if not user:
        # First login: create local user
        user = User(
            keycloak_id=keycloak_id,
            email=email,
            full_name=full_name,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            last_login_at=datetime.utcnow()
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Write audit event
        audit_service.write_event(
            db=db,
            event_type="USER_REGISTERED",
            source="AUTH_SERVICE",
            user_id=str(user.user_id)
        )
    else:
        # Update last_login_at
        user.last_login_at = datetime.utcnow()
        db.commit()
    
    # Step 5: Map roles
    app_role = determine_role(roles)
    
    # Step 6: Return UserSchema
    return UserSchema(
        user_id=str(user.user_id),
        email=user.email,
        full_name=user.full_name,
        role=app_role,
        created_at=user.created_at
    )
```

---

## ERROR HANDLING & DEBUGGING

### Common Validation Failures

| Error | Cause | Resolution |
|-------|-------|-----------|
| 401: Missing Authorization header | Client didn't send header | Client must include Authorization header |
| 401: Invalid Authorization header format | Client sent `"Basic {token}"` instead of `"Bearer {token}"` | Fix Authorization header format |
| 401: Signature invalid | Token signed with wrong key or tampered | Re-authenticate with Keycloak |
| 401: Token expired | Access token lifetime exceeded (60 minutes) | Use refresh token to get new access token |
| 401: Issuer mismatch | Token issued by different Keycloak server | Verify KEYCLOAK_URL matches token issuer |
| 401: Audience mismatch | Token issued for different client | Verify KEYCLOAK_CLIENT_ID matches aud claim |
| 500: Failed to fetch JWKS | Keycloak server unreachable | Check Keycloak connectivity, use stale cache |

### Debug Logging

```python
import logging

logger = logging.getLogger(__name__)

async def validate_keycloak_jwt(token: str) -> dict:
    """... (with debug logging)"""
    
    try:
        header = jwt.get_unverified_header(token)
        logger.debug(f"JWT header: {header}")
        
        keys = await jwks_cache.get_keys()
        logger.debug(f"JWKS keys available: {len(keys)}")
        
        kid = header.get('kid')
        matching_keys = [k for k in keys if k.get('kid') == kid]
        logger.debug(f"Matching keys for kid={kid}: {len(matching_keys)}")
        
        claims = await validate_jwt_signature(token, keys)
        logger.info(f"JWT validated for user: {claims.get('sub')}")
        
        return claims
    
    except HTTPException as e:
        logger.warning(f"JWT validation failed: {e.detail}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error validating JWT: {str(e)}")
        raise HTTPException(status_code=500, detail="Token validation error")
```

---

## SECURITY CONSIDERATIONS

### Key Rotation

Keycloak may rotate signing keys. JWKS cache handles this automatically:

1. New key is issued by Keycloak
2. Keycloak adds new key to JWKS endpoint
3. Token signed with new key
4. If new kid not in cache:
   - Validation fails
   - Cache is refreshed
   - Validation retried with fresh keys
   - Success (transparently to client)

### Clock Skew

Token expiration (`exp` claim) is checked server-side. Minor clock differences are tolerable:

```python
# python-jose handles clock skew automatically (±30 seconds default)
```

### JWKS Fetch Timeout

Cache fetch includes timeout to prevent hanging:

```python
async with aiohttp.ClientSession() as session:
    async with session.get(self.jwks_url, timeout=5) as resp:  # 5 second timeout
        ...
```

If Keycloak is slow:
- Request times out
- Stale cache is used (if available)
- User sees potential delay but request completes

### XSS Protection

Tokens should NEVER be exposed in URLs or HTML. Always use Authorization header:

```python
# CORRECT
headers = {"Authorization": f"Bearer {token}"}

# WRONG
GET /api/endpoint?token=...
GET /api/endpoint#token=...
```

### CSRF Protection

JWT-based API calls are immune to CSRF because:
- JWTs are only sent in Authorization header
- Browsers cannot add custom headers in cross-origin requests
- No cookie involved

---

## PERFORMANCE OPTIMIZATION

### JWKS Caching

**Without cache** (not recommended):
- Each request fetches JWKS from Keycloak
- ~100ms latency per request
- If Keycloak has 10 keys, 1000 req/s = 100+ JWKS fetches/sec = wasted bandwidth

**With cache** (recommended):
- First request fetches JWKS (100ms)
- Next 86,400 requests use cache (0ms overhead)
- On cache miss: refresh in background, serve stale cache

### Signature Verification Performance

RS256 verification is CPU-intensive. Optimizations:

1. **Cache verification keys** (already done by JWKS caching)
2. **Use PyJWT with speedups**: `pip install python-jose[cryptography]`
3. **Consider token refresh caching** (if needed for high load)

---

## TESTING

### Unit Test: Valid JWT

```python
async def test_validate_keycloak_jwt_valid():
    # Create test token signed with Keycloak private key
    token = create_signed_token({
        'sub': 'test-user',
        'email': 'test@example.com',
        'realm_access': {'roles': ['learner']},
        'exp': datetime.utcnow() + timedelta(hours=1)
    })
    
    # Mock JWKS fetch
    with patch.object(jwks_cache, 'fetch_jwks') as mock_fetch:
        mock_fetch.return_value = get_test_jwks()
        
        claims = await validate_keycloak_jwt(token)
        
        assert claims['sub'] == 'test-user'
        assert claims['email'] == 'test@example.com'
```

### Unit Test: Expired Token

```python
async def test_validate_keycloak_jwt_expired():
    # Create token that expired 1 hour ago
    token = create_signed_token({
        'exp': datetime.utcnow() - timedelta(hours=1)
    })
    
    with patch.object(jwks_cache, 'fetch_jwks'):
        with pytest.raises(HTTPException) as exc:
            await validate_keycloak_jwt(token)
        
        assert exc.value.status_code == 401
```

### Integration Test: get_current_user()

```python
async def test_get_current_user_creates_user():
    # Create valid Keycloak token
    token = create_signed_token({
        'sub': 'new-user-id',
        'email': 'newuser@example.com',
        'name': 'New User',
        'realm_access': {'roles': ['learner']}
    })
    
    # Call get_current_user
    user = await get_current_user(f"Bearer {token}")
    
    # Verify user schema
    assert user.user_id is not None
    assert user.email == 'newuser@example.com'
    assert user.full_name == 'New User'
    assert user.role == 'LEARNER'
    
    # Verify user was created in DB
    db_user = db.query(User).filter(User.keycloak_id == 'new-user-id').first()
    assert db_user is not None
    assert db_user.email == 'newuser@example.com'
```

---

## DEPLOYMENT CHECKLIST

Before going to production:

- [ ] KEYCLOAK_URL environment variable is set correctly
- [ ] KEYCLOAK_REALM environment variable matches Keycloak configuration
- [ ] KEYCLOAK_CLIENT_ID environment variable matches backend client ID in Keycloak
- [ ] JWKS fetch timeout is appropriate for network latency
- [ ] JWKS cache TTL (24 hours) is acceptable for key rotation frequency
- [ ] JWT validation is tested end-to-end with real Keycloak instance
- [ ] Logging is configured to see validation errors
- [ ] Error responses are user-friendly and don't expose secrets
- [ ] Security headers (CORS, CSP, etc.) are configured
- [ ] Rate limiting is implemented to prevent brute force

---

## SUMMARY

JWT validation is the **security boundary** for all protected endpoints. It must:

✅ Validate signature using Keycloak's public keys  
✅ Verify issuer and audience  
✅ Check expiration  
✅ Cache JWKS for performance  
✅ Handle key rotation gracefully  
✅ Provision local users on first login  
✅ Log validation failures for debugging  

**Status**: Specification complete, ready for implementation
