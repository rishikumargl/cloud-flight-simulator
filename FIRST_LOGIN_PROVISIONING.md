# First Login Provisioning Contract

**Date**: 2026-06-22  
**Status**: SPECIFICATION — AWAITING APPROVAL  
**Scope**: Formal specification for user creation on first Keycloak login  
**Owner**: P2 (Backend Platform Lead)  
**Consumers**: Frontend (P1), Audit Service (P7)

---

## OVERVIEW

When a user authenticates via Keycloak for the first time, the application must create a local user record to track:
1. Application-level user ID (for foreign keys across all domains)
2. Keycloak ID (for future JWT lookups)
3. User metadata (email, full name)
4. Account creation timestamp

This document specifies the exact behavior of the `GET /auth/me` endpoint during first login.

---

## TRIGGER CONDITION

**First login provisioning is triggered when**:

```
User logs in to Keycloak (any provider: email, Google, Microsoft)
→ Keycloak issues JWT with claims {sub, email, name, realm_access.roles}
→ Frontend calls GET /auth/me with Authorization: Bearer {KEYCLOAK_JWT}
→ Backend get_current_user() dependency:
    1. Validates JWT signature
    2. Extracts claims
    3. Queries local users table: SELECT * FROM users WHERE keycloak_id = ?
    4. Result: NOT FOUND (first login)
    5. → Trigger: CREATE local user
```

---

## USER CREATION PROCESS

### Input: Keycloak JWT Claims

**Claims extracted from JWT**:

```json
{
  "sub": "e6e63a5e-6f62-4afe-a546-a1234abcdef0",
  "email": "learner@example.com",
  "name": "Alice Smith",
  "email_verified": true,
  "realm_access": {
    "roles": ["learner"]
  }
}
```

**Claims mapping**:
- `sub` → `keycloak_id`
- `email` → `email`
- `name` → `full_name`
- `realm_access.roles[0]` → determine application `role`

### Business Logic: Create User

**Pseudocode in get_current_user()**:

```python
async def get_current_user(authorization: str = Header(...)) -> UserSchema:
    # Step 1: Extract and validate JWT
    token = authorization[7:]  # Strip "Bearer "
    claims = validate_keycloak_jwt(token)
    keycloak_id = claims['sub']
    
    # Step 2: Lookup existing user
    user = db.query(User).filter(User.keycloak_id == keycloak_id).first()
    
    # Step 3: First-login provisioning
    if user is None:
        # CREATE USER BLOCK
        user = User(
            user_id=uuid4(),  # Generate new UUID
            keycloak_id=keycloak_id,
            email=claims['email'],
            full_name=claims.get('name', ''),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            last_login_at=datetime.utcnow()
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Write audit event (P7)
        audit_service.write_event(
            db=db,
            event_type="USER_REGISTERED",
            source="AUTH_SERVICE",
            user_id=str(user.user_id),
            metadata={
                "keycloak_id": keycloak_id,
                "email": user.email,
                "identity_provider": determine_provider(claims)
            }
        )
    else:
        # EXISTING USER BLOCK
        user.last_login_at = datetime.utcnow()
        db.commit()
        
        # Optionally write login audit event
        # audit_service.write_event(event_type="USER_LOGIN", ...)
    
    # Step 4: Return UserSchema
    return UserSchema(
        user_id=str(user.user_id),
        email=user.email,
        full_name=user.full_name,
        role=determine_role(claims['realm_access']['roles']),
        created_at=user.created_at
    )
```

---

## DATABASE OPERATIONS

### Step 1: INSERT into `users` table

**SQL**:
```sql
INSERT INTO users (user_id, keycloak_id, email, full_name, created_at, updated_at, last_login_at)
VALUES (
  'a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6',  -- user_id: UUID
  'e6e63a5e-6f62-4afe-a546-a1234abcdef0',  -- keycloak_id: from JWT sub
  'learner@example.com',                    -- email: from JWT email
  'Alice Smith',                            -- full_name: from JWT name
  '2026-06-22T14:30:00+00:00',             -- created_at: now()
  '2026-06-22T14:30:00+00:00',             -- updated_at: now()
  '2026-06-22T14:30:00+00:00'              -- last_login_at: now()
);
```

**Constraints checked**:
- `user_id`: Primary key, must be unique, generated UUID
- `keycloak_id`: UNIQUE NOT NULL, prevents duplicate Keycloak IDs
- `email`: NOT NULL (from Keycloak email claim)
- All timestamps: NOT NULL

**Unique index on keycloak_id**:
```sql
CREATE UNIQUE INDEX idx_users_keycloak_id ON users(keycloak_id);
```

**Purpose**: Ensures no duplicate users created if JWT is processed twice (idempotent).

### Step 2: INSERT into `audit_events` table (P7 domain)

**Event type**: `USER_REGISTERED`
**Source**: `AUTH_SERVICE`
**User ID**: (newly created user_id)
**Timestamp**: now()
**Metadata**: keycloak_id, email, identity_provider (optional)

```python
audit_service.write_event(
    db=db,
    event_type="USER_REGISTERED",
    source="AUTH_SERVICE",
    user_id=str(user.user_id),
    metadata={
        "keycloak_id": keycloak_id,
        "email": user.email,
        "identity_provider": claims.get('identity_provider', 'email')
    }
)
```

---

## ROLE DETERMINATION

### Role Mapping Function

```python
def determine_role(realm_roles: List[str]) -> str:
    """
    Map Keycloak realm roles to application role.
    
    Keycloak roles are stored in JWT realm_access.roles claim.
    Application roles are: LEARNER, ADMIN, PLATFORM_ADMIN.
    
    Precedence:
    1. If 'platform_admin' in roles → PLATFORM_ADMIN
    2. Else if 'admin' in roles → ADMIN
    3. Else → LEARNER (default)
    """
    if 'platform_admin' in realm_roles:
        return 'PLATFORM_ADMIN'
    elif 'admin' in realm_roles:
        return 'ADMIN'
    else:
        return 'LEARNER'
```

### Identity Provider Detection (Optional)

```python
def determine_provider(claims: dict) -> str:
    """
    Detect which identity provider was used for authentication.
    
    Keycloak adds claims indicating the provider:
    - Local Keycloak: no special claim (or idp='keycloak')
    - Google: idp='google'
    - Microsoft: idp='microsoft'
    
    Fallback: Check email domain or default to 'email'.
    """
    idp = claims.get('idp', 'email')
    return idp
```

---

## ERROR HANDLING

### JWT Validation Failure

```python
try:
    claims = validate_keycloak_jwt(token)
except JWTError as e:
    raise HTTPException(
        status_code=401,
        detail=f"Invalid token: {str(e)}"
    )
```

**Response**: 401 Unauthorized

**No user created**. User must re-authenticate.

### Database Constraint Violation

```python
try:
    db.add(user)
    db.commit()
except IntegrityError as e:
    db.rollback()
    
    # Likely cause: duplicate keycloak_id
    # This can happen if:
    # 1. Race condition: two requests with same JWT arrive simultaneously
    # 2. Database already has this keycloak_id
    
    # Fallback: Query for existing user
    existing = db.query(User).filter(User.keycloak_id == keycloak_id).first()
    if existing:
        return UserSchema(...)  # Return existing user
    else:
        raise HTTPException(
            status_code=500,
            detail="Failed to create user"
        )
```

**Response**: 500 Internal Server Error (or retry with backoff)

---

## IDEMPOTENCY

**Guarantee**: Calling GET /auth/me multiple times with the same JWT results in the same user record.

**Mechanism**:
1. `keycloak_id` UNIQUE constraint prevents duplicate inserts
2. If insert fails due to duplicate, query for existing user
3. Return UserSchema for existing user
4. Frontend treats as success

**Edge case**: Race condition where two identical requests arrive simultaneously

```
Request A: INSERT user (keycloak_id=X)
Request B: INSERT user (keycloak_id=X)  // Arrives before A commits

Outcome:
- One request succeeds (wins)
- Other request gets IntegrityError
- IntegrityError triggers SELECT by keycloak_id
- Both requests return same UserSchema

Result: Idempotent, no duplicates
```

---

## LAST_LOGIN_AT TRACKING

### On First Login

`last_login_at` set to creation timestamp (same as `created_at`).

### On Subsequent Logins

Each time GET /auth/me is called:

```python
if user is not None:
    user.last_login_at = datetime.utcnow()
    db.commit()
```

**Purpose**: Track active users for analytics, cleanup, etc.

---

## RETURN VALUE: UserSchema

**Contract signature** (from P2_PLATFORM.md):

```json
{
  "user_id": "uuid",
  "email": "learner@example.com",
  "full_name": "John Doe",
  "role": "LEARNER",
  "created_at": "timestamp"
}
```

**HTTP Response** (after successful provisioning):

```json
{
  "success": true,
  "data": {
    "user_id": "a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6",
    "email": "learner@example.com",
    "full_name": "Alice Smith",
    "role": "LEARNER",
    "created_at": "2026-06-22T14:30:00+00:00"
  }
}
```

**Status code**: 200 OK

---

## FRONTEND BEHAVIOR AFTER FIRST-LOGIN PROVISIONING

```javascript
// AuthCallbackPage.jsx
useEffect(() => {
  keycloak.init({...}).then(authenticated => {
    if (authenticated) {
      // Call /auth/me to get or create user
      fetch('/auth/me', {
        headers: { 'Authorization': `Bearer ${keycloak.token}` }
      })
      .then(res => res.json())
      .then(response => {
        const user = response.data;  // UserSchema
        
        // Store in Zustand
        useAuthStore.setState({
          user,
          isAuthenticated: true,
          role: user.role
        });
        
        // Save tokens to localStorage
        localStorage.setItem('keycloak_access_token', keycloak.token);
        localStorage.setItem('keycloak_refresh_token', keycloak.refreshToken);
        
        // Redirect to dashboard
        navigate('/dashboard');
      });
    }
  });
}, []);
```

**Flow**:
1. keycloak-js obtains Keycloak JWT
2. Frontend calls GET /auth/me
3. Backend creates local user (or returns existing)
4. Frontend stores user in state
5. Frontend redirects to dashboard
6. User can now access protected endpoints

---

## DATABASE SCHEMA

### Required Table: `users`

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

CREATE INDEX idx_users_keycloak_id ON users(keycloak_id);
CREATE INDEX idx_users_email ON users(email);
```

### Migration

Create Alembic migration to:
1. Remove `password_hash` column (no longer needed)
2. Remove `role` column (moved to Keycloak JWT)
3. Add `keycloak_id` column (UNIQUE)
4. Add `last_login_at` column

```python
# backend/migrations/versions/003_keycloak_migration.py
def upgrade():
    op.add_column('users', sa.Column('keycloak_id', sa.String(255), nullable=True))
    op.create_unique_constraint(None, 'users', ['keycloak_id'])
    op.add_column('users', sa.Column('last_login_at', sa.DateTime(timezone=True)))
    op.drop_column('users', 'password_hash')
    op.drop_column('users', 'role')

def downgrade():
    # Reverse...
```

---

## AUDIT TRAIL

### Event Type: USER_REGISTERED

**Emitted when**: User logs in to Keycloak for the first time and local user is created

**Event structure**:

```json
{
  "event_type": "USER_REGISTERED",
  "source": "AUTH_SERVICE",
  "user_id": "a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6",
  "timestamp": "2026-06-22T14:30:00+00:00",
  "metadata": {
    "keycloak_id": "e6e63a5e-6f62-4afe-a546-a1234abcdef0",
    "email": "learner@example.com",
    "identity_provider": "email"
  }
}
```

**Consumers**: P7 (Audit Service)

---

## CONSISTENCY GUARANTEES

### Local User Record

After GET /auth/me returns successfully:

**Guarantee 1: User exists in local DB**
```sql
SELECT * FROM users WHERE user_id = '<user_id_from_response>' LIMIT 1;
-- Returns exactly 1 row
```

**Guarantee 2: Keycloak ID is mapped**
```sql
SELECT user_id FROM users WHERE keycloak_id = '<keycloak_id_from_jwt>' LIMIT 1;
-- Returns exactly 1 row
```

**Guarantee 3: Email and full_name are set**
```sql
SELECT email, full_name FROM users WHERE user_id = '<user_id>' LIMIT 1;
-- Both columns have values (even if '' for full_name)
```

**Guarantee 4: Timestamps are set**
```sql
SELECT created_at, updated_at, last_login_at FROM users WHERE user_id = '<user_id>' LIMIT 1;
-- All three are non-NULL
```

---

## SECURITY CONSIDERATIONS

### No Password Storage

Local `users` table contains NO password information. All password management is delegated to Keycloak.

### Keycloak ID is Not User ID

`keycloak_id` (from JWT sub claim) is NOT the application `user_id`.

**Why**: Allows decoupling application users from Keycloak accounts. If a user's Keycloak account is deleted, the local user record can remain for historical/audit purposes.

### Email is Denormalized

Email is stored in local `users` table even though it's also in Keycloak.

**Why**: 
- Convenience for local queries without calling Keycloak API
- Historical record if Keycloak email changes
- Audit trail of what email was used

### No Implicit Data Sharing

Application must not expose `keycloak_id` in API responses (except in metadata for debugging).

`UserSchema` contains: user_id, email, full_name, role, created_at.

`UserSchema` does NOT contain: keycloak_id, password_hash, refresh_tokens.

---

## TESTING STRATEGY

### Test 1: First-Time Login

```python
def test_first_login_creates_user():
    # Simulate Keycloak JWT
    token = create_keycloak_jwt(
        sub='test-keycloak-id-123',
        email='test@example.com',
        name='Test User',
        roles=['learner']
    )
    
    # Call /auth/me
    response = client.get(
        '/auth/me',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    # Verify response
    assert response.status_code == 200
    data = response.json()['data']
    assert data['user_id'] is not None
    assert data['email'] == 'test@example.com'
    assert data['full_name'] == 'Test User'
    assert data['role'] == 'LEARNER'
    
    # Verify user was created
    user = db.query(User).filter(User.keycloak_id == 'test-keycloak-id-123').first()
    assert user is not None
    assert user.email == 'test@example.com'
```

### Test 2: Returning Login

```python
def test_returning_login_updates_timestamp():
    # Create existing user
    user = User(
        keycloak_id='existing-id',
        email='existing@example.com',
        full_name='Existing User'
    )
    db.add(user)
    db.commit()
    
    # Call /auth/me with same keycloak_id
    token = create_keycloak_jwt(sub='existing-id', email='existing@example.com')
    response = client.get('/auth/me', headers={'Authorization': f'Bearer {token}'})
    
    # Verify same user_id returned
    assert response.json()['data']['user_id'] == str(user.user_id)
    
    # Verify last_login_at was updated
    user.refresh()
    assert user.last_login_at > user.created_at
```

### Test 3: Idempotency

```python
def test_get_auth_me_is_idempotent():
    token = create_keycloak_jwt(sub='idempotent-test')
    
    # Call 1
    response1 = client.get('/auth/me', headers={'Authorization': f'Bearer {token}'})
    user_id_1 = response1.json()['data']['user_id']
    
    # Call 2 (same token)
    response2 = client.get('/auth/me', headers={'Authorization': f'Bearer {token}'})
    user_id_2 = response2.json()['data']['user_id']
    
    # Verify same user_id returned both times
    assert user_id_1 == user_id_2
    
    # Verify only one user record exists
    users = db.query(User).filter(User.keycloak_id == 'idempotent-test').all()
    assert len(users) == 1
```

### Test 4: Invalid JWT

```python
def test_invalid_jwt_returns_401():
    response = client.get(
        '/auth/me',
        headers={'Authorization': 'Bearer invalid-token'}
    )
    
    assert response.status_code == 401
    
    # Verify no user was created
    users = db.query(User).all()
    assert len(users) == 0
```

---

## SUMMARY

**First-login provisioning is the bridge between Keycloak (external identity) and the application (local business logic).**

| Step | Responsibility | Owner |
|------|-----------------|-------|
| User authenticates | Keycloak | External |
| JWT is issued | Keycloak | External |
| Frontend calls /auth/me | Frontend (P1) | P1 |
| JWT validation | Backend (P2) | P2 |
| Local user creation | Backend (P2) | P2 |
| Audit event | Audit Service (P7) | P7 |
| Response to frontend | Backend (P2) | P2 |
| Frontend state update | Frontend (P1) | P1 |

**Status**: Specification complete, awaiting approval
