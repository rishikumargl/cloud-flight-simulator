# Phase 1 Implementation Plan: Keycloak OIDC Migration

**Date**: 2026-06-22  
**Status**: IMPLEMENTATION AUTHORIZED  
**Scope**: Minimum viable production path (login → protected routes)  
**Timeline**: 7 working days  
**Owner**: P2 (backend), P1 (frontend), DevOps (Keycloak setup)

---

## IMPLEMENTATION PHASES

### Phase 0: Keycloak Deployment (Day 1)

**Owner**: DevOps + P2  
**Duration**: 2-4 hours

**Tasks**:
1. Deploy Keycloak server (Docker or managed service)
2. Create realm: `cloud-flight-simulator`
3. Create frontend client: `cloud-flight-simulator-web` (public, PKCE enabled)
4. Create backend client: `cloud-flight-simulator-backend` (confidential)
5. Create realm roles: learner, admin, platform_admin
6. Create test users (learner, admin)
7. Configure redirect URIs and CORS
8. Document all configuration in KEYCLOAK_SETUP.md
9. Test OIDC discovery endpoint (`.well-known/openid-configuration`)
10. Test JWKS endpoint

**Verification**:
```bash
curl https://localhost:8081/auth/realms/cloud-flight-simulator/.well-known/openid-configuration
curl https://localhost:8081/auth/realms/cloud-flight-simulator/protocol/openid-connect/certs
```

**Deliverable**: KEYCLOAK_SETUP.md (10-minute startup guide)

---

### Phase 1: Backend Implementation (Days 2-4)

**Owner**: P2  
**Duration**: 3 days  
**Parallel**: Can work alongside Phase 2 (frontend)

#### Step 1.1: Create Keycloak Configuration Module (2 hours)

**Files**:
- `backend/app/keycloak/config.py` (NEW)
- `backend/app/config.py` (MODIFY - add env vars)

**Tasks**:
1. Add environment variables:
   - `KEYCLOAK_URL`
   - `KEYCLOAK_REALM`
   - `KEYCLOAK_CLIENT_ID`
   - `KEYCLOAK_CLIENT_SECRET`
2. Create keycloak config class
3. Add to main config.py

**Code**:
```python
# backend/app/keycloak/config.py
import os
from pydantic import BaseSettings

class KeycloakConfig(BaseSettings):
    url: str = os.getenv("KEYCLOAK_URL", "http://localhost:8081")
    realm: str = os.getenv("KEYCLOAK_REALM", "cloud-flight-simulator")
    client_id: str = os.getenv("KEYCLOAK_CLIENT_ID", "cloud-flight-simulator-backend")
    client_secret: str = os.getenv("KEYCLOAK_CLIENT_SECRET", "")
    
    @property
    def jwks_url(self) -> str:
        return f"{self.url}/auth/realms/{self.realm}/.well-known/openid-configuration"
    
    @property
    def issuer(self) -> str:
        return f"{self.url}/auth/realms/{self.realm}"

keycloak_config = KeycloakConfig()
```

---

#### Step 1.2: JWKS Fetching and Caching (3 hours)

**Files**:
- `backend/app/keycloak/jwks.py` (NEW)

**Tasks**:
1. Implement JWKSCache class with:
   - Async fetch from Keycloak JWKS endpoint
   - 24-hour cache TTL
   - Automatic refresh on cache miss
   - Graceful fallback to stale cache
2. Use aiohttp for async HTTP
3. Add error handling

**Code Outline**:
```python
# backend/app/keycloak/jwks.py
from datetime import datetime, timedelta
from typing import Optional
import aiohttp

class JWKSCache:
    def __init__(self, keycloak_url: str, realm: str):
        self.jwks_url = f"{keycloak_url}/auth/realms/{realm}/protocol/openid-connect/certs"
        self.cache = {}
        self.cache_time: Optional[datetime] = None
        self.cache_ttl = timedelta(hours=24)
    
    async def get_keys(self, force_refresh: bool = False):
        # Implementation per JWT_VALIDATION_DESIGN.md
        pass
    
    async def fetch_jwks(self):
        async with aiohttp.ClientSession() as session:
            async with session.get(self.jwks_url, timeout=5) as resp:
                return await resp.json()

jwks_cache = JWKSCache(...)
```

---

#### Step 1.3: JWT Validation (4 hours)

**Files**:
- `backend/app/keycloak/validation.py` (NEW)

**Tasks**:
1. Implement JWT validation pipeline:
   - Extract token from Authorization header
   - Decode header to get kid
   - Get public key from JWKS cache
   - Validate signature (RS256)
   - Verify issuer, audience, expiration
   - Verify required claims
2. Use python-jose for JWT handling
3. Return claims dict

**Code Outline**:
```python
# backend/app/keycloak/validation.py
from jose import jwt, JWTError

async def validate_keycloak_jwt(token: str, config: KeycloakConfig) -> dict:
    """Validate Keycloak JWT and return claims"""
    try:
        # Get JWKS
        keys = await jwks_cache.get_keys()
        
        # Get kid from header
        header = jwt.get_unverified_header(token)
        kid = header.get('kid')
        
        # Find public key
        key = next((k for k in keys if k.get('kid') == kid), None)
        if not key:
            raise JWTError("Key ID not found")
        
        # Validate and decode
        claims = jwt.decode(
            token,
            key,
            algorithms=['RS256'],
            audience=config.client_id,
            issuer=config.issuer,
            options={
                "verify_signature": True,
                "verify_aud": True,
                "verify_iss": True,
                "verify_exp": True
            }
        )
        return claims
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid JWT: {str(e)}")
```

---

#### Step 1.4: Update get_current_user Dependency (4 hours)

**Files**:
- `backend/app/dependencies/auth.py` (REFACTOR)

**Tasks**:
1. Replace JWT validation logic with Keycloak validation
2. Add user provisioning on first login:
   - Query users by keycloak_id
   - Create if not found
   - Update last_login_at if found
3. Return UserSchema
4. Keep function signature identical

**Current Behavior**:
```python
def get_current_user(token: str = Depends(...)) -> UserSchema:
    # Validate app-issued JWT
    # Return user from DB
```

**New Behavior**:
```python
async def get_current_user(authorization: str = Header(...)) -> UserSchema:
    # Extract token from header
    # Validate against Keycloak JWKS
    # Lookup/create local user
    # Return UserSchema
```

---

#### Step 1.5: Refactor /auth/me Endpoint (1 hour)

**Files**:
- `backend/app/auth/router.py` (MODIFY)

**Tasks**:
1. Update GET /auth/me to use new get_current_user
2. Return UserSchema (unchanged signature)
3. No user creation in route handler (done in dependency)

**Code**:
```python
@router.get("/auth/me")
async def get_current_user_endpoint(
    current_user: UserSchema = Depends(get_current_user)
) -> UserResponse:
    return {
        "success": True,
        "data": current_user
    }
```

---

#### Step 1.6: Refactor /auth/logout Endpoint (1 hour)

**Files**:
- `backend/app/auth/router.py` (MODIFY)

**Tasks**:
1. Update POST /auth/logout to accept Keycloak JWT
2. Write audit event (USER_LOGOUT)
3. Return 204 No Content

**Code**:
```python
@router.post("/auth/logout")
async def logout(
    current_user: UserSchema = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    audit_service.write_event(
        db=db,
        event_type="USER_LOGOUT",
        source="AUTH_SERVICE",
        user_id=str(current_user.user_id)
    )
    return Response(status_code=204)
```

---

#### Step 1.7: Remove Old JWT Logic (2 hours)

**Files**:
- `backend/app/auth/security.py` (DELETE)
- `backend/app/auth/service.py` (DELETE or REFACTOR)
- `backend/app/auth/router.py` (REMOVE endpoints)

**Tasks**:
1. Delete POST /auth/register endpoint
2. Delete POST /auth/login endpoint
3. Delete POST /auth/refresh endpoint
4. Delete security.py file
5. Delete or empty service.py file
6. Remove bcrypt and PyJWT imports

---

#### Step 1.8: Add Environment Variables (30 min)

**Files**:
- `.env.example` (MODIFY)
- `.env.local` (CREATE for local dev)

**Variables**:
```
KEYCLOAK_URL=http://localhost:8081
KEYCLOAK_REALM=cloud-flight-simulator
KEYCLOAK_CLIENT_ID=cloud-flight-simulator-backend
KEYCLOAK_CLIENT_SECRET=dev-secret
```

---

#### Step 1.9: Database Migration Phase A (2 hours)

**Files**:
- `backend/migrations/versions/003_keycloak_migration_phase_a.py` (CREATE)

**Tasks**:
1. Create Alembic migration to:
   - Add keycloak_id column (nullable)
   - Add last_login_at column
   - Add unique index on keycloak_id
   - Drop idx_users_role index
   - Drop role column
   - Drop password_hash column
2. DO NOT make keycloak_id NOT NULL (Phase B only)
3. DO NOT drop refresh_tokens table yet (Phase B only)

---

#### Step 1.10: Update Dependencies (1 hour)

**Files**:
- `backend/requirements.txt` (MODIFY)

**Changes**:
- Remove: PyJWT, bcrypt
- Add: python-keycloak, python-jose[cryptography], aiohttp

---

**Phase 1 Backend Status**: All core backend pieces to validate Keycloak JWTs and provision users

---

### Phase 2: Frontend Implementation (Days 2-4)

**Owner**: P1  
**Duration**: 3 days  
**Parallel**: Can work alongside Phase 1

#### Step 2.1: Add keycloak-js Dependency (30 min)

**Files**:
- `frontend/package.json` (MODIFY)

**Tasks**:
1. Add `"keycloak-js": "^24.0.0"`
2. Run `npm install`

---

#### Step 2.2: Create Keycloak Config (1 hour)

**Files**:
- `frontend/src/config/keycloak.js` (CREATE)

**Tasks**:
1. Initialize Keycloak instance
2. Read config from environment variables
3. Export singleton instance

**Code**:
```javascript
import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: process.env.REACT_APP_KEYCLOAK_URL || 'http://localhost:8081',
  realm: process.env.REACT_APP_KEYCLOAK_REALM || 'cloud-flight-simulator',
  clientId: process.env.REACT_APP_KEYCLOAK_CLIENT_ID || 'cloud-flight-simulator-web'
});

export default keycloak;
```

---

#### Step 2.3: Refactor useAuth Hook (3 hours)

**Files**:
- `frontend/src/hooks/useAuth.js` (MAJOR REFACTOR)

**Tasks**:
1. Remove mock login/register logic
2. Replace with Keycloak integration
3. Store tokens from keycloak-js
4. Add logout function (calls keycloak.logout())
5. Extract role from JWT claims
6. Keep Zustand store structure

**Core Changes**:
```javascript
const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  role: null,
  
  initializeAuth: async () => {
    const authenticated = await keycloak.init({
      onLoad: 'login-required',
      checkLoginIframe: false
    });
    
    if (authenticated) {
      const response = await fetch('/auth/me', {
        headers: { Authorization: `Bearer ${keycloak.token}` }
      });
      const data = await response.json();
      
      set({
        user: data.data,
        isAuthenticated: true,
        role: data.data.role
      });
    }
  },
  
  logout: async () => {
    await keycloak.logout();
    set({ user: null, isAuthenticated: false, role: null });
  }
}));
```

---

#### Step 2.4: Update LoginPage (2 hours)

**Files**:
- `frontend/src/pages/LoginPage.jsx` (REFACTOR)

**Tasks**:
1. Remove email/password form
2. Add single "Login with Keycloak" button
3. Button calls keycloak.login()
4. Keep branding and layout

**Code**:
```javascript
export default function LoginPage() {
  const handleLogin = () => {
    keycloak.login();
  };
  
  return (
    <div className="login-container">
      <h1>Cloud Flight Simulator</h1>
      <button onClick={handleLogin}>Login with Keycloak</button>
    </div>
  );
}
```

---

#### Step 2.5: Create AuthCallbackPage (2 hours)

**Files**:
- `frontend/src/pages/AuthCallbackPage.jsx` (CREATE)

**Tasks**:
1. Handle OIDC callback
2. Call /auth/me to provision user
3. Store user in Zustand
4. Redirect to dashboard

**Code**:
```javascript
export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const { initializeAuth } = useAuthStore();
  
  useEffect(() => {
    initializeAuth().then(() => {
      navigate('/dashboard');
    });
  }, []);
  
  return <div>Authenticating...</div>;
}
```

---

#### Step 2.6: Add /auth/callback Route (1 hour)

**Files**:
- `frontend/src/App.jsx` (MODIFY)

**Tasks**:
1. Add new route: `/auth/callback` → AuthCallbackPage
2. Update router configuration

---

#### Step 2.7: Create Axios Interceptor (2 hours)

**Files**:
- `frontend/src/api/client.js` (CREATE)

**Tasks**:
1. Create axios instance with baseURL
2. Add request interceptor to inject Authorization header
3. Add response interceptor for 401 handling (optional for Phase 1)
4. Use keycloak.token for Authorization header

**Code**:
```javascript
import axios from 'axios';
import keycloak from '../config/keycloak';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000'
});

api.interceptors.request.use((config) => {
  if (keycloak.token) {
    config.headers.Authorization = `Bearer ${keycloak.token}`;
  }
  return config;
});

export default api;
```

---

#### Step 2.8: Update Protected Routes (1 hour)

**Files**:
- `frontend/src/App.jsx` (MODIFY)

**Tasks**:
1. Update ProtectedRoute to check isAuthenticated from Zustand
2. Check role for role-based routes
3. Remove mock login redirect

---

#### Step 2.9: Add Environment Variables (30 min)

**Files**:
- `frontend/.env.example` (CREATE)
- `frontend/.env.local` (CREATE)

**Variables**:
```
REACT_APP_KEYCLOAK_URL=http://localhost:8081
REACT_APP_KEYCLOAK_REALM=cloud-flight-simulator
REACT_APP_KEYCLOAK_CLIENT_ID=cloud-flight-simulator-web
REACT_APP_API_URL=http://localhost:8000
```

---

**Phase 2 Frontend Status**: Users can log in through Keycloak and access protected routes

---

### Phase 3: Keycloak Setup Documentation (2 hours)

**Owner**: DevOps + P2

**Files**:
- `KEYCLOAK_SETUP.md` (CREATE)

**Contents**:
1. Prerequisites (Docker or managed service)
2. Docker command to start Keycloak
3. Step-by-step realm creation
4. Step-by-step client configuration
5. Role creation steps
6. Test user creation
7. Configuration verification (curl commands)
8. Troubleshooting
9. Accessing admin console

**Target**: New developer can start Keycloak in under 10 minutes

---

### Phase 4: Testing (1 day)

**Owner**: P1 + P2  
**Duration**: 1 day

#### Backend Tests:
1. JWT validation (valid token)
2. JWT validation (invalid signature)
3. JWT validation (expired token)
4. First login creates user
5. Returning login updates last_login_at
6. /auth/me returns UserSchema
7. /auth/logout writes audit event
8. Protected routes require JWT
9. JWKS cache refresh on miss

#### Frontend Tests:
1. Login button redirects to Keycloak
2. Callback page provisions user
3. Dashboard accessible after login
4. Logout clears state
5. Page refresh maintains session (via cookie or re-auth)
6. Protected routes redirect to login if not authenticated
7. Authorization header sent with requests

---

### Phase 5: Deployment & Verification (1 day)

**Owner**: DevOps + P2 + P1  
**Duration**: 1 day

**Checklist**:
1. Keycloak deployed and accessible
2. Backend deployed with new code
3. Frontend deployed with keycloak-js
4. CORS configured for both dev and prod URLs
5. Environment variables set correctly
6. Health check passes
7. User can complete full login flow
8. User can access dashboard
9. User can access protected endpoints
10. Audit events logged correctly
11. Role-based access control verified

---

## PARALLEL EXECUTION STRATEGY

**Days 2-4**: Run Phase 1 (backend) and Phase 2 (frontend) **in parallel**

**Coordination points**:
- Day 2, 10am: Keycloak deployed, both teams proceed independently
- Day 3, 3pm: Sync on API contracts (get_current_user, /auth/me signature)
- Day 4, 5pm: Integration testing begins

---

## SCOPE CONSTRAINTS

### DO IMPLEMENT:
✅ Generic OIDC flow (Authorization Code + PKCE)  
✅ Keycloak JWT validation  
✅ First-login user provisioning  
✅ Role extraction from JWT  
✅ Protected route guards  
✅ Logout audit events  
✅ HttpOnly cookie token storage (production)  
✅ Memory-only token storage (development)  

### DO NOT IMPLEMENT (Post-Phase 1):
❌ Google OAuth integration (Phase 2)  
❌ Microsoft Azure AD integration (Phase 2)  
❌ Advanced session management (Phase 2)  
❌ Refresh token rotation (Phase 2)  
❌ Database migration Phase B (Phase 2)  
❌ Admin endpoints (Phase 2)  
❌ Admin dashboard (Phase 2)  
❌ Advanced role-based features (Phase 2)  

---

## SUCCESS CRITERIA

**Phase 1 Complete When**:
1. ✅ User logs in via Keycloak (email/password)
2. ✅ Frontend receives access token from Keycloak
3. ✅ Frontend calls /auth/me with access token
4. ✅ Backend validates token and provisions user
5. ✅ User can access dashboard
6. ✅ User can access protected endpoints (challenges, progress, etc.)
7. ✅ Role-based access control works (learner vs. admin)
8. ✅ Logout works and writes audit event
9. ✅ All tests pass
10. ✅ No breaking changes to frozen routes or contracts

---

## KNOWN LIMITATIONS (Phase 1)

- No multi-provider login (only Keycloak native email/password)
- No advanced session management features
- No automatic token refresh (page refresh requires re-login in dev)
- No offline access
- No user self-service password reset (through Keycloak admin console only)
- No admin endpoints (admin features managed through Keycloak console)

**All limitations to be addressed in Phase 2+**

---

## TIMELINE SUMMARY

| Phase | Duration | Owner | Deliverable |
|-------|----------|-------|-------------|
| Phase 0: Keycloak Deploy | 0.5 days | DevOps | KEYCLOAK_SETUP.md |
| Phase 1: Backend | 3 days | P2 | Working JWT validation |
| Phase 2: Frontend | 3 days | P1 | Working Keycloak login |
| Phase 3: Documentation | 0.5 days | DevOps | KEYCLOAK_SETUP.md |
| Phase 4: Testing | 1 day | P1+P2 | All tests pass |
| Phase 5: Deployment | 1 day | All | Live in all environments |
| **Total** | **~7 days** | Team | **Production Keycloak Auth** |

---

## STATUS

✅ Plan complete  
✅ All tasks identified  
✅ Owners assigned  
✅ Timelines estimated  
✅ Success criteria defined  

**Ready for implementation**
