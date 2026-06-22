# Contract Impact Report: Keycloak Migration

**Date**: 2026-06-22  
**Status**: IMPACT ASSESSMENT — AWAITING APPROVAL  
**Scope**: All affected contracts and their breaking changes  
**Prepared By**: P2 (Backend Platform Lead)  
**Review Required From**: P2, P1, P3, P4, P5, P6, P7

---

## EXECUTIVE SUMMARY

Keycloak migration requires **ZERO changes to contract signatures**. All contract fields remain identical.

**What changes**: Backend implementation of how contracts are produced and consumed.

**Breaking changes**: NONE at the contract level. Authentication and password handling move to Keycloak.

**Teams affected**:
- P2: Auth service (major refactoring, no contract change)
- P1: Frontend (keycloak-js integration, tokens stored in browser)
- P3-P7: No code changes (JWT validation method changes internally in P2)

---

## CONTRACT ANALYSIS

### Contract: UserSchema

**Producer**: P2 (Auth Service)  
**Consumers**: P1 (Frontend), P4 (Challenges), P5 (Evaluation), P6 (Feedback), P7 (Progress & Audit)

#### Current Schema (Frozen)

```json
{
  "user_id": "uuid",
  "email": "learner@example.com",
  "full_name": "John Doe",
  "role": "LEARNER",
  "created_at": "timestamp"
}
```

#### Post-Migration Schema

```json
{
  "user_id": "uuid",
  "email": "learner@example.com",
  "full_name": "John Doe",
  "role": "LEARNER",
  "created_at": "timestamp"
}
```

**Change**: NONE to schema signature.

**Change to semantics**: 
- `role` is now derived from Keycloak JWT realm roles (not database column)
- Password management is handled by Keycloak (not mentioned in schema anyway)

**Impact to consumers**: ZERO. All consumers receive identical data.

**Amendment required?** NO. Schema shape is unchanged.

---

### Contract: AuditEventSchema

**Produced By**: All services (written through P7 audit_service)  
**Consumers**: P7 (Audit Service)

#### Current Schema

```json
{
  "event_type": "USER_REGISTERED",
  "source": "AUTH_SERVICE",
  "user_id": "uuid",
  "timestamp": "timestamp",
  "metadata": {}
}
```

#### Post-Migration: NEW Events

**New event type**: `USER_FIRST_LOGIN` (optional, for analytics)

**Existing events still emitted**:
- `USER_REGISTERED` - emitted when local user is created (first Keycloak login)
- `USER_LOGOUT` - emitted when user logs out

**Removed events**: 
- `USER_LOGIN` - not emitted by Keycloak. Keycloak has its own login audit log.

**Impact to P7**: 
- No change to AuditEventSchema signature
- USER_REGISTERED will be emitted with additional metadata (keycloak_id, identity_provider)

**Amendment required?** NO. Event types remain the same.

---

### Contract: All Other Contracts (No Change)

| Contract | Producer | Status | Breaking Change |
|----------|----------|--------|-----------------|
| MissionSchema | P3 | UNCHANGED | NO |
| EnvironmentSchema | P4 | UNCHANGED | NO |
| ChallengeSessionSchema | P4 | UNCHANGED | NO |
| SubmissionSchema | P1 | UNCHANGED | NO |
| EvaluationResultSchema | P5 | UNCHANGED | NO |
| FeedbackReportSchema | P6 | UNCHANGED | NO |

**Reason**: None of these contracts are produced by or depend directly on authentication data (except for user_id, which remains unchanged).

---

## API ROUTE IMPACT

### Routes Affected

| Method | Path | Current | Post-Migration | Breaking |
|--------|------|---------|----------------|-----------|
| POST | `/auth/register` | Supported (email/password) | Deprecated or redirect to Keycloak | Soft-break (recommend deprecation) |
| POST | `/auth/login` | Supported (email/password) | Deprecated (keycloak-js handles) | Soft-break (recommend removal) |
| POST | `/auth/refresh` | Supported (refresh_token body) | Deprecated (keycloak-js handles) | Soft-break (recommend removal) |
| POST | `/auth/logout` | Supported | Refactored (optional Keycloak call) | NO (signature unchanged) |
| GET | `/auth/me` | Supported | Refactored (Keycloak JWT + local provisioning) | NO (signature unchanged) |
| GET | `/health` | Supported | Unchanged | NO |

### Routes NOT Affected

All other 12 routes (P3-P7) have:
- Same path
- Same HTTP method
- Same request/response schemas
- Same authentication requirement (JWT from Authorization header)
- JWT validation method changes (internal to P2)

**Breaking changes to other routes**: NONE

---

## DATABASE SCHEMA CHANGES

### Table: `users`

#### Column: `password_hash`

**Current**: VARCHAR(255) NOT NULL  
**Post-migration**: REMOVED  
**Rationale**: Keycloak manages passwords, not the application  
**Breaking**: NO (internal only, never exposed in API)

#### Column: `role`

**Current**: VARCHAR(20) NOT NULL DEFAULT 'LEARNER'  
**Post-migration**: REMOVED  
**Rationale**: Role comes from Keycloak JWT realm_access.roles claim  
**Breaking**: NO (role is derived at request time, not stored)

#### Column: `keycloak_id` (NEW)

**Type**: VARCHAR(255) UNIQUE NOT NULL  
**Rationale**: Maps local user_id to Keycloak subject ID  
**Required for**: First-login provisioning and JWT lookup  
**Breaking**: NO (new column, no impact to existing queries)

#### Column: `last_login_at` (NEW)

**Type**: TIMESTAMPTZ DEFAULT NOW()  
**Rationale**: Track user activity for analytics  
**Breaking**: NO (new column)

#### Final Schema

```sql
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keycloak_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Table: `refresh_tokens`

**Current**: Exists (stores refresh token hashes)  
**Post-migration**: DROPPED  
**Rationale**: Keycloak manages refresh token lifecycle server-side  
**Breaking**: NO (internal only, never exposed in API)

---

## DEPENDENCY CHANGES

### Backend Dependencies

**Removed**:
- `PyJWT==2.8.0` — JWT library (not needed)
- `bcrypt==4.1.2` — Password hashing (Keycloak does this)

**Added**:
- `python-keycloak>=3.0` — Keycloak SDK (for admin operations, optional)
- `python-jose[cryptography]>=3.3.0` — JWT validation with RS256 support
- `aiohttp>=3.8.0` — Async HTTP for JWKS fetching

### Frontend Dependencies

**Added**:
- `keycloak-js@24.0` — Keycloak JavaScript SDK (OIDC flow)

**Removed**: NONE

---

## IMPLEMENTATION IMPACT BY TEAM

### P2 (Backend Platform Lead)

**Impact**: MAJOR  
**Files modified**: ~15 files (auth/*, config, dependencies, migrations)  
**Breaking changes to own domain**: YES (refactoring only, not contract breaking)

**Tasks**:
- Remove password hashing logic (passlib removed from imports)
- Remove JWT issuance logic (create_access_token, create_refresh_token removed)
- Add Keycloak JWKS validation (new validate_keycloak_jwt function)
- Refactor get_current_user to call Keycloak JWKS, provision local user
- Create Alembic migration for schema changes
- Update auth/router.py to deprecate /auth/register, /auth/login, /auth/refresh
- Update config.py: remove JWT secrets, add Keycloak URL/realm/client config

### P1 (Frontend)

**Impact**: MAJOR  
**Files modified**: ~8 files (hooks, pages, app.jsx, axios config)  
**Breaking changes to own domain**: YES (authentication implementation completely changes)

**Tasks**:
- Add keycloak-js dependency
- Create Keycloak initialization in App.jsx
- Replace useAuth.js to use keycloak tokens instead of mock JWT
- Replace LoginPage form with keycloak.login() button
- Replace RegisterPage with Keycloak signup redirect
- Create AuthCallbackPage to handle OIDC callback
- Add axios interceptor for token injection
- Update Zustand store for Keycloak tokens

### P3 (Scenario Service)

**Impact**: ZERO code changes  
**Files modified**: NONE  
**Breaking changes**: NONE

**Why**: JWT validation happens in P2's dependency (get_current_user). P3 only consumes it.

### P4 (Challenge Service)

**Impact**: ZERO code changes  
**Files modified**: NONE  
**Breaking changes**: NONE

### P5 (Evaluation Service)

**Impact**: ZERO code changes  
**Files modified**: NONE  
**Breaking changes**: NONE

### P6 (Feedback Service)

**Impact**: ZERO code changes  
**Files modified**: NONE  
**Breaking changes**: NONE

### P7 (Audit Service)

**Impact**: MINOR  
**Files modified**: Potentially audit event type definitions (if adding USER_FIRST_LOGIN)  
**Breaking changes**: NONE

**Why**: Audit events remain the same. P2 now writes USER_REGISTERED on first Keycloak login.

---

## BACKWARD COMPATIBILITY

### Old Clients Using JWT-Based Auth

**Scenario**: External client (mobile app, third-party integration) authenticates using old `/auth/login` endpoint.

**Options**:

#### Option 1: Hard Break (Recommended)

- Remove `/auth/login`, `/auth/register`, `/auth/refresh` endpoints
- All clients must migrate to Keycloak OIDC flow
- New clients use Keycloak directly (no app auth endpoints needed)

**Pros**: Clean architecture, no legacy code  
**Cons**: Forces all clients to migrate

#### Option 2: Deprecation Period

- Keep endpoints, return 410 Gone or redirect to Keycloak
- Clients have 3-6 months to migrate
- Send deprecation notices

**Pros**: Gradual migration, less disruptive  
**Cons**: Code maintenance burden

#### Option 3: Proxy to Keycloak

- Keep endpoints, proxy requests to Keycloak
- `/auth/login` → exchange credentials with Keycloak token endpoint
- Return Keycloak tokens to client

**Pros**: Backward compatible  
**Cons**: Extra complexity, defeats purpose (app becomes OAuth broker again)

**Recommendation**: Option 1 (hard break). If third-party integrations exist, Option 2 with 6-month notice.

### Existing User Sessions

**Scenario**: User is logged in via old JWT, then system is migrated to Keycloak.

**Outcome**: 
- Old JWT becomes invalid (backend no longer validates against SECRET_KEY)
- User is forced to re-authenticate via Keycloak
- Local user record is provisioned on re-login
- User data is preserved (same email, name)

**No data loss**. Just requires re-authentication.

---

## SECURITY IMPLICATIONS

### Improvements

1. **Centralized Identity**: Keycloak is source of truth, not distributed local passwords
2. **Multi-Provider**: Google, Microsoft authentication without local password storage
3. **Token Rotation**: Keycloak handles refresh token rotation automatically
4. **Key Rotation**: JWKS caching handles Keycloak key changes transparently
5. **No Password Storage**: Local app has zero responsibility for password security

### New Risks

1. **Keycloak Dependency**: If Keycloak is down, login is impossible (mitigation: HA setup)
2. **Token Exposure in Browser**: Refresh token stored in localStorage (mitigation: HTTPOnly cookie in production)
3. **CORS Dependency**: Frontend must call Keycloak directly (mitigation: CORS carefully configured)

### Overall**: Security improves significantly.

---

## TESTING IMPACT

### Unit Tests

**Affected tests**:
- All auth service tests (refactored)
- JWT validation tests (new tests for JWKS caching)
- User provisioning tests (new tests for first-login flow)

**Unaffected tests**:
- All P3-P7 service tests (JWT validation is now a dependency)

### Integration Tests

**New tests required**:
- Full OIDC flow (redirect to Keycloak, callback, token exchange)
- Token refresh in browser
- User provisioning on first login
- Token expiration and auto-refresh

**Existing tests affected**:
- Tests that mock JWT generation (must use Keycloak instead)

### E2E Tests

**New scenarios**:
- Login with email/password (via Keycloak UI)
- Login with Google (if configured)
- Login with Microsoft (if configured)
- Protected routes with Keycloak tokens

---

## MIGRATION PLAN SUMMARY

### Phase 1: Keycloak Deployment (Day 1)
- Deploy Keycloak server
- Configure realm, clients, identity providers
- Create test users

### Phase 2: Backend Refactoring (Days 2-3)
- Add keycloak/ module for JWT validation
- Refactor get_current_user dependency
- Create Alembic migration (add keycloak_id, remove password_hash)
- Update /auth/me endpoint

### Phase 3: Frontend Integration (Days 4-5)
- Add keycloak-js dependency
- Create AuthCallbackPage
- Replace login/register/logout flows
- Update Zustand store

### Phase 4: Testing & Verification (Days 6-7)
- End-to-end testing with real Keycloak
- Load testing with token validation
- Browser storage verification
- Multi-provider authentication testing

### Phase 5: Cutover (Day 8)
- Deploy Keycloak to production
- Deploy backend with migration
- Deploy frontend with keycloak-js
- Monitor logs for any issues
- Existing users must re-authenticate

---

## ROLLBACK PLAN

If migration must be rolled back:

1. **Revert database**: Restore password_hash column, recreate refresh_tokens table
2. **Revert backend**: Redeploy previous version with JWT signing
3. **Revert frontend**: Redeploy previous version without keycloak-js
4. **Users**: Old JWT tokens become valid again
5. **Risk**: Current Keycloak users cannot login until they reset password in old system

**Conclusion**: Rollback is possible but painful. Recommend thorough testing before cutover.

---

## APPROVAL MATRIX

| Team | Owner | Review Required | Sign-Off |
|------|-------|-----------------|----------|
| **Auth** | P2 | P2 self-review | P2 ✓ |
| **Frontend** | P1 | P1 + P2 | P1, P2 |
| **Scenarios** | P3 | P3 + P2 | P3, P2 |
| **Challenges** | P4 | P4 + P2 | P4, P2 |
| **Evaluation** | P5 | P5 + P2 | P5, P2 |
| **Feedback** | P6 | P6 + P2 | P6, P2 |
| **Audit** | P7 | P7 + P2 | P7, P2 |

**Required approvals before implementation**: All 7 domain owners + P2

---

## RISK ASSESSMENT

| Risk | Severity | Probability | Mitigation |
|------|----------|------------|-----------|
| Keycloak downtime blocks auth | HIGH | MEDIUM | HA setup, monitoring |
| JWKS fetch fails | MEDIUM | LOW | Cache with fallback |
| Token validation bug | HIGH | LOW | Comprehensive unit + E2E tests |
| Browser token exposure (XSS) | MEDIUM | MEDIUM | HTTPOnly cookies (production) |
| Existing users forced to re-auth | HIGH | CERTAIN | Communicate with users, provide reset flow |
| Performance regression (JWKS fetch) | MEDIUM | LOW | JWKS caching with 24h TTL |
| Key rotation breaks validation | MEDIUM | LOW | Automatic JWKS refresh on key mismatch |

---

## FINAL VERDICT

**Contract Impact**: ZERO

**Code Impact**: Major refactoring of auth domain, frontend token handling

**Backward Compatibility**: BROKEN (existing JWT auth no longer supported)

**Security**: IMPROVED

**Recommendation**: PROCEED with caution, comprehensive testing, and gradual rollout

**Status**: Ready for team review and approval
