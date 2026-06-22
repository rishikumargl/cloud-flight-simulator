# Frontend-Backend Authentication Integration Analysis

**Date**: 2026-06-22  
**Status**: ANALYSIS ONLY — No code changes made  
**Purpose**: Complete integration analysis before implementation

---

## 1. CURRENT BACKEND AUTHENTICATION

### Backend Architecture

**Type**: FastAPI + PostgreSQL + JWT  
**Auth Mechanism**: JWT with refresh token rotation  
**Location**: `backend/app/auth/`

### Endpoint Specifications

#### 1.1 POST /auth/register

| Aspect | Detail |
|--------|--------|
| **HTTP Method** | POST |
| **URL** | `http://localhost:8000/auth/register` |
| **Request Body** | `{"email": "user@example.com", "password": "secure_password_123", "full_name": "John Doe"}` |
| **Response Body (201)** | `{"user_id": "uuid", "email": "...", "full_name": "...", "created_at": "...", "updated_at": "..."}` |
| **Error 400** | `{"detail": "Email {email} is already registered"}` |
| **Error 422** | `{"detail": "Field validation failed"}` |
| **Request Schema** | `RegisterRequest(email: EmailStr, password: str (min 8 chars), full_name: str)` |
| **Response Schema** | `UserResponse(user_id: UUID, email: str, full_name: str, created_at: datetime, updated_at: datetime)` |

#### 1.2 POST /auth/login

| Aspect | Detail |
|--------|--------|
| **HTTP Method** | POST |
| **URL** | `http://localhost:8000/auth/login` |
| **Request Body** | `{"email": "user@example.com", "password": "secure_password_123"}` |
| **Response Body (200)** | `{"access_token": "eyJ...", "refresh_token": "eyJ...", "token_type": "bearer"}` |
| **Error 401** | `{"detail": "Invalid email or password"}` |
| **Error 422** | `{"detail": "Field validation failed"}` |
| **Request Schema** | `LoginRequest(email: EmailStr, password: str)` |
| **Response Schema** | `TokenResponse(access_token: str, refresh_token: str, token_type: str = "bearer")` |

#### 1.3 POST /auth/refresh

| Aspect | Detail |
|--------|--------|
| **HTTP Method** | POST |
| **URL** | `http://localhost:8000/auth/refresh` |
| **Request Body** | `{"refresh_token": "eyJ..."}` |
| **Response Body (200)** | `{"access_token": "eyJ...", "refresh_token": "eyJ...", "token_type": "bearer"}` |
| **Error 401** | `{"detail": "Refresh token not found or revoked"}` or `"Refresh token expired"` |
| **Error 422** | `{"detail": "Missing 'refresh_token' in request body"}` |
| **Note** | Old token deleted, new token created (token rotation) |

#### 1.4 POST /auth/logout

| Aspect | Detail |
|--------|--------|
| **HTTP Method** | POST |
| **URL** | `http://localhost:8000/auth/logout` |
| **Auth Required** | YES — Bearer token in Authorization header |
| **Request Body** | (empty, Authorization header required) |
| **Response Body (204)** | (empty) |
| **Error 401** | `{"detail": "Missing authorization header"}` or `"Invalid or expired token"` |
| **Action** | Invalidates ALL refresh tokens for the user |

#### 1.5 GET /auth/me

| Aspect | Detail |
|--------|--------|
| **HTTP Method** | GET |
| **URL** | `http://localhost:8000/auth/me` |
| **Auth Required** | YES — Bearer token in Authorization header |
| **Request Body** | (none) |
| **Response Body (200)** | `{"user_id": "uuid", "email": "...", "full_name": "...", "created_at": "...", "updated_at": "..."}` |
| **Error 401** | `{"detail": "Missing authorization header"}` or `"Invalid or expired token"` |

### Token Details

**Access Token**:
- Type: JWT (HS256)
- Expiry: 60 minutes
- Payload: `{"sub": "user_id", "exp": timestamp, "type": "access"}`
- Usage: Authorization: Bearer {token}

**Refresh Token**:
- Type: JWT (HS256)
- Expiry: 7 days
- Payload: `{"sub": "user_id", "exp": timestamp, "type": "refresh"}`
- Storage: Hash stored in PostgreSQL `refresh_tokens` table
- Rotation: Old hash deleted on use, new token issued

### Backend Database

**Tables**:
- `users` — user accounts
- `refresh_tokens` — refresh token hashes (for revocation tracking)

**User Fields**:
- user_id (UUID PK)
- email (VARCHAR UNIQUE)
- password_hash (bcrypt)
- full_name (VARCHAR)
- created_at, updated_at (TIMESTAMP)

---

## 2. CURRENT FRONTEND AUTHENTICATION

### Frontend Architecture

**Type**: React + Zustand + Mock API  
**Auth State Manager**: Zustand with localStorage persistence  
**Location**: `frontend/src/hooks/useAuth.js`

### Current Authentication Flow

```
Frontend Auth State (Zustand):
├── user: { id, email, name }
├── isAuthenticated: boolean
├── role: 'user' | 'admin'
├── isLoading: boolean
├── error: string | null
├── login(email, password, role): Promise
├── register(name, email, password): Promise
├── logout(): void
└── setRole(role): void

Storage:
└── localStorage 'auth-storage'
    ├── user
    ├── isAuthenticated
    └── role
```

### Frontend Login/Register Implementation

**Login (Current)**:
- Method: Synchronous mock function with setTimeout
- Request: `{ email, password }`
- Response: Mock user object `{ id, email, name }`
- Role: Parameter passed in login call (user vs admin)
- Response: Does NOT include tokens
- Storage: Only user object in localStorage

**Register (Current)**:
- Method: Synchronous mock function with setTimeout
- Request: `{ name, email, password }`
- Response: Mock user object
- Does NOT auto-login after registration
- Storage: Only user object in localStorage

**Logout (Current)**:
- Action: Clears Zustand state
- Storage: Clears localStorage
- Does NOT call backend logout

### Current API Layer

**File**: `frontend/src/api/mockApi.js`

```javascript
api.login(email, password) → { success, user }
api.register(name, email, password) → { success, user }
// No refresh endpoint
// No logout endpoint
// No /auth/me endpoint
```

### Pages Using Authentication

**Auth Pages**:
- `RoleSelectionPage.jsx` — Choose between user/admin
- `LoginPage.jsx` — Learner login
- `AdminLoginPage.jsx` — Admin login
- `RegisterPage.jsx` — User registration

**Protected Pages** (require user role):
- Dashboard, Challenges, Mission, Workspace, Results, Progress, History, Recommendations

**Protected Pages** (require admin role):
- Admin Dashboard, Learners, Challenges, Analytics, Logs, System, Tracing, Issues, GCP, Insights

### Auth Store Usage

```javascript
// In pages and components:
const { login, register, logout, isLoading, isAuthenticated, role } = useAuthStore();

// Form submission pattern:
try {
  await login(email, password, 'user');
  navigate('/dashboard');
} catch (error) {
  setErrors({ submit: error.message });
}
```

---

## 3. INTEGRATION GAPS

### Gap Analysis Table

| Gap | Frontend Expectation | Backend Reality | Required Change | Risk |
|-----|---------------------|-----------------|-----------------|------|
| **Token Storage** | User object only | Access + Refresh tokens | Create token storage mechanism | MEDIUM |
| **Token Types** | None (mock only) | JWT access + refresh tokens | Implement JWT handling | MEDIUM |
| **Token Refresh** | N/A | Auto-refresh on expiry | Implement auto-refresh interceptor | MEDIUM |
| **Request Format** | Mock function returns user | Actual HTTP requests | Create axios/fetch client | HIGH |
| **Register Flow** | No auto-login | Returns UserResponse | Auto-login after register | LOW |
| **Logout** | Clear state | Call backend logout | Add logout API call | LOW |
| **Role/Admin Auth** | Parameter-based | Only 1 user model in backend | Handle admin role (TBD in backend) | MEDIUM |
| **Auth Header** | N/A | Bearer token required | Add Authorization header to requests | MEDIUM |
| **Error Handling** | Generic error | Specific HTTP error codes | Map error codes to messages | LOW |
| **Password Min Length** | 6 chars in validation | 8 chars required by backend | Update frontend validation | LOW |
| **Current User** | Not available | /auth/me endpoint exists | Add call to get current user | LOW |
| **Email Format** | Basic regex | EmailStr validation | Frontend validation matches | OK |

---

## 4. PROPOSED ARCHITECTURE

### 4.1 API Client Architecture

**New File**: `frontend/src/api/client.js`

```
Purpose: Centralized axios client with:
- Base URL configuration
- Request/response interceptors
- Auto-refresh token flow
- Error handling
- CORS configuration

Features:
- Automatic access token injection
- Auto-refresh on 401
- Token persistence
- Request timeout
```

**New File**: `frontend/src/api/auth.js`

```
Purpose: Authentication API endpoints

Functions:
- register(email, password, fullName)
- login(email, password)
- refresh(refreshToken)
- logout()
- getCurrentUser()

Returns: Actual HTTP responses
```

### 4.2 Token Storage Strategy

**Access Token**:
- Storage: Memory (RAM only)
- Expiry: 60 minutes
- Cleared on: logout or refresh token expires
- Risk: Lost on page refresh (must re-login or use refresh)

**Refresh Token**:
- Storage: httpOnly cookie (RECOMMENDED)
  OR secure localStorage with clear naming
- Expiry: 7 days
- Used for: Getting new access token
- Never sent in Authorization header

**Strategy Decision**: Use localStorage with clear naming to avoid cookie CORS issues during development

### 4.3 Auth Store Modifications

**Keep**:
- User object storage
- Role storage ('user' vs 'admin')
- isAuthenticated, isLoading, error state

**Add**:
- accessToken storage (memory)
- refreshToken storage (localStorage)
- Method: setTokens(access, refresh)
- Method: clearTokens()
- Method: refreshAccessToken()
- Method: auto-login on page load (if tokens exist)

### 4.4 Protected Routes & Interceptors

**New File**: `frontend/src/api/interceptors.js`

```
Request Interceptor:
- Add Authorization header with access token
- Check if token expired
- Auto-refresh if needed

Response Interceptor:
- Handle 401 responses
- Auto-refresh and retry
- Handle 403 (unauthorized role)
- Global error handling
```

### 4.5 Auto-Refresh Flow

```
Flow:
1. Access token expiry: 60 min
2. User requests API → Interceptor checks expiry
3. If within 2 min of expiry → Auto-refresh
4. POST /auth/refresh with refresh token
5. Store new access token
6. Continue original request
7. If refresh fails → Logout, redirect to login
```

### 4.6 Logout Flow

```
Current:
1. Click logout
2. Clear Zustand state
3. Clear localStorage
4. Redirect to /

New:
1. Click logout
2. POST /auth/logout (with access token)
3. Backend invalidates all tokens
4. Clear tokens from frontend
5. Clear Zustand state
6. Clear localStorage
7. Redirect to /
```

### 4.7 Registration Flow

```
Current:
1. Fill form
2. Click register
3. Store user in state
4. Redirect to dashboard (NOT authenticated)

New:
1. Fill form
2. Click register
3. POST /auth/register → UserResponse
4. Show success message
5. Redirect to login (user must login)

OR (alternative, not recommended):
1-3. Same as above
4. Automatically login with provided credentials
5. Store tokens
6. Redirect to dashboard
```

---

## 5. FILES TO CREATE

### New Files Required

1. **`frontend/src/api/client.js`** (~80 lines)
   - Axios instance with interceptors
   - Base URL from environment
   - Request/response handling
   - Token injection

2. **`frontend/src/api/auth.js`** (~60 lines)
   - API endpoints: register, login, refresh, logout, getCurrentUser
   - Request/response mapping
   - Error handling

3. **`frontend/src/api/interceptors.js`** (~100 lines)
   - Request interceptor (add auth header)
   - Response interceptor (handle 401, auto-refresh)
   - Token expiry checking

4. **`frontend/src/components/ProtectedRoute.jsx`** (~30 lines)
   - Replace inline ProtectedRoute in App.jsx
   - Handle loading state
   - Handle role validation

5. **`frontend/.env.local`** (~5 lines)
   - `VITE_API_BASE_URL=http://localhost:8000`
   - Add to .gitignore

6. **`frontend/.env.example`** (~5 lines)
   - Template for environment variables

---

## 6. FILES TO MODIFY

### Existing Files Requiring Changes

1. **`frontend/src/hooks/useAuth.js`** (~150 → 180 lines)
   - Add token storage methods
   - Add refreshAccessToken method
   - Modify login to store tokens
   - Modify register (decide auto-login or not)
   - Add logout API call
   - Add auto-login on page load
   - Add getCurrentUser method

2. **`frontend/src/App.jsx`** (~5 lines)
   - Extract ProtectedRoute to component
   - Add auth initialization on mount
   - Add token auto-refresh check

3. **`frontend/src/pages/LoginPage.jsx`** (~5 lines)
   - Update error handling for new error format
   - Update password validation (8 min chars)

4. **`frontend/src/pages/AdminLoginPage.jsx`** (~5 lines)
   - Same as LoginPage

5. **`frontend/src/pages/RegisterPage.jsx`** (~10 lines)
   - Update for actual API (no auto-login or with auto-login)
   - Update success flow
   - Update error messages

6. **`frontend/src/api/mockApi.js`** (DEPRECATE or UPDATE)
   - Option 1: Keep for non-auth endpoints
   - Option 2: Replace completely with real API
   - Option 3: Create adapter for gradual migration

7. **`frontend/package.json`** (~2 lines)
   - Add axios if not present: `"axios": "^1.6.0"`

---

## 7. RISKS & BREAKING CHANGES

### High Risk

1. **Token Refresh Logic**
   - Risk: Infinite refresh loops if not implemented correctly
   - Mitigation: Implement retry limit, clear tokens on repeated failures
   - Testing: Test with expired tokens

2. **LocalStorage Token Storage**
   - Risk: XSS vulnerability if tokens exposed
   - Mitigation: Use separate localStorage keys, httpOnly cookies recommended for production
   - Note: httpOnly cookies not available in current development setup

3. **Auto-Refresh Concurrency**
   - Risk: Multiple requests trigger multiple refresh calls
   - Mitigation: Queue requests during refresh
   - Testing: Test concurrent requests with expired token

### Medium Risk

1. **Session Persistence**
   - Current: User object persists on reload
   - New: Tokens might be invalid on reload
   - Mitigation: Auto-refresh on page load if refresh token available

2. **Logout Timing**
   - Current: Instant
   - New: API call required (slight delay)
   - Mitigation: Optimistic UI update

3. **Admin Role Handling**
   - Current: Parameter-based in useAuthStore
   - New: No backend distinction between admin/user
   - Mitigation: TBD based on backend role implementation

### Low Risk

1. **Password Validation**
   - Current: Min 6 chars
   - New: Min 8 chars required by backend
   - Mitigation: Update frontend validation
   - Impact: Users with <8 char passwords must re-register

2. **Error Messages**
   - Current: Generic mock errors
   - New: Specific backend error codes
   - Mitigation: Map error codes to user-friendly messages

3. **Form Submission UX**
   - Current: isLoading from store
   - New: Need to handle async API calls
   - Mitigation: Store already supports isLoading

---

## 8. IMPLEMENTATION PLAN

### Phase 1: Setup (30 minutes)
1. Install dependencies: axios
2. Create `.env.local` with API base URL
3. Create API client with base configuration
4. Add CORS handling

### Phase 2: Core Auth API (45 minutes)
1. Create `frontend/src/api/auth.js`
2. Implement register, login, logout endpoints
3. Implement token refresh endpoint
4. Implement getCurrentUser endpoint
5. Basic error handling

### Phase 3: Interceptors (60 minutes)
1. Create interceptor for request (add auth header)
2. Create interceptor for response (401 handling)
3. Implement auto-refresh logic
4. Add retry mechanism
5. Test with real backend

### Phase 4: Auth Store Updates (60 minutes)
1. Add token storage to Zustand store
2. Modify login to call real API and store tokens
3. Modify register to call real API
4. Add logout API call
5. Add auto-login on page load
6. Add getCurrentUser call on app start

### Phase 5: UI Updates (45 minutes)
1. Update LoginPage for new auth flow
2. Update AdminLoginPage
3. Update RegisterPage
4. Update error handling across auth pages
5. Update password validation rules

### Phase 6: Protected Routes (30 minutes)
1. Extract ProtectedRoute to component
2. Add loading state during auth check
3. Add role-based route protection
4. Update App.jsx with initialization

### Phase 7: Testing & Integration (90 minutes)
1. Test register flow
2. Test login flow
3. Test token refresh
4. Test logout flow
5. Test protected routes
6. Test role-based access
7. Test error scenarios
8. Test session persistence

### Total Estimated Effort: 360 minutes (6 hours)

### Execution Sequence

```
Day 1 (3 hours):
- Phase 1: Setup
- Phase 2: Core Auth API
- Phase 3: Interceptors

Day 2 (3 hours):
- Phase 4: Auth Store Updates
- Phase 5: UI Updates
- Phase 6: Protected Routes
- Phase 7: Testing
```

---

## 9. SUMMARY TABLE

| Component | Status | Required Change | Complexity |
|-----------|--------|-----------------|------------|
| **Backend** | ✅ READY | None (Alembic fix only) | N/A |
| **Frontend API Client** | ❌ MISSING | Create axios client | MEDIUM |
| **Auth API Layer** | ⚠️ MOCK | Replace with real endpoints | LOW |
| **Token Storage** | ❌ MISSING | Implement token persistence | MEDIUM |
| **Auto-Refresh** | ❌ MISSING | Implement interceptors | HIGH |
| **Zustand Store** | ✅ EXISTS | Add token methods | LOW |
| **Protected Routes** | ✅ EXISTS | Minor refactoring | LOW |
| **Error Handling** | ⚠️ GENERIC | Map to backend errors | LOW |
| **Logout Flow** | ⚠️ PARTIAL | Add API call | LOW |
| **Admin Auth** | ❌ UNDEFINED | TBD (no backend distinction) | MEDIUM |

---

## 10. PREREQUISITES BEFORE IMPLEMENTATION

### Backend Requirements Met
- ✅ Authentication router implemented
- ✅ JWT tokens functional
- ✅ Refresh token rotation working
- ✅ Logout invalidates tokens
- ✅ /auth/me endpoint available

### Environment Requirements
- ✅ Backend running at `http://localhost:8000`
- ✅ PostgreSQL configured
- ✅ Database migrations applied
- ✅ Frontend dev server running (separate from backend)

### Frontend Requirements
- ✅ React + Vite setup
- ✅ Zustand installed
- ✅ React Router configured
- ❓ Axios not installed (must add)
- ❓ CORS proxy configured (if needed)

### Dependency Installation

```bash
cd frontend
npm install axios@^1.6.0
```

---

## CONCLUSION

The authentication integration is **feasible and straightforward**. Backend implementation is production-ready. Frontend requires:

1. HTTP client setup (axios)
2. API endpoint layer
3. Interceptor middleware for token management
4. Zustand store enhancements
5. UI component updates

**Estimated implementation time**: 6 hours  
**Risk level**: LOW-MEDIUM (auto-refresh complexity is main risk)  
**Breaking changes**: Minor (password validation, logout async)

All analysis complete. Ready for implementation phase planning.

---

## NEXT STEPS

1. ✅ ANALYSIS COMPLETE — This document
2. ⏳ PLANNING — Detailed implementation steps
3. ⏳ IMPLEMENTATION — Code changes per phases
4. ⏳ TESTING — Integration testing
5. ⏳ DEPLOYMENT — Frontend/backend coordination

**DO NOT PROCEED WITH CODE CHANGES UNTIL ANALYSIS APPROVED**
