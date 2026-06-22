# Authorization Matrix

**Date**: 2026-06-22  
**Status**: SPECIFICATION — AWAITING APPROVAL  
**Purpose**: Define authentication and authorization requirements for every endpoint  
**Scope**: All 18 frozen routes across all domains

---

## DEFINITIONS

**Authentication**: Is the user who they claim to be? (handled by Keycloak)

**Authorization**: Does this user have permission to call this endpoint? (handled by application)

**Public**: No authentication required. Endpoint accessible to everyone.

**Authenticated**: User must present valid Keycloak JWT. Role irrelevant.

**Learner**: User must be authenticated AND have `learner` role in Keycloak realm roles.

**Admin**: User must be authenticated AND have `admin` role in Keycloak realm roles.

**Platform Admin**: User must be authenticated AND have `platform_admin` role in Keycloak realm roles.

---

## AUTHENTICATION LAYER (SHARED)

**Keycloak JWT Validation** (all authenticated endpoints):

```python
# In get_current_user() dependency:
1. Extract Authorization: Bearer {token} header
2. Validate JWT signature against Keycloak JWKS (/auth/realms/{realm}/.well-known/openid-configuration)
3. Verify issuer = Keycloak URL
4. Verify aud (audience) = backend client_id
5. Verify exp (not expired)
6. Extract claims: sub (keycloak_id), realm_access.roles
7. Lookup local user by keycloak_id
8. If first login: create local user record
9. Return UserSchema with user_id and email
```

If validation fails: return 401 Unauthorized

---

## AUTHORIZATION MATRIX: ALL 18 ROUTES

### P2: AUTH DOMAIN (6 routes)

#### 1. POST `/auth/register`
- **Authentication**: NONE
- **Authorization**: PUBLIC
- **Purpose**: Create new local user account
- **Current Status**: Supported (local email/password)
- **Post-Keycloak Status**: User registration handled by Keycloak UI or self-service link
- **Endpoint Behavior**: 
  - If kept: Provide link to Keycloak self-service registration
  - If removed: Redirect to Keycloak with registration=true
  - If deprecated: Return 410 Gone or redirect to Keycloak

**Recommendation**: Keep endpoint, return redirect to Keycloak registration URL

---

#### 2. POST `/auth/login`
- **Authentication**: NONE
- **Authorization**: PUBLIC
- **Purpose**: Authenticate user with credentials
- **Current Status**: Supported (email/password)
- **Post-Keycloak Status**: Handled by keycloak-js in frontend
- **Endpoint Behavior**: 
  - Deprecated. Frontend no longer calls this.
  - If removed: Return 410 Gone
  - If kept: Redirect to Keycloak login URL

**Recommendation**: Remove endpoint. Frontend uses keycloak.login() instead.

---

#### 3. POST `/auth/refresh`
- **Authentication**: NONE (accepts refresh_token in body)
- **Authorization**: PUBLIC (but requires valid refresh_token)
- **Purpose**: Obtain new access token using refresh token
- **Current Status**: Supported (JWT refresh token rotation)
- **Post-Keycloak Status**: Handled by keycloak-js in frontend
- **Endpoint Behavior**: 
  - Deprecated. Frontend/keycloak-js calls Keycloak token endpoint directly.
  - If removed: Return 410 Gone
  - If kept: Proxy to Keycloak token endpoint (not recommended)

**Recommendation**: Remove endpoint. keycloak-js handles token refresh directly.

---

#### 4. POST `/auth/logout`
- **Authentication**: JWT (required)
- **Authorization**: AUTHENTICATED (any authenticated user)
- **Purpose**: Revoke user session / logout
- **Current Status**: Supported (invalidates all refresh tokens)
- **Post-Keycloak Status**: User calls keycloak.logout(), then frontend calls this for audit
- **Endpoint Behavior**:
  - Accept Keycloak JWT in Authorization header
  - Optional: Call Keycloak logout endpoint to revoke session
  - Write USER_LOGOUT audit event
  - Return 204 No Content
  - Frontend clears local tokens

**Recommendation**: Keep endpoint. Used for audit logging after frontend initiates logout.

---

#### 5. GET `/auth/me`
- **Authentication**: JWT (required)
- **Authorization**: AUTHENTICATED (any authenticated user)
- **Purpose**: Return current authenticated user
- **Current Status**: Supported (query users table by JWT sub claim)
- **Post-Keycloak Status**: 
  - Validate Keycloak JWT
  - Provision local user if first login
  - Return UserSchema
- **Endpoint Behavior**:
  - Extract Keycloak JWT from Authorization header
  - Validate against Keycloak JWKS
  - Lookup local user by keycloak_id
  - If not found: Create local user record
  - Return UserSchema (user_id, email, full_name, role, created_at)

**Recommendation**: Keep and refactor. Critical endpoint for first-login provisioning.

---

#### 6. GET `/health`
- **Authentication**: NONE
- **Authorization**: PUBLIC
- **Purpose**: Health check
- **Current Status**: Supported (returns status, service, version)
- **Post-Keycloak Status**: Unchanged
- **Endpoint Behavior**: Same as before

**Recommendation**: No change.

---

### P3: SCENARIO SERVICE (2 routes)

#### 7. POST `/scenarios/generate`
- **Authentication**: JWT (required)
- **Authorization**: AUTHENTICATED (any authenticated user)
- **Purpose**: Generate AI-powered scenario/mission
- **Current Status**: Supported (protected by get_current_user)
- **Post-Keycloak Status**: Unchanged. get_current_user now validates Keycloak JWT.
- **Endpoint Behavior**: No change to endpoint contract. Internal JWT validation changes only.

**Recommendation**: No change to endpoint. Internal dependency changes only (P2 domain).

---

#### 8. GET `/scenarios/{mission_id}`
- **Authentication**: JWT (required)
- **Authorization**: AUTHENTICATED (any authenticated user)
- **Purpose**: Retrieve scenario by mission ID
- **Current Status**: Supported
- **Post-Keycloak Status**: Unchanged
- **Endpoint Behavior**: No change

**Recommendation**: No change.

---

### P4: CHALLENGES SERVICE (3 routes)

#### 9. POST `/challenges/start`
- **Authentication**: JWT (required)
- **Authorization**: AUTHENTICATED + LEARNER (must have learner role)
- **Purpose**: Start a new challenge session
- **Current Status**: Supported
- **Post-Keycloak Status**: Unchanged (role check via JWT claims)
- **Endpoint Behavior**: 
  - get_current_user validates JWT and extracts roles from realm_access.roles
  - Endpoint checks: current_user.role == 'LEARNER'
  - Proceed if authorized, else return 403 Forbidden

**Recommendation**: No change to endpoint. Role checking method changes (JWT claims vs. DB column).

---

#### 10. GET `/challenges/{session_id}/status`
- **Authentication**: JWT (required)
- **Authorization**: AUTHENTICATED + LEARNER
- **Purpose**: Poll challenge session status
- **Current Status**: Supported
- **Post-Keycloak Status**: Unchanged
- **Endpoint Behavior**: Same as above

**Recommendation**: No change.

---

#### 11. POST `/challenges/{session_id}/stop`
- **Authentication**: JWT (required)
- **Authorization**: AUTHENTICATED + LEARNER
- **Purpose**: Stop an active challenge session
- **Current Status**: Supported
- **Post-Keycloak Status**: Unchanged
- **Endpoint Behavior**: Same as above

**Recommendation**: No change.

---

### P5: EVALUATION SERVICE (2 routes)

#### 12. GET `/evaluate/{session_id}`
- **Authentication**: JWT (required)
- **Authorization**: AUTHENTICATED + (LEARNER OR ADMIN)
- **Purpose**: Get evaluation results for a session
- **Current Status**: Supported
- **Post-Keycloak Status**: Unchanged
- **Endpoint Behavior**: 
  - LEARNER can view their own session's evaluation
  - ADMIN can view any session's evaluation
  - Check: current_user.role in ['LEARNER', 'ADMIN']

**Recommendation**: No change to endpoint. Role check method changes.

---

#### 13. POST `/evaluate/{session_id}/run`
- **Authentication**: JWT (required)
- **Authorization**: AUTHENTICATED + LEARNER (can trigger evaluation of own session)
- **Purpose**: Trigger evaluation of a challenge submission
- **Current Status**: Supported
- **Post-Keycloak Status**: Unchanged
- **Endpoint Behavior**: 
  - Check: current_user.role == 'LEARNER'
  - Check: current_user.user_id == session.user_id (owns session)

**Recommendation**: No change to endpoint. Role check method changes.

---

### P6: FEEDBACK SERVICE (2 routes)

#### 14. POST `/feedback/generate`
- **Authentication**: JWT (required)
- **Authorization**: AUTHENTICATED + LEARNER
- **Purpose**: Generate AI feedback on submission
- **Current Status**: Supported
- **Post-Keycloak Status**: Unchanged
- **Endpoint Behavior**: 
  - Check: current_user.role == 'LEARNER'
  - Check: current_user.user_id == submission.user_id

**Recommendation**: No change to endpoint. Role check method changes.

---

#### 15. GET `/feedback/{session_id}`
- **Authentication**: JWT (required)
- **Authorization**: AUTHENTICATED + LEARNER
- **Purpose**: Retrieve feedback report for a session
- **Current Status**: Supported
- **Post-Keycloak Status**: Unchanged
- **Endpoint Behavior**: Same as above

**Recommendation**: No change to endpoint.

---

### P7: PROGRESS & AUDIT SERVICE (3 routes)

#### 16. GET `/progress/{user_id}/stats`
- **Authentication**: JWT (required)
- **Authorization**: AUTHENTICATED + (SELF OR ADMIN)
- **Purpose**: Get user progress statistics
- **Current Status**: Supported
- **Post-Keycloak Status**: Unchanged
- **Endpoint Behavior**:
  - LEARNER can view own stats (user_id matches current_user.user_id)
  - ADMIN can view any user's stats
  - Check: current_user.user_id == user_id OR current_user.role == 'ADMIN'

**Recommendation**: No change to endpoint. Role check method changes.

---

#### 17. GET `/progress/{user_id}/history`
- **Authentication**: JWT (required)
- **Authorization**: AUTHENTICATED + (SELF OR ADMIN)
- **Purpose**: Get user session history
- **Current Status**: Supported
- **Post-Keycloak Status**: Unchanged
- **Endpoint Behavior**: Same as above

**Recommendation**: No change to endpoint.

---

#### 18. GET `/audit/events`
- **Authentication**: JWT (required)
- **Authorization**: AUTHENTICATED + ADMIN
- **Purpose**: Retrieve audit event log
- **Current Status**: Supported (admin-only)
- **Post-Keycloak Status**: Unchanged
- **Endpoint Behavior**:
  - Check: current_user.role == 'ADMIN' OR current_user.role == 'PLATFORM_ADMIN'
  - Return audit events (append-only, immutable)

**Recommendation**: No change to endpoint. Role check method changes.

---

## ROLE EXTRACTION & MAPPING

### From Keycloak JWT

**JWT `realm_access` claim structure**:

```json
{
  "realm_access": {
    "roles": [
      "learner",
      "admin"
    ]
  }
}
```

### Backend Role Checking

```python
def extract_roles_from_jwt(token_claims: dict) -> List[str]:
    """Extract realm roles from Keycloak JWT claims."""
    return token_claims.get('realm_access', {}).get('roles', [])


def has_role(current_user: UserSchema, required_role: str) -> bool:
    """Check if user has required role."""
    # For now: UserSchema.role is string; stored in endpoint logic
    # Future: UserSchema could carry roles list for complex checks
    return current_user.role == required_role


def is_admin(current_user: UserSchema) -> bool:
    return current_user.role in ['ADMIN', 'PLATFORM_ADMIN']


def is_learner(current_user: UserSchema) -> bool:
    return current_user.role == 'LEARNER'


# In get_current_user:
def determine_role(keycloak_roles: List[str]) -> str:
    """Map Keycloak realm roles to application role."""
    if 'platform_admin' in keycloak_roles:
        return 'PLATFORM_ADMIN'
    elif 'admin' in keycloak_roles:
        return 'ADMIN'
    else:
        return 'LEARNER'  # Default
```

---

## AUTHORIZATION CHECKS IN ENDPOINTS

### Pattern: Protected Route (Authenticated Only)

```python
@app.post("/scenarios/generate")
async def generate_scenario(
    current_user: UserSchema = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # At this point:
    # - get_current_user has validated Keycloak JWT
    # - get_current_user has provisioned local user if first login
    # - current_user contains user_id, email, full_name, role, created_at
    
    # No additional auth check needed; endpoint is for authenticated users only
    return await business_logic(current_user, db)
```

### Pattern: Role-Based Route (Learner Only)

```python
@app.post("/challenges/start")
async def start_challenge(
    current_user: UserSchema = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check role
    if current_user.role != 'LEARNER':
        raise HTTPException(status_code=403, detail="Learners only")
    
    # Proceed with business logic
    return await business_logic(current_user, db)
```

### Pattern: Admin-Only Route

```python
@app.get("/audit/events")
async def get_audit_events(
    current_user: UserSchema = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check role
    if current_user.role not in ['ADMIN', 'PLATFORM_ADMIN']:
        raise HTTPException(status_code=403, detail="Admins only")
    
    # Proceed with business logic
    return await business_logic(current_user, db)
```

### Pattern: Owner Check (Self or Admin)

```python
@app.get("/progress/{user_id}/stats")
async def get_user_stats(
    user_id: str,
    current_user: UserSchema = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check: Is this the user's own data, or is user an admin?
    if current_user.user_id != user_id and current_user.role not in ['ADMIN', 'PLATFORM_ADMIN']:
        raise HTTPException(status_code=403, detail="Can only view own stats or you must be admin")
    
    # Proceed with business logic
    return await business_logic(user_id, db)
```

---

## SUMMARY TABLE

| # | Route | Auth | Required Role | Notes |
|---|-------|------|---------------|-------|
| 1 | POST /auth/register | NONE | — | Consider removing or redirecting to Keycloak |
| 2 | POST /auth/login | NONE | — | Remove; keycloak-js handles login |
| 3 | POST /auth/refresh | NONE | — | Remove; keycloak-js handles refresh |
| 4 | POST /auth/logout | JWT | ANY | Keep; audit logging |
| 5 | GET /auth/me | JWT | ANY | Keep; first-login provisioning |
| 6 | GET /health | NONE | — | Keep; no change |
| 7 | POST /scenarios/generate | JWT | ANY | Keep; no change |
| 8 | GET /scenarios/{mission_id} | JWT | ANY | Keep; no change |
| 9 | POST /challenges/start | JWT | LEARNER | Keep; role check |
| 10 | GET /challenges/{session_id}/status | JWT | LEARNER | Keep; role check |
| 11 | POST /challenges/{session_id}/stop | JWT | LEARNER | Keep; role check |
| 12 | GET /evaluate/{session_id} | JWT | LEARNER\|ADMIN | Keep; role check |
| 13 | POST /evaluate/{session_id}/run | JWT | LEARNER | Keep; owner check |
| 14 | POST /feedback/generate | JWT | LEARNER | Keep; owner check |
| 15 | GET /feedback/{session_id} | JWT | LEARNER | Keep; owner check |
| 16 | GET /progress/{user_id}/stats | JWT | LEARNER\|ADMIN | Keep; owner check |
| 17 | GET /progress/{user_id}/history | JWT | LEARNER\|ADMIN | Keep; owner check |
| 18 | GET /audit/events | JWT | ADMIN+ | Keep; admin only |

---

## KEYCLOAK ROLES EXPECTED

**In Keycloak realm configuration**:

| Role | Description | Usage |
|------|-------------|-------|
| `learner` | Default learner role | Learner-only endpoints |
| `admin` | Administrator role | Admin/audit endpoints |
| `platform_admin` | Platform administrator role | System-level operations |

**New users** are assigned `learner` role by default (configured in Keycloak realm).

**Role assignment** is done via Keycloak Admin Console or API (not by application).

---

## IMPLEMENTATION CHECKLIST

Before deployment, verify:

- [ ] Every endpoint lists required authentication level
- [ ] Every endpoint lists required role(s)
- [ ] get_current_user dependency validates Keycloak JWT correctly
- [ ] get_current_user extracts roles from JWT realm_access.roles claim
- [ ] get_current_user provisions local user on first login
- [ ] Role checks use JWT-derived role, not database column
- [ ] Password_hash removed from users table
- [ ] keycloak_id added to users table
- [ ] Keycloak realm configured with learner, admin, platform_admin roles
- [ ] CORS allows requests from frontend origin
- [ ] Audit events written for authentication operations

---

## FUTURE CONSIDERATIONS

### Multi-Tenancy (if needed)

Extend JWT validation to include tenant_id claim.

### Fine-Grained Authorization (FGAC)

Keycloak supports client roles and scope mapping. Could implement per-mission access control.

### Service-to-Service Auth

Backend services calling each other could use client credentials flow with Keycloak confidential client.

---

## STATUS

✅ Matrix complete
✅ All 18 routes authorized
✅ Role extraction documented
✅ Keycloak configuration specified
✅ Awaiting approval
