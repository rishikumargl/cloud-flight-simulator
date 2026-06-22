# Keycloak Authentication Migration Architecture

**Date**: 2026-06-22  
**Status**: ARCHITECTURE & MIGRATION DESIGN ONLY  
**Scope**: Replace JWT auth with Keycloak + multi-provider OIDC

---

## 1. KEYCLOAK DEPLOYMENT MODEL

### Recommendation: **Separate Service** (Production-Grade)

#### Deployment Model Comparison

| Model | Dev | Staging | Production | Recommendation |
|-------|-----|---------|------------|-----------------|
| Local Docker | ✅ BEST | ❌ NO | ❌ NO | Dev/testing only |
| Separate Service | ✅ GOOD | ✅ YES | ✅ BEST | All environments |
| Embedded Java | ❌ COMPLEX | ❌ NO | ❌ NO | Not viable |

### Chosen: **Separate Keycloak Service**

**Rationale**:
- Keycloak is enterprise IAM service, not part of app
- Can scale independently
- Can be managed/operated separately
- Supports distributed deployments
- Can handle identity federation across multiple apps
- Managed services available (AWS Cognito alternative)

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      React Frontend                         │
│                   (Vite + Zustand)                          │
└──────────────┬──────────────────────────────────────────────┘
               │
               ├─── Direct OIDC Communication ───────────────┐
               │                                             │
┌──────────────▼──────────────┐                  ┌──────────▼──────────────┐
│   FastAPI Backend           │                  │  Keycloak Service       │
│   (JWT validation)          │                  │  (OIDC Provider)        │
│                             │                  │                         │
│ • /auth/me                  │                  │ • /realms/master        │
│ • /auth/logout              │  Validate JWT    │ • /protocol/openid-     │
│ • /auth/callback            │◄────────────────►│   connect/*              │
│ • API endpoints             │ against pub key  │ • Google OAuth           │
└─────────────┬───────────────┘                  │ • Microsoft OAuth        │
              │                                  │ • Realm users            │
              │                                  │ • Roles & groups         │
              └──────────────────────────────────┴─────────────────────────┘
                       PostgreSQL (separate DB for each)
```

### Deployment Details

**Development**:
```bash
docker run -d \
  --name keycloak \
  -e KEYCLOAK_ADMIN=admin \
  -e KEYCLOAK_ADMIN_PASSWORD=admin \
  -p 8080:8080 \
  quay.io/keycloak/keycloak:latest \
  start-dev

# Accessible at: http://localhost:8080
# Admin console: http://localhost:8080/admin
```

**Staging/Production**:
- Kubernetes deployment
- External PostgreSQL
- SSL/TLS enabled
- High availability setup
- Separate from application stack

---

## 2. BACKEND CHANGES REQUIRED

### Current Backend Endpoints (JWT-based)

```
POST   /auth/register       ✅ WORKS (local user creation)
POST   /auth/login          ✅ WORKS (email/password validation)
POST   /auth/refresh        ✅ WORKS (token refresh)
POST   /auth/logout         ✅ WORKS (token revocation)
GET    /auth/me             ✅ WORKS (user info from JWT)
```

### Keycloak-Era Endpoints

#### Endpoints That Disappear

```
POST   /auth/register    ❌ REMOVE
  Reason: Keycloak handles user creation
  
POST   /auth/login       ❌ REMOVE (or repurpose)
  Reason: Frontend redirects to Keycloak, not direct login
  Alternative: Could keep for backward compatibility
```

#### Endpoints That Remain (Modified)

```
POST   /auth/logout      ✅ KEEP (modified)
  New behavior: Call Keycloak revocation endpoint
  
GET    /auth/me          ✅ KEEP (modified)
  New behavior: Extract user from Keycloak JWT claim
  
POST   /auth/refresh     ⚠️  MODIFIED
  New behavior: Use Keycloak refresh token
  OR: Keycloak handles refresh (frontend calls Keycloak directly)
```

#### New Endpoints Required

```
POST   /auth/callback
  Purpose: OIDC callback handler
  Input: { code, state } (from Keycloak redirect)
  Process: 
    1. Exchange code for Keycloak JWT
    2. Create/update user in local DB
    3. Issue app JWT (or use Keycloak JWT directly)
    4. Return tokens to frontend
  Response: { access_token, refresh_token, token_type }

POST   /auth/token-exchange
  Purpose: Exchange Keycloak JWT for app JWT
  Input: { keycloak_token }
  Output: { access_token, refresh_token, token_type }
  OR: Skip this if using Keycloak JWT directly

GET    /auth/login/google
  Purpose: Redirect to Keycloak Google login
  Output: Redirect to Keycloak /authorize endpoint

GET    /auth/login/microsoft
  Purpose: Redirect to Keycloak Microsoft login
  Output: Redirect to Keycloak /authorize endpoint

POST   /auth/validate
  Purpose: Validate Keycloak JWT
  Input: { token }
  Output: { valid: boolean, user: {...} }
  Used by: Internal validation, can be used by frontend
```

### New Backend Architecture

```python
# Current: app/auth/router.py handles all auth
# New: Multiple auth handlers

app/auth/router.py
├── /auth/logout          (calls Keycloak revocation)
├── /auth/me              (extracts from Keycloak JWT)
├── /auth/callback        (OIDC callback handler)
├── /auth/login/*         (redirects to Keycloak)
└── /auth/token-exchange  (Keycloak JWT → app JWT)

app/auth/keycloak.py      (NEW)
├── validate_keycloak_jwt()
├── get_user_from_keycloak()
├── exchange_code_for_token()
└── call_keycloak_logout()

app/keycloak/client.py    (NEW)
├── KeycloakClient class
├── _get_public_key()     (cache Keycloak's public key)
├── _verify_jwt_signature()
└── _exchange_code()
```

### JWT Validation Strategy

**Option A: Validate Keycloak JWT Directly (RECOMMENDED)**
```
Frontend → Keycloak
  ↓ (gets JWT)
Frontend sends JWT to FastAPI
FastAPI validates JWT signature using Keycloak's public key
FastAPI extracts user_id from JWT claim "sub"
FastAPI returns user data from DB or Keycloak
```

**Option B: Issue App JWT from Keycloak JWT**
```
Frontend → Keycloak (gets JWT)
  ↓
Frontend → FastAPI /auth/callback (exchange Keycloak JWT for app JWT)
  ↓
FastAPI validates Keycloak JWT
FastAPI creates app JWT with user info
Frontend stores app JWT
Frontend uses app JWT for API calls
```

**Recommendation**: Option A (Validate Keycloak JWT Directly)
- Simpler flow
- No double-JWT complexity
- Keycloak is single source of truth
- Reduced token exchange overhead

---

## 3. DATABASE SCHEMA CHANGES

### Current users Table

```sql
CREATE TABLE users (
  user_id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,  -- ❌ REMOVE
  full_name VARCHAR(255),
  created_at TIMESTAMP WITH TIMEZONE,
  updated_at TIMESTAMP WITH TIMEZONE
);
```

### New users Table (Keycloak-era)

```sql
ALTER TABLE users ADD COLUMN (
  keycloak_id UUID UNIQUE,          -- NEW: Keycloak subject (sub)
  identity_provider VARCHAR(50),    -- NEW: 'keycloak', 'google', 'microsoft'
  provider_user_id VARCHAR(255),    -- NEW: Provider's unique user ID
  email_verified BOOLEAN DEFAULT FALSE,
  last_login TIMESTAMP WITH TIMEZONE
);

-- Drop password requirement (use Keycloak for auth)
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
```

### New Tables Required

```sql
-- Map multiple identity providers to single user
CREATE TABLE user_identities (
  id UUID PRIMARY KEY,
  user_id UUID FOREIGN KEY (users.user_id),
  provider VARCHAR(50) NOT NULL,  -- 'google', 'microsoft', 'keycloak'
  provider_user_id VARCHAR(255) NOT NULL,  -- External provider's ID
  email VARCHAR(255),
  display_name VARCHAR(255),
  picture_url TEXT,
  created_at TIMESTAMP WITH TIMEZONE,
  UNIQUE(provider, provider_user_id)
);

-- Store Keycloak token metadata (optional, for advanced use cases)
CREATE TABLE keycloak_tokens (
  id UUID PRIMARY KEY,
  user_id UUID FOREIGN KEY (users.user_id),
  access_token_jti VARCHAR(255),    -- JWT ID for revocation
  issued_at TIMESTAMP WITH TIMEZONE,
  expires_at TIMESTAMP WITH TIMEZONE,
  revoked BOOLEAN DEFAULT FALSE
);

-- Store user roles (from Keycloak)
CREATE TABLE user_roles (
  id UUID PRIMARY KEY,
  user_id UUID FOREIGN KEY (users.user_id),
  role VARCHAR(50) NOT NULL,  -- 'learner', 'admin', 'platform_admin'
  granted_at TIMESTAMP WITH TIMEZONE,
  UNIQUE(user_id, role)
);
```

### Migration Strategy

**Phase 1**: Add new columns to users table (backward compatible)
- existing_users.keycloak_id = NULL (keep as is)
- New Keycloak users: set keycloak_id

**Phase 2**: Create identity mapping tables
- Allows one user to have multiple login methods

**Phase 3**: Populate keycloak_id for existing users
- During Keycloak user import
- Link by email or manual migration

**Phase 4**: Remove password_hash requirement
- After migration complete

---

## 4. FRONTEND CHANGES REQUIRED

### Current Frontend Auth Flow

```
┌──────────────┐
│ LoginPage    │
│              │
│ Email/Pwd ──→ useAuthStore.login()
│              │
│              ↓
│         backend /auth/login
│              │
│              ↓
│         Store JWT + user
│              │
│              ↓
│         Navigate to /dashboard
└──────────────┘
```

### New Frontend Auth Flow (Keycloak + Local Login)

```
┌─────────────────────────────────────────────────────────────┐
│                  LoginPage Component                        │
│                   (React + Zustand)                         │
│                                                             │
│  ┌──────────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │ Email/Pwd Form   │  │ Login with   │  │ Login with  │  │
│  │ (optional, for   │  │ Google       │  │ Microsoft   │  │
│  │ backward         │  │ (OAuth)      │  │ (OAuth)     │  │
│  │ compatibility)   │  │              │  │             │  │
│  └────────┬─────────┘  └────────┬─────┘  └──────┬──────┘  │
│           │                     │                │         │
│           ▼                     ▼                ▼         │
│     /auth/callback         Redirect to        Redirect to│
│     (if kept)              Keycloak           Keycloak    │
│                            /authorize         /authorize  │
└──────┬──────────────────────────┬──────────────┬──────────┘
       │                          │              │
       └──────────────┬───────────┴──────────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │  Keycloak Login Page   │
         │  (Keycloak's UI)       │
         │                        │
         │  • Email/Pwd           │
         │  • Google OAuth        │
         │  • Microsoft OAuth     │
         │  • Realm users         │
         └──────────┬─────────────┘
                    │
                    ▼ (redirect back with code)
         ┌────────────────────────┐
         │ Frontend /callback     │
         │ (URL: /?code=...&state=...)
         └──────────┬─────────────┘
                    │
         ┌──────────▼─────────────┐
         │ keycloak-js exchanges  │
         │ code for JWT           │
         │ (via Keycloak token    │
         │ endpoint)              │
         └──────────┬─────────────┘
                    │
         ┌──────────▼──────────────────┐
         │ Store JWT in Zustand +      │
         │ localStorage (secure)       │
         │                            │
         │ JWT contains:              │
         │ • sub (user_id)            │
         │ • email                    │
         │ • name                     │
         │ • roles: [learner/admin]   │
         └──────────┬───────────────┘
                    │
         ┌──────────▼────────────────┐
         │ Navigate to /dashboard    │
         └───────────────────────────┘
```

### Components Needing Changes

#### 1. Login Page (`pages/LoginPage.jsx`)

**Current**:
- Email/password form
- Calls useAuthStore.login()
- Shows errors from mock

**New**:
- Keep email/password form (optional, backward compat)
- Add "Login with Google" button → redirects to Keycloak
- Add "Login with Microsoft" button → redirects to Keycloak
- Show OAuth provider logos
- Handle Keycloak callback errors

#### 2. useAuthStore Hook (`hooks/useAuth.js`)

**Current**:
- login(email, password)
- register(name, email, password)
- logout()
- store: user, tokens, role

**New**:
- login(email, password) → optional, if backward compat needed
- loginWithGoogle() → redirects to Keycloak
- loginWithMicrosoft() → redirects to Keycloak
- handleOAuthCallback(code, state) → new
- logout() → calls Keycloak logout
- getAccessToken() → returns Keycloak JWT
- isTokenExpired() → checks JWT expiry
- refreshToken() → calls Keycloak refresh

#### 3. Keycloak Initialization (`hooks/useKeycloak.js`)

**New file** (not required if using keycloak-js library directly)

Handles:
- Keycloak client initialization
- Auto-token refresh
- Token events
- User info from Keycloak

#### 4. Auth Callback Page (`pages/AuthCallbackPage.jsx`)

**New file**

```javascript
// Handle OAuth redirect from Keycloak
// Extract code from URL
// Exchange code for JWT
// Store JWT
// Redirect to /dashboard
```

#### 5. Protected Route Component

**Current**: Checks isAuthenticated

**New**: 
- Checks token expiry
- Auto-refreshes if needed
- Validates token signature locally (optional)

### Frontend Token Storage

**Access Token** (Keycloak JWT):
- Storage: Memory + secure localStorage
- Expiry: 15-30 minutes (Keycloak default)
- Sent with every API call: Authorization: Bearer {token}

**Refresh Token**:
- Storage: httpOnly cookie (preferred) OR localStorage
- Expiry: 7 days
- Used to get new access token
- Never sent with API calls (browser handles automatically if httpOnly)

**User Claims** (from JWT):
- Extract: sub (user_id), email, name, roles
- Store in Zustand
- Use for UI (show user name, check roles)

---

## 5. REACT-KEYCLOAK COMMUNICATION STRATEGY

### Recommendation: **keycloak-js Library + OIDC Code Flow with PKCE**

#### Why keycloak-js?

```
Pros:
✅ Official Keycloak library for JS
✅ Handles OIDC/OAuth automatically
✅ Token refresh built-in
✅ Event listeners (onAuthSuccess, onAuthError, onTokenExpired)
✅ PKCE flow by default (secure)
✅ Can use Keycloak's token endpoint directly
✅ Session management
✅ Logout handling

Cons:
⚠️  Adds dependency
⚠️  Opinionated initialization
```

### OIDC Code Flow with PKCE

**Flow Diagram**:
```
1. Frontend calls keycloak.login()
   ↓
2. Browser redirects to Keycloak /authorize endpoint
   Parameters:
   - client_id
   - redirect_uri (http://localhost:3000/callback)
   - response_type=code
   - scope=openid profile email
   - state=random_string (CSRF protection)
   - code_challenge (PKCE)
   ↓
3. User logs in at Keycloak (email/pwd, Google, Microsoft)
   ↓
4. Keycloak redirects back to redirect_uri with:
   - code=authorization_code
   - state=random_string
   ↓
5. Frontend receives callback
   keycloak-js automatically:
   - Validates state (CSRF)
   - Exchanges code for token using code_verifier (PKCE)
   - Stores JWT in memory + localStorage
   - Redirects to app
   ↓
6. JWT used for API calls
```

### keycloak-js Implementation Points

```javascript
// Initialize in App.jsx before rendering routes
import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: 'http://localhost:8080',
  realm: 'master',
  clientId: 'cloud-flight-simulator'
});

keycloak.init({
  onLoad: 'login-required',  // or 'check-sso'
  silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
  enableLogging: true,
  checkLoginIframe: true
}).then(authenticated => {
  if (authenticated) {
    // User is logged in
    // Store keycloak instance in Zustand
    store.setKeycloak(keycloak);
  }
}).catch(() => {
  // Auth failed, redirect to login
});

// Token refresh automatically handled by keycloak-js
keycloak.onTokenExpired = () => {
  keycloak.refreshToken().then(() => {
    // Token refreshed, update store
  });
};

// Logout
keycloak.logout({
  redirectUri: 'http://localhost:3000'
});
```

### Backend Keycloak Configuration

```json
{
  "realm": "master",
  "enabled": true,
  "clients": [
    {
      "clientId": "cloud-flight-simulator",
      "name": "Cloud Flight Simulator",
      "baseUrl": "http://localhost:3000",
      "redirectUris": [
        "http://localhost:3000/*"
      ],
      "webOrigins": [
        "http://localhost:3000"
      ],
      "publicClient": true,
      "protocol": "openid-connect",
      "accessType": "PUBLIC",
      "standardFlowEnabled": true,
      "implicitFlowEnabled": false,
      "directAccessGrantsEnabled": false,
      "serviceAccountsEnabled": false,
      "consentRequired": false,
      "attributes": {
        "pkce.code.challenge.method": "S256"
      }
    }
  ],
  "identityProviders": [
    {
      "alias": "google",
      "displayName": "Google",
      "providerId": "google",
      "enabled": true,
      "config": {
        "clientId": "YOUR_GOOGLE_CLIENT_ID",
        "clientSecret": "YOUR_GOOGLE_CLIENT_SECRET"
      }
    },
    {
      "alias": "microsoft",
      "displayName": "Microsoft",
      "providerId": "oidc",
      "enabled": true,
      "config": {
        "clientId": "YOUR_AZURE_CLIENT_ID",
        "clientSecret": "YOUR_AZURE_CLIENT_SECRET",
        "discovery_endpoint": "https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration"
      }
    }
  ]
}
```

---

## 6. FASTAPI JWT VALIDATION

### Architecture: Direct Keycloak JWT Validation

```
Frontend JWT (from Keycloak) 
         ↓
POST /api/endpoint
Headers: Authorization: Bearer eyJhbGc...
         ↓
FastAPI get_current_user() dependency
         ↓
Extract JWT from header
         ↓
Get Keycloak public key (cached)
         ↓
Validate JWT signature using public key
         ↓
Check JWT expiry
         ↓
Extract claims (sub, email, roles)
         ↓
Query users table by keycloak_id (sub)
         ↓
Return UserResponse
         ↓
Endpoint handler has authenticated user
```

### Implementation (FastAPI)

```python
# backend/app/keycloak/client.py
class KeycloakClient:
    def __init__(self, server_url: str, realm: str):
        self.server_url = server_url
        self.realm = realm
        self.public_key = None
        self.public_key_cached_at = None
    
    def get_public_key(self) -> str:
        """Get Keycloak's public key (cache for 1 hour)"""
        # Call Keycloak /.well-known/openid-configuration
        # Extract jwks_uri
        # Fetch JWKS
        # Extract public key
        # Cache locally
    
    def validate_token(self, token: str) -> dict:
        """Validate JWT and return claims"""
        # Decode JWT header to get key ID
        # Get public key
        # Validate signature
        # Check expiry
        # Return claims
        # Raise exception if invalid

# backend/app/dependencies/auth.py
async def get_current_user(
    token: str = Depends(HTTPBearer()),
    keycloak: KeycloakClient = Depends(get_keycloak_client)
) -> UserResponse:
    """Extract current user from Keycloak JWT"""
    try:
        claims = keycloak.validate_token(token.credentials)
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))
    
    user_id = UUID(claims['sub'])
    email = claims.get('email')
    name = claims.get('name')
    roles = claims.get('roles', [])
    
    # Find user in local DB by keycloak_id
    user = db.query(User).filter(User.keycloak_id == user_id).first()
    
    if not user:
        # Auto-create user on first login
        user = User(
            keycloak_id=user_id,
            email=email,
            full_name=name,
            identity_provider='keycloak'
        )
        db.add(user)
        db.commit()
    
    return UserResponse.from_orm(user)
```

### Public Key Caching Strategy

```python
# Cache Keycloak's public key locally to avoid repeated calls
# Keycloak public key rarely changes (unless key rotation)

class KeycloakPublicKeyCache:
    def __init__(self, cache_ttl_seconds: int = 3600):
        self.cache_ttl = cache_ttl_seconds
        self.public_key = None
        self.cached_at = None
    
    def get_or_refresh(self, keycloak_url: str) -> str:
        """Get cached key or fetch fresh from Keycloak"""
        now = datetime.utcnow()
        
        if self.public_key and (now - self.cached_at).seconds < self.cache_ttl:
            return self.public_key
        
        # Fetch from Keycloak
        response = requests.get(f"{keycloak_url}/.well-known/openid-configuration")
        config = response.json()
        
        jwks_response = requests.get(config['jwks_uri'])
        jwks = jwks_response.json()
        
        # Extract first RSA key
        self.public_key = jwks['keys'][0]['x5c'][0]
        self.cached_at = now
        
        return self.public_key
```

### OIDC Discovery Endpoint

Keycloak exposes configuration at:
```
GET /.well-known/openid-configuration
```

FastAPI uses this to:
- Get jwks_uri (for public keys)
- Get token_endpoint (for token exchange)
- Get authorization_endpoint (for login redirects)
- Get revocation_endpoint (for logout)

---

## 7. ROLES ARCHITECTURE

### Current Role System

```python
useAuthStore.role: 'user' | 'admin'

Stored in: localStorage
Used for: Route protection (App.jsx ProtectedRoute)
```

### New Role System (Keycloak-based)

**Keycloak Client Roles**:
```
Realm: master
Client: cloud-flight-simulator
Roles:
  - learner (default for users)
  - admin (platform admin)
  - platform_admin (super admin)
```

**Role Assignment**:
```
User registers via Google/Microsoft
  ↓
Keycloak creates user
  ↓
Admin assigns role via Keycloak console
  ↓
Role included in JWT claim: "roles": ["learner"]
  ↓
Frontend extracts from JWT
  ↓
FastAPI extracts from JWT for endpoint authorization
```

**JWT Roles Claim**:
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "roles": ["learner"],
  "exp": 1234567890
}
```

**Backend Role Validation**:

```python
# backend/app/dependencies/auth.py
async def get_current_user(token: str = Depends(...)) -> UserResponse:
    claims = keycloak.validate_token(token)
    user.roles = claims.get('roles', [])
    return user

# In endpoint handler:
async def admin_only_endpoint(
    user: UserResponse = Depends(get_current_user)
):
    if 'admin' not in user.roles:
        raise HTTPException(status_code=403, detail="Forbidden")
    # ...
```

**Frontend Role Usage**:

```javascript
// In hooks/useAuth.js
const useAuthStore = create(
  persist((set) => ({
    user: null,
    roles: [],  // NEW: extracted from JWT
    
    setRoles: (roles) => set({ roles }),
    
    hasRole: (role) => {
      // Check if user has role
      return get().roles.includes(role);
    }
  }))
);

// In components:
const { roles, hasRole } = useAuthStore();

if (hasRole('admin')) {
  // Show admin menu
}
```

**Role Synchronization**:
```
Keycloak updates user roles
  ↓ (admin console)
JWT reissued on next token refresh
  ↓
Frontend gets new JWT with updated roles
  ↓
Zustand updated automatically
  ↓
UI reflects new roles
```

### Role Categories

| Role | Purpose | Can Access |
|------|---------|------------|
| `learner` | Regular user | Dashboard, Challenges, Missions |
| `admin` | Admin panel access | Admin dashboard, Learner mgmt, etc |
| `platform_admin` | Full system access | All admin features + system config |

---

## 8. MIGRATION PATH FROM JWT TO KEYCLOAK

### Phase 1: Setup & Preparation (Week 1)

**Keycloak Setup**:
- Deploy Keycloak (Docker/Kubernetes)
- Create realm
- Create client: cloud-flight-simulator
- Configure Google/Microsoft OAuth
- Create roles: learner, admin, platform_admin
- Setup realm import/export

**Code Prep**:
- Install keycloak-js in frontend
- Create Keycloak client wrapper
- Create backend Keycloak integration module
- Add keycloak-js peer dependency to package.json

**No database changes yet** — maintain backward compatibility

### Phase 2: Parallel Auth System (Week 2)

**Both JWT and Keycloak authentication work**:

Backend:
```
POST /auth/login              (JWT - existing)
POST /auth/register           (JWT - existing)
GET  /auth/oauth/google       (NEW - Keycloak redirect)
GET  /auth/oauth/microsoft    (NEW - Keycloak redirect)
POST /auth/callback           (NEW - OIDC callback)
GET  /auth/me                 (supports both JWT and Keycloak)
```

Frontend:
- Login page shows:
  - Email/password (JWT)
  - Login with Google (Keycloak)
  - Login with Microsoft (Keycloak)
- useAuthStore supports both flows
- Users can use either method

Database:
- Add keycloak_id column (nullable)
- Existing JWT users: keycloak_id = NULL
- New Keycloak users: keycloak_id = UUID

### Phase 3: User Migration (Week 3)

**Migrate existing users to Keycloak**:

Option A: User Self-Migration
```
User logs in with email/password (JWT)
↓
Show message: "Migrate to OAuth for better security"
↓
User clicks "Link with Google" or "Link with Microsoft"
↓
OAuth redirect and consent
↓
Keycloak creates user or links existing
↓
Link established: users.keycloak_id = Keycloak UUID
↓
Password becomes optional
```

Option B: Bulk User Import
```
Export users from local DB
↓
Create users in Keycloak via import
↓
Map Keycloak UUID back to local users.keycloak_id
↓
Update all rows in batch
```

Option C: Hybrid
```
Auto-migrate on next login
If user logs in with email/password:
  - Check if matching Keycloak user exists
  - Link if found
  - Create in Keycloak if not found
```

Recommendation: **Option C (Hybrid)** — automatic, no friction

### Phase 4: Deprecate JWT Endpoints (Week 4)

**Turn off JWT authentication**:

Gradual:
```
Week 1-3: Both JWT and Keycloak work
Week 4: Show warnings for JWT usage
Week 5: JWT still works but log deprecation warnings
Week 6: JWT endpoints disabled
```

Or abrupt:
```
Week 4: JWT endpoints return 410 Gone
Users forced to use OAuth
```

**Update backend**:
```
Remove:
- POST /auth/register (JWT)
- POST /auth/login (JWT)
- JWT token validation

Keep:
- POST /auth/logout
- GET /auth/me
- POST /auth/callback
- OAuth endpoints
```

### Phase 5: Cleanup (Week 5)

**Remove JWT infrastructure**:
- Delete JWT token generation code
- Delete password hashing code
- Delete local credential validation
- Remove refresh_tokens table (use Keycloak tokens)
- Remove password_hash column from users table

**Update frontend**:
- Remove old useAuthStore.login() with email/password
- Remove LoginPage email/password form (or keep as fallback)
- Simplify token handling

### Migration Timeline

```
Week 1: Deploy Keycloak, parallel system ready
Week 2: New users use Keycloak, existing users JWT
Week 3: Bulk migrate existing users
Week 4: Deprecate JWT
Week 5: Remove JWT code
Week 6: Production cutover

Total: 4-6 weeks
```

---

## 9. FINAL ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                        CLOUD FLIGHT SIMULATOR                          │
│                     KEYCLOAK-BASED ARCHITECTURE                        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────┐
│         FRONTEND LAYER              │
│     (React + Vite + Zustand)        │
│                                     │
│  ┌──────────────────────────────┐   │
│  │  LoginPage Component         │   │
│  │  ────────────────────────    │   │
│  │  • Email/Password (JWT)      │   │
│  │  • Login with Google         │   │
│  │  • Login with Microsoft      │   │
│  │  • Link OAuth to Account     │   │
│  └────────────┬─────────────────┘   │
│               │                      │
│  ┌────────────▼──────────────────┐  │
│  │  useAuthStore (Zustand)       │  │
│  │  ──────────────────────────   │  │
│  │  • login(email, password)     │  │
│  │  • loginWithGoogle()          │  │
│  │  • loginWithMicrosoft()       │  │
│  │  • handleOAuthCallback()      │  │
│  │  • logout()                   │  │
│  │  • user, roles, tokens        │  │
│  └────────────┬─────────────────┘   │
│               │                      │
│  ┌────────────▼──────────────────┐  │
│  │  keycloak-js Library          │  │
│  │  ──────────────────────────   │  │
│  │  • OIDC flow (code + PKCE)    │  │
│  │  • Token refresh              │  │
│  │  • Auto-logout                │  │
│  └────────────┬─────────────────┘   │
│               │                      │
│  ┌────────────▼──────────────────┐  │
│  │  Axios Client                 │  │
│  │  ──────────────────────────   │  │
│  │  • Add JWT to requests        │  │
│  │  • Handle 401 responses       │  │
│  │  • Auto-refresh on 401        │  │
│  └────────────┬──────────────────┘  │
│               │                      │
└───────────────┼──────────────────────┘
                │
    ┌───────────┼──────────────────────┐
    │           │                      │
    ▼           ▼                      ▼
┌─────────┐ ┌──────────────┐    ┌──────────────┐
│ Keycloak│ │ FastAPI      │    │ Keycloak     │
│ Admin   │ │ Backend      │    │ Identity     │
│ Console │ │              │    │ Providers    │
│         │ │ ┌──────────┐ │    │              │
│ • Users │ │ │ /auth/*  │ │    │ • Google     │
│ • Roles │ │ └─────┬────┘ │    │ • Microsoft  │
│ • IdPs  │ │       │       │    │ • Keycloak   │
└─────────┘ │ ┌─────▼─────┐ │    │ (built-in)   │
            │ │ FastAPI   │ │    └──────────────┘
            │ │ Dependency│ │
            │ │ ┌────────┐│ │
            │ │ │Keycloak││ │
            │ │ │ JWT    ││ │
            │ │ │Validate││ │
            │ │ └────────┘│ │
            │ └───────────┘ │
            │               │
            │ ┌───────────┐ │
            │ │ API       │ │
            │ │ Endpoints │ │
            │ │ Protected │ │
            │ │ by JWT    │ │
            │ └───────────┘ │
            │               │
            └───────────────┘
                │
                ▼
        ┌──────────────────┐
        │  PostgreSQL DB   │
        │                  │
        │  • users         │
        │    - keycloak_id │
        │    - provider    │
        │  • user_identities
        │    - provider mapping
        │  • user_roles    │
        │                  │
        └──────────────────┘

┌─────────────────────────────────────┐
│      KEYCLOAK SERVICES              │
│                                     │
│  URL: http://localhost:8080         │
│                                     │
│  Components:                        │
│  • OIDC Provider                    │
│  • Token Endpoint                   │
│  • Authorization Endpoint           │
│  • JWKS (public key endpoint)       │
│  • User Database                    │
│  • Role Management                  │
│  • Identity Provider Broker         │
│  • Refresh Token Rotation           │
│                                     │
│  Supported Identity Providers:      │
│  • Google OAuth 2.0                 │
│  • Microsoft Azure AD               │
│  • Built-in (email/password)        │
│                                     │
└─────────────────────────────────────┘
```

---

## 10. FILES TO CREATE

### Frontend Files (5 new files)

1. **`frontend/src/api/keycloak-config.js`** (~30 lines)
   - Keycloak client configuration
   - URLs, realm, client ID
   - Environment-based settings

2. **`frontend/src/hooks/useKeycloak.js`** (~60 lines)
   - Keycloak instance management
   - Token events handling
   - Auto-refresh setup

3. **`frontend/src/pages/AuthCallbackPage.jsx`** (~40 lines)
   - OAuth callback handler
   - Code exchange
   - Redirect to dashboard

4. **`frontend/.env.local`** (~5 lines)
   - VITE_KEYCLOAK_URL
   - VITE_KEYCLOAK_REALM
   - VITE_KEYCLOAK_CLIENT_ID
   - VITE_API_BASE_URL

5. **`frontend/.env.example`** (~5 lines)
   - Template for env vars

### Backend Files (4 new files)

6. **`backend/app/keycloak/client.py`** (~100 lines)
   - KeycloakClient class
   - JWT validation
   - Public key caching
   - Token exchange

7. **`backend/app/keycloak/config.py`** (~20 lines)
   - Keycloak configuration
   - URLs, realm, client settings
   - Environment-based

8. **`backend/app/keycloak/__init__.py`** (~5 lines)
   - Package initialization

9. **`backend/alembic/versions/002_add_keycloak_fields.py`** (~40 lines)
   - Migration: add keycloak_id column
   - Migration: add identity_provider column
   - Migration: create user_identities table
   - Migration: create user_roles table

---

## 11. FILES TO MODIFY

### Frontend Files (4 modified)

1. **`frontend/src/App.jsx`** (~20 line changes)
   - Initialize keycloak-js
   - Add AuthCallbackPage route
   - Wait for Keycloak initialization before rendering

2. **`frontend/src/hooks/useAuth.js`** (~50 line changes)
   - Add OAuth login methods
   - Update logout to call Keycloak
   - Add token refresh logic
   - Add role extraction from JWT

3. **`frontend/src/pages/LoginPage.jsx`** (~30 line changes)
   - Add OAuth buttons (Google, Microsoft)
   - Update form to show OAuth options
   - Keep email/password as optional fallback

4. **`frontend/src/pages/AdminLoginPage.jsx`** (~10 line changes)
   - Similar changes as LoginPage
   - Admin-specific branding

### Backend Files (3 modified)

5. **`backend/app/dependencies/auth.py`** (~50 line changes)
   - Update get_current_user() to validate Keycloak JWT
   - Add role extraction from JWT
   - Add auto-user creation on first login
   - Support both JWT and Keycloak tokens (during migration)

6. **`backend/app/auth/router.py`** (~80 line changes)
   - Add /auth/callback endpoint (OAuth callback)
   - Add /auth/login/* endpoints (OAuth redirects)
   - Remove /auth/login and /auth/register (or deprecate)
   - Update /auth/logout to call Keycloak revocation
   - Update /auth/me to work with Keycloak JWT

7. **`backend/app/main.py`** (~5 line changes)
   - Add Keycloak client initialization
   - Add CORS configuration for Keycloak
   - Add configuration loading

### Configuration Files (2 new/modified)

8. **`frontend/package.json`** (1 line change)
   - Add keycloak-js dependency

9. **`backend/.env`** (3 new lines)
   - KEYCLOAK_URL
   - KEYCLOAK_REALM
   - KEYCLOAK_CLIENT_ID

10. **`docker-compose.yml`** (if needed)
    - Add Keycloak service for development

---

## 12. IMPLEMENTATION ORDER

### Step 1: Infrastructure Setup (Day 1)

1. Deploy Keycloak (Docker)
2. Create realm: master
3. Create client: cloud-flight-simulator
4. Configure CORS redirects
5. Configure Google OAuth
6. Configure Microsoft OAuth
7. Create roles: learner, admin, platform_admin
8. Export realm configuration (backup)

**Deliverables**:
- Keycloak running and accessible
- Client configured with OIDC
- Identity providers configured

### Step 2: Backend Preparation (Days 2-3)

1. Create `backend/app/keycloak/` module
2. Implement KeycloakClient class
3. Implement JWT validation
4. Create database migration (keycloak_id column)
5. Update User model
6. Update dependencies/auth.py to validate Keycloak JWT
7. Add /auth/callback endpoint
8. Test JWT validation with Keycloak token

**Deliverables**:
- Backend can validate Keycloak JWTs
- Database has keycloak_id column
- /auth/callback endpoint works
- Can exchange auth code for tokens

### Step 3: Frontend Preparation (Days 3-4)

1. Install keycloak-js
2. Create Keycloak config file
3. Create useKeycloak hook
4. Initialize Keycloak in App.jsx
5. Create AuthCallbackPage
6. Test OAuth flow in browser
7. Test token received and stored

**Deliverables**:
- keycloak-js initialized and working
- OAuth flow tested (Google, Microsoft)
- Tokens received and stored
- Can exchange code for JWT

### Step 4: Auth Integration (Days 5-6)

1. Update useAuthStore for OAuth flows
2. Update LoginPage with OAuth buttons
3. Add Google/Microsoft login methods
4. Update logout to call Keycloak
5. Test full OAuth flow end-to-end
6. Test logout invalidates tokens
7. Test user data in Keycloak

**Deliverables**:
- Full OAuth login flow working
- User can login with Google/Microsoft
- Logout works and invalidates tokens
- useAuthStore has OAuth methods

### Step 5: Parallel System (Days 7-8)

1. Keep JWT endpoints working (for existing users)
2. Support both JWT and Keycloak in get_current_user()
3. Update LoginPage to show both options
4. Test both JWT and OAuth flows
5. Test role-based access with both auth types

**Deliverables**:
- Both JWT and OAuth users can login
- Both can access protected routes
- Both have roles working
- System supports parallel authentication

### Step 6: User Migration (Days 9-10)

1. Bulk create users in Keycloak (from existing)
2. Link existing users to Keycloak IDs
3. Auto-link on JWT login (create in Keycloak)
4. Test user linking and role assignment

**Deliverables**:
- Existing users have keycloak_id set
- New users created in Keycloak
- Roles assigned in Keycloak

### Step 7: Deprecation (Days 11-12)

1. Mark JWT endpoints as deprecated
2. Remove JWT token creation
3. Remove JWT login/register endpoints
4. Clean up JWT-related code
5. Update frontend to remove JWT login
6. Test final system

**Deliverables**:
- JWT infrastructure removed
- Only OAuth-based auth remaining
- All existing users migrated
- System ready for production

---

## SUMMARY

### Key Decisions

| Decision | Chosen | Rationale |
|----------|--------|-----------|
| Keycloak Deployment | Separate Service | Production-grade, independent scaling |
| Auth Protocol | OIDC Code Flow + PKCE | Secure, browser-based, Keycloak standard |
| Client Library | keycloak-js | Official library, automatic token refresh |
| JWT Validation | Direct Keycloak validation | Simpler, no token exchange, Keycloak authoritative |
| Role Storage | Keycloak roles in JWT | Single source of truth, no DB sync needed |
| Token Storage | Memory + localStorage | Session survival, XSS mitigation |
| Migration Strategy | Parallel system | No downtime, gradual transition |

### Implementation Effort

| Phase | Duration | Effort |
|-------|----------|--------|
| Infrastructure | 1 day | 4h |
| Backend setup | 2 days | 8h |
| Frontend setup | 2 days | 8h |
| Integration | 2 days | 8h |
| Parallel system | 2 days | 8h |
| Migration | 2 days | 8h |
| Deprecation | 2 days | 8h |
| **Total** | **~12 days** | **~52h** |

### Production Readiness Checklist

- [ ] Keycloak deployed and HA-configured
- [ ] SSL/TLS certificates installed
- [ ] Database backups configured
- [ ] User import/export tested
- [ ] OAuth provider credentials secured in secrets
- [ ] Frontend environment variables configured
- [ ] Backend JWT validation working
- [ ] Token refresh tested
- [ ] Logout invalidates sessions
- [ ] Role-based access working
- [ ] Error handling for auth failures
- [ ] Rate limiting on OAuth endpoints
- [ ] Audit logging configured
- [ ] Session timeout policies set
- [ ] Password policies configured in Keycloak
- [ ] All users migrated from JWT to Keycloak
- [ ] JWT endpoints removed
- [ ] Load testing completed
- [ ] Disaster recovery tested

---

## CONCLUSION

This architecture provides a **production-grade, multi-provider authentication system** while maintaining the existing React login interface. The migration path is **low-risk**, allowing existing JWT users to coexist with OAuth users during transition.

**Key benefits**:
- ✅ Multi-provider OAuth support (Google, Microsoft)
- ✅ Enterprise-grade identity management
- ✅ Token rotation and refresh handled by Keycloak
- ✅ Role-based access control
- ✅ Session management
- ✅ Backward compatibility during migration

**Status**: Ready for implementation approval.

---

**ANALYSIS COMPLETE — NO CODE WRITTEN**
