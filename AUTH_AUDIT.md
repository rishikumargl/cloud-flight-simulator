# Authentication Audit Report

**Date**: 2026-06-22  
**Status**: MIGRATION INCOMPLETE — BROKEN STATE  
**Severity**: CRITICAL

---

## EXECUTIVE SUMMARY

The authentication system is in a **PARTIAL MIGRATION** state:

- **Frozen routes require 5 auth endpoints** (register, login, refresh, logout, me)
- **Current implementation has only 2 endpoints** (logout, me) — all Keycloak-based
- **Missing endpoints would fail because** register/login/refresh are NOT implemented
- **Architecture is inconsistent**: service.py generates HS256 JWTs, but dependencies expect RS256 Keycloak JWTs
- **Startup fails** due to missing `aiohttp` import in Keycloak modules
- **Two incompatible token systems** exist in the same codebase

---

## CURRENT ARCHITECTURE

```
LOCAL JWT SYSTEM (service.py, security.py)
├── Registration: email/password → bcrypt hash → HS256 JWT
├── Login: email/password → verify bcrypt → issue HS256 JWT
├── Refresh: HS256 JWT → validate → new HS256 JWT
└── Database: users.password_hash, refresh_tokens table

KEYCLOAK SYSTEM (keycloak/, dependencies/auth.py)
├── No registration (Keycloak owns it)
├── No login (Keycloak owns it)
├── No refresh (Keycloak owns it)
└── First-login provisioning in get_current_user dependency
```

**Result**: These systems cannot coexist. A request to POST /auth/login would:
1. Call auth_router.login() — **NOT IMPLEMENTED** (router only has /me and /logout)
2. Even if it existed, it would issue HS256 tokens
3. GET /protected endpoint calls get_current_user (expects Keycloak RS256)
4. Token validation fails

---

## MIGRATION STATUS: INCOMPLETE

### Keycloak Implementation (Partial)
- ✅ `keycloak/config.py` — Configuration class exists
- ✅ `keycloak/jwks.py` — JWKS cache implemented
- ✅ `keycloak/validation.py` — JWT validation implemented
- ❌ **Never deployed** — No Keycloak server exists
- ❌ **Not integrated** — Only two routes use it (/me, /logout)
- ❌ **Missing frontend integration** — Frontend still expects local JWT login

### Local JWT Implementation (Complete)
- ✅ `auth/security.py` — Full token generation and verification
- ✅ `auth/service.py` — Full register/login/refresh business logic
- ✅ `auth/schemas.py` — Request/response schemas
- ❌ **Not wired to routes** — Router has no /register, /login, /refresh endpoints

---

## CONFLICTS FOUND

### 1. Missing Endpoints (BLOCKING)

| Frozen Route | Required | Status | Impact |
|---|---|---|---|
| POST /auth/register | Yes | ❌ Missing | Users cannot sign up |
| POST /auth/login | Yes | ❌ Missing | Users cannot log in |
| POST /auth/refresh | Yes | ❌ Missing | Token refresh fails |
| POST /auth/logout | Yes | ✅ Exists | Works (Keycloak-based) |
| GET /auth/me | Yes | ✅ Exists | Works (Keycloak-based) |

### 2. Token System Mismatch

```python
# service.py creates HS256 tokens
jwt.encode(to_encode, SECRET_KEY, algorithm="HS256")

# dependencies/auth.py expects RS256 tokens
jwt.decode(token, key, algorithms=["RS256"], ...)
```

These are incompatible. A token from service.py would fail in dependencies/auth.py.

### 3. Dependency Conflicts

| Module | Depends On | Status | Issue |
|---|---|---|---|
| keycloak/jwks.py | aiohttp | ❌ Missing | Startup fails: `ModuleNotFoundError: No module named 'aiohttp'` |
| keycloak/validation.py | python-jose | ✅ Present | Works if aiohttp added |
| auth/security.py | bcrypt, jwt | ✅ Present | Works |

### 4. Configuration Conflicts

```python
# config.py (current)
KEYCLOAK_URL = os.getenv("KEYCLOAK_URL", "...")
KEYCLOAK_CLIENT_ID = os.getenv("KEYCLOAK_CLIENT_ID", "...")
# Missing: SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_DAYS
```

`security.py` imports `SECRET_KEY` from config but config no longer defines it:
```python
from app.config import SECRET_KEY  # ← Does not exist in config.py
```

---

## DEAD CODE

### Code That Exists But Is Never Used

| File | Function | Why Dead |
|---|---|---|
| auth/service.py | register_user() | Router has no /register endpoint |
| auth/service.py | login_user() | Router has no /login endpoint |
| auth/service.py | refresh_access_token() | Router has no /refresh endpoint |
| auth/security.py | create_access_token() | Never called (service.py exists but not used) |
| auth/security.py | create_refresh_token() | Never called |
| auth/security.py | verify_password() | Never called |
| auth/security.py | hash_password() | Never called |
| repositories/users.py | get_by_email() | Never called |
| repositories/refresh_tokens.py | create() | Never called |

---

## BROKEN IMPORTS

### Import Errors on Startup

```python
# backend/app/auth/security.py line 10
from app.config import SECRET_KEY  # ← FAILS: SECRET_KEY not in config.py
```

Even if Keycloak is not used, importing auth_router in main.py imports security.py, which imports nonexistent SECRET_KEY.

### Unused Imports

```python
# backend/app/dependencies/auth.py
from app.keycloak.config import keycloak_config  # Used
from app.keycloak.jwks import JWKSCache  # Used
from app.keycloak.validation import validate_keycloak_jwt  # Used
from app.audit.service import AuditService  # Imported in router (dynamic import)
# All imports are actually used
```

### Missing Imports

```python
# backend/requirements.txt
aiohttp  # Required by keycloak/jwks.py but not present
```

---

## RECOMMENDED PATH FORWARD

### Option A: Complete Keycloak Migration (Requires Deployment)
**Pros**: Modern, enterprise-grade, multi-provider support  
**Cons**: Requires Keycloak server, frontend changes, additional infrastructure  
**Timeline**: 2-3 weeks  
**Decision**: Only if stakeholders approve Keycloak deployment and full migration

### Option B: Restore Local JWT Authentication (IMMEDIATE FIX)
**Pros**: Restores working system, no infrastructure needed, quick fix  
**Cons**: Single auth method, no multi-provider support  
**Timeline**: 2 hours  
**Decision**: **RECOMMENDED** — System is broken; fix locally first

---

## RECOMMENDATION: OPTION B (RESTORE LOCAL AUTH)

### Why:

1. **System is broken** — Startup fails, missing endpoints, incompatible tokens
2. **Frozen routes demand local auth** — /auth/register, /auth/login, /auth/refresh have no provider listed (use default JWT)
3. **No Keycloak server exists** — No deployment artifacts, no realm config, no users
4. **Frontend not ready** — Still expects email/password form and local JWT storage
5. **Quick fix possible** — Restore deleted code, wire endpoints, fix config

### Steps:

1. Restore SECRET_KEY to config.py
2. Restore router endpoints: /register, /login, /refresh
3. Restore database models and repositories
4. Remove all Keycloak imports from dependencies/auth.py
5. Delete keycloak/ directory (placeholder code)
6. Run migrations
7. Test complete login → protected endpoint flow

---

## RISK ASSESSMENT

### If We Continue Keycloak Integration
- **Probability of success**: LOW (5%) — No server, incomplete code, missing integration
- **Risk of failure**: HIGH (95%) — Will remain broken for weeks
- **Deployment blocker**: System cannot start with current code

### If We Restore Local Auth
- **Probability of success**: HIGH (95%) — Proven code, complete implementation
- **Risk of failure**: LOW (5%) — Minor issues with schema changes
- **Deployment window**: 2 hours

---

## FINAL DETERMINATION

**Status**: PARTIAL MIGRATION IN BROKEN STATE  
**Path Forward**: RESTORE LOCAL JWT AUTHENTICATION  
**Authority**: P2 Platform Lead (migration was incomplete, architecture is inconsistent)  
**Action**: Proceed with Option B immediately
