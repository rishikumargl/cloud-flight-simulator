# Phase 1: JWT to Keycloak OIDC Migration Analysis

**Date**: 2026-06-22  
**Status**: ANALYSIS COMPLETE - AWAITING APPROVAL  
**Scope**: Comprehensive repository analysis of authentication system migration

---

## EXECUTIVE SUMMARY

Cloud Flight Simulator currently uses a JWT-based authentication system with local credential validation, bcrypt password hashing, and custom refresh token rotation. This analysis identifies all code that must be removed, refactored, or kept during migration to Keycloak-based OIDC authentication.

**Key Finding**: Migration requires removing ~600 lines of JWT infrastructure code and refactoring ~800 lines of authentication logic across 18 files.

---

## ARCHITECTURE RULES COMPLIANCE

This analysis follows the non-negotiable Keycloak migration rules:

✅ **Rule 1**: Keycloak becomes ONLY identity provider (no parallel systems)  
✅ **Rule 2**: No token exchange layer (direct OIDC JWT validation)  
✅ **Rule 3**: No token storage tables (Keycloak owns sessions/tokens)  
✅ **Rule 4**: No role tables (roles from Keycloak JWT claims)  
✅ **Rule 5**: Minimal user model (metadata only, no passwords)  
✅ **Rule 6**: Multi-provider support (Google, Microsoft, future providers)  
✅ **Rule 7**: Single login experience (no multiple login pages)  

---

## PART 1: BACKEND AUTHENTICATION STRUCTURE

### 1.1 Authentication Router (`backend/app/auth/router.py`)

**Current State**: 179 lines, 5 endpoints

| Endpoint | Lines | Action | Rationale |
|----------|-------|--------|-----------|
| `POST /auth/register` | 38 | **REMOVE** | Keycloak handles user creation |
| `POST /auth/login` | 36 | **REMOVE** | Keycloak handles OIDC flow |
| `POST /auth/refresh` | 40 | **REMOVE** | Keycloak manages token refresh |
| `POST /auth/logout` | 24 | **REFACTOR** | Call Keycloak revocation endpoint |
| `GET /auth/me` | 19 | **KEEP** | Extract user from OIDC JWT claims |

**New endpoint needed**:
- `POST /auth/callback` - Handle OIDC authorization code exchange

**Impact**: Remove 114 lines of endpoint code, add 20 lines for callback

---

### 1.2 Authentication Service (`backend/app/auth/service.py`)

**Current State**: 202 lines, 3 methods

| Method | Lines | Action | Rationale |
|--------|-------|--------|-----------|
| `register_user()` | 39 | **REMOVE** | Keycloak manages registration |
| `login_user()` | 46 | **REMOVE** | Keycloak manages login |
| `refresh_access_token()` | 73 | **REMOVE** | Keycloak manages token refresh |
| `logout_user()` | 7 | **REFACTOR** | Call Keycloak logout/revocation |

**Classes instantiated**:
- `UserRepository` - REFACTOR to sync with Keycloak
- `RefreshTokenRepository` - REMOVE entire class

**New methods needed**:
- `validate_oidc_token(token: str)` - Validate against Keycloak JWKS
- `sync_user_from_oidc_claims(claims: dict)` - Create/update user from ID token

**Impact**: Remove 158 lines, add 50 lines

---

### 1.3 Security Module (`backend/app/auth/security.py`)

**Current State**: 125 lines

| Function | Lines | Action | Rationale |
|----------|-------|--------|-----------|
| `hash_token()` | 10 | **REMOVE** | No token storage in DB |
| `hash_password()` | 11 | **REMOVE** | Keycloak manages password hashing |
| `verify_password()` | 11 | **REMOVE** | Not needed for OIDC |
| `create_access_token()` | 24 | **REMOVE** | Keycloak issues tokens |
| `create_refresh_token()` | 24 | **REMOVE** | Keycloak manages refresh |
| `decode_token()` | 23 | **REMOVE** | Replace with Keycloak JWKS validation |

**Dependencies**:
- `SECRET_KEY` from config - REMOVE
- `PyJWT` library - REMOVE from requirements.txt
- `bcrypt` library - REMOVE from requirements.txt

**Impact**: Delete entire file (125 lines)

---

### 1.4 Auth Schemas (`backend/app/auth/schemas.py`)

**Current State**: 72 lines

| Schema | Lines | Action | Rationale |
|--------|-------|--------|-----------|
| `RegisterRequest` | 14 | **REMOVE** | No local registration |
| `LoginRequest` | 12 | **REMOVE** | OIDC flow handles login |
| `TokenResponse` | 15 | **KEEP** | Reuse for OIDC token response |
| `UserResponse` | 19 | **KEEP** | Maps Keycloak claims to app user |

**Changes**:
- `TokenResponse`: Add `id_token` field for OIDC
- `UserResponse`: Keep as-is, maps from Keycloak ID token claims

**Impact**: Remove 26 lines

---

### 1.5 Auth Dependency (`backend/app/dependencies/auth.py`)

**Current State**: 80 lines

**Function**: `get_current_user()`
- Current: Extract JWT, validate with `SECRET_KEY`, return user
- New: Extract OIDC token, validate against Keycloak JWKS, fetch/create user

**Internal calls to replace**:
- `decode_token()` → `validate_keycloak_jwt()`
- `UserRepository.get_by_id()` → `UserRepository.get_by_keycloak_id()`

**Signature stays same**: `async def get_current_user(token: HTTPBearer) -> UserResponse`

**Impact**: Replace 40 lines of validation logic

---

### 1.6 User Model (`backend/app/models/users.py`)

**Current State**: 34 lines

| Column | Action | Rationale |
|--------|--------|-----------|
| `user_id: UUID` | KEEP | Map to Keycloak `sub` claim |
| `email: str` | KEEP | From Keycloak `email` claim |
| `password_hash: str` | **REMOVE** | Keycloak manages passwords |
| `full_name: str` | KEEP | From Keycloak `name` claim |
| `created_at, updated_at` | KEEP | Track local record changes |

**New column needed**:
- `keycloak_id: str UNIQUE` - Map to Keycloak subject ID

**Impact**: Remove column, add column, 1 Alembic migration

---

### 1.7 Refresh Token Model (`backend/app/models/refresh_tokens.py`)

**Current State**: 37 lines

**Status**: **ENTIRE FILE REMOVED**

Reason: Keycloak manages refresh token lifecycle. Application has no need to store or track refresh tokens locally.

**Impact**: Delete entire file

---

### 1.8 Refresh Token Repository (`backend/app/repositories/refresh_tokens.py`)

**Current State**: 81 lines, 4 methods

| Method | Action |
|--------|--------|
| `create()` | **REMOVE** |
| `get_by_hash()` | **REMOVE** |
| `delete_by_id()` | **REMOVE** |
| `delete_by_user()` | **REMOVE** |

**Status**: **ENTIRE FILE REMOVED**

Reason: All token operations handled by Keycloak server.

**Impact**: Delete entire file

---

### 1.9 User Repository (`backend/app/repositories/users.py`)

**Current State**: 71 lines, 3 methods

| Method | Lines | Action | Rationale |
|--------|-------|--------|-----------|
| `get_by_email()` | 11 | **REFACTOR** | May query Keycloak API |
| `get_by_id()` | 10 | **REFACTOR** | Query local DB with user_id |
| `create_user()` | 28 | **REMOVE** | Use Keycloak admin API |

**New methods needed**:
- `get_by_keycloak_id(keycloak_sub)` - Map Keycloak ID to local user
- `sync_from_oidc_claims(claims)` - Create/update user from ID token

**Impact**: Refactor 2 methods, remove 1 method, add 2 methods

---

### 1.10 Config (`backend/app/config.py`)

**Current State**: 19 lines

**Environment variables to REMOVE**:
- `SECRET_KEY` - No JWT signing needed
- `ALGORITHM` - No JWT needed
- `ACCESS_TOKEN_EXPIRE_MINUTES` - Keycloak controls token lifetime
- `REFRESH_TOKEN_EXPIRE_DAYS` - Keycloak controls token lifetime

**Environment variables to ADD**:
- `KEYCLOAK_URL` - e.g., `http://localhost:8080`
- `KEYCLOAK_REALM` - e.g., `master`
- `KEYCLOAK_CLIENT_ID` - e.g., `cloud-flight-simulator`
- `KEYCLOAK_CLIENT_SECRET` - Backend client secret
- `KEYCLOAK_JWKS_URL` - For token validation cache

**Impact**: 4 variables removed, 5 variables added, 6 lines changed

---

### 1.11 Main App (`backend/app/main.py`)

**Current State**: 42 lines

**Changes**:
- Line 4: Keep `auth_router` import (endpoints will be modified)
- Line 21: Keep `app.include_router()` call
- Add CORS configuration for Keycloak domain (if needed)

**New files needed**:
- Create `backend/app/keycloak/` module for OIDC integration

**Impact**: Minor changes, ~5 lines

---

### 1.12 Database Migration Requirements

**Current schema**:
```sql
CREATE TABLE users (
  user_id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,     -- ← REMOVE
  full_name VARCHAR(255),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE refresh_tokens (                -- ← REMOVE ENTIRE TABLE
  token_id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP,
  created_at TIMESTAMP
);
```

**Migration `003_keycloak_auth.py` needed**:
1. Add `keycloak_id VARCHAR(255) UNIQUE` column to `users`
2. Remove `password_hash` column from `users`
3. Drop `refresh_tokens` table entirely

---

## PART 2: FRONTEND AUTHENTICATION STRUCTURE

### 2.1 Auth Hook/Store (`frontend/src/hooks/useAuth.js`)

**Current State**: 134 lines, Zustand store with hardcoded credentials

**To REPLACE ENTIRELY**:
- Current `VALID_CREDENTIALS` object - DELETE
- Current `login()` method (49 lines) - REPLACE with Keycloak redirect
- Current `register()` method (34 lines) - REPLACE with Keycloak signup redirect
- Current `logout()` method (7 lines) - REPLACE with Keycloak logout

**To KEEP**:
- Store structure: `user`, `isAuthenticated`, `isLoading`, `role`, `error`
- `setRole()` method (refactor to map from Keycloak roles)
- localStorage persistence via `persist` middleware

**New methods needed**:
- `handleOAuthCallback(code, state)` - Exchange authorization code for tokens
- `refreshAccessToken()` - Use refresh token with Keycloak
- `setTokens(access_token, id_token, refresh_token)` - Store Keycloak tokens

**Impact**: Replace ~90 lines, keep ~44 lines

---

### 2.2 Login Page (`frontend/src/pages/LoginPage.jsx`)

**Current State**: 167 lines, email/password form

| Element | Action | Rationale |
|---------|--------|-----------|
| Logo/branding (lines 47-56) | KEEP | Maintain brand identity |
| Email/password form (lines 72-142) | **REMOVE** | Use Keycloak login |
| Submit handler (lines 29-44) | REPLACE | Redirect to Keycloak /authorize |
| Error handling (lines 66-70) | KEEP | Handle Keycloak auth errors |

**New structure**:
- Single button: "Login with Keycloak" or "Continue"
- Optional: "Login with Google", "Login with Microsoft" buttons
- Redirect to Keycloak login page on click

**Impact**: Remove 70 lines of form code, add 20 lines of redirect logic

---

### 2.3 Register Page (`frontend/src/pages/RegisterPage.jsx`)

**Current State**: 257 lines, full registration form

**Options**:
1. Redirect to Keycloak self-service registration
2. Show message: "Registration managed by Keycloak"
3. Disable registration entirely (admin-only user creation)

**Decision**: Redirect to Keycloak self-service registration (most user-friendly)

**Changes**:
- Remove form (lines 76-228) - DELETE
- Add redirect button to Keycloak registration
- Keep branding/header

**Impact**: Remove 150+ lines, add 20 lines

---

### 2.4 Admin Login Page (`frontend/src/pages/AdminLoginPage.jsx`)

**Current State**: 154 lines, email/password form

**Changes**:
- Remove form fields (lines 65-134) - DELETE
- Redirect to Keycloak login with admin role requirement
- OR: Keep same Keycloak login, check for admin role after callback

**Decision**: Use same Keycloak login, check admin role after callback (simpler UX)

**Impact**: Remove form (~70 lines), add role check (~15 lines)

---

### 2.5 App Router (`frontend/src/App.jsx`)

**Current State**: 200 lines, routing with auth guards

**Changes**:
- Add `/auth/callback` route (15 lines) - Handle OIDC callback
- Update `ProtectedRoute` component (lines 50-56) - Check Keycloak auth status
- Add token refresh interceptor setup (20 lines)
- Keep role-based route protection logic (map Keycloak roles)

**New methods needed**:
- `handleAuthCallback()` - Exchange code for tokens on callback route
- `setupTokenRefreshInterceptor()` - Refresh token before expiry

**Impact**: Add ~35 lines, refactor ~15 lines

---

### 2.6 Navbar Component (`frontend/src/components/Navbar.jsx`)

**Current State**: 116 lines, uses `useAuthStore()`

**Changes**: Minimal
- `logout()` call will use Keycloak logout instead of clearing state
- Rest of component stays the same (user name, role check)

**Impact**: ~3 lines changed

---

### 2.7 Sidebar Component (`frontend/src/components/Sidebar.jsx`)

**Current State**: 104 lines, uses `useAuthStore()` for role

**Changes**: None needed
- Checks `role` from store - works with Keycloak roles

**Impact**: No changes

---

### 2.8 Mock API (`frontend/src/api/mockApi.js`)

**Current State**: 104 lines

**Changes**:
- Remove `login()` method (12 lines) - No longer needed
- Remove `register()` method (6 lines) - No longer needed
- Keep all other endpoints (challenges, missions, etc.)

**Impact**: Remove 18 lines

---

## PART 3: DEPENDENCIES & CONFIGURATION

### Backend Dependencies (`requirements.txt`)

**To REMOVE**:
```
PyJWT==2.8.0          # JWT library
bcrypt==4.1.2         # Password hashing
```

**To ADD**:
```
python-keycloak>=3.0  # Keycloak SDK
```

**To KEEP** (unchanged):
```
fastapi==0.104.1
uvicorn==0.24.0
sqlalchemy==2.0.23
alembic==1.12.1
pydantic==2.7.4
psycopg2-binary==2.9.9
python-dotenv==1.0.0
```

---

### Frontend Dependencies (`package.json`)

**To ADD** (optional, depends on implementation):
```json
"keycloak-js": "^24.0.0"  // Keycloak OIDC SDK
```

**To KEEP** (unchanged):
```
zustand
react-router-dom
axios
(all others)
```

---

## PART 4: DATABASE MIGRATIONS