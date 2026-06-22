# Database Migration Plan: Keycloak Integration

**Date**: 2026-06-22  
**Status**: SPECIFICATION — AWAITING APPROVAL  
**Scope**: All database schema changes required for Keycloak migration  
**Owner**: P2 (Backend Platform Lead, sole migration author)  
**Governance**: CLAUDE.md Section 5 (Frozen Database Rules)

---

## OVERVIEW

Keycloak migration requires exactly ONE Alembic migration file that:

1. Removes `password_hash` column (passwords managed by Keycloak)
2. Removes `role` column (roles come from Keycloak JWT)
3. Adds `keycloak_id` column (maps to Keycloak subject ID)
4. Adds `last_login_at` column (track user activity)
5. Drops `refresh_tokens` table (Keycloak manages tokens)

**Critical**: No new tables are created. Database remains at 8 tables.

---

## CURRENT SCHEMA (Before Migration)

### Table: `users`

```sql
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(20) NOT NULL DEFAULT 'LEARNER',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

### Table: `refresh_tokens`

```sql
CREATE TABLE refresh_tokens (
    token_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id),
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
```

---

## TARGET SCHEMA (After Migration)

### Table: `users`

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

### Table: `refresh_tokens`

**DROPPED** (no longer exists)

---

## MIGRATION OPERATIONS

### Operation 1: Add `keycloak_id` Column

```python
op.add_column(
    'users',
    sa.Column('keycloak_id', sa.String(255), nullable=True)
)
```

**Rationale**: Maps local user_id to Keycloak subject ID  
**Nullable first**: Because existing users don't yet have keycloak_id  
**Will make NOT NULL**: After data migration

### Operation 2: Create Unique Index on `keycloak_id`

```python
op.create_unique_constraint(
    'uq_users_keycloak_id',
    'users',
    ['keycloak_id']
)
```

**Rationale**: Prevents duplicate Keycloak user records  
**Order matters**: Must come after column creation

### Operation 3: Add `last_login_at` Column

```python
op.add_column(
    'users',
    sa.Column(
        'last_login_at',
        sa.DateTime(timezone=True),
        server_default=sa.func.now(),
        nullable=False
    )
)
```

**Rationale**: Track user activity for analytics  
**server_default**: Existing rows get current timestamp

### Operation 4: Remove `role` Column

```python
op.drop_column('users', 'role')
```

**Rationale**: Role comes from Keycloak JWT realm_access.roles  
**Data loss**: No production impact (role is derived at runtime)

### Operation 5: Remove `password_hash` Column

```python
op.drop_column('users', 'password_hash')
```

**Rationale**: Keycloak manages passwords, not the application  
**Data loss**: Password hashes are deleted (acceptable, Keycloak has new hashes)

### Operation 6: Drop `idx_users_role` Index

```python
op.drop_index('idx_users_role', table_name='users')
```

**Rationale**: Index on dropped `role` column  
**Automatic**: Usually dropped with column, but explicit is safer

### Operation 7: Drop `refresh_tokens` Table

```python
op.drop_table(
    'refresh_tokens',
    postgresql_cascade=True
)
```

**Rationale**: Keycloak manages refresh token lifecycle  
**CASCADE**: Drops dependent foreign keys/indexes  
**Table no longer needed**: No local token storage required

### Operation 8: Make `keycloak_id` NOT NULL

```python
op.alter_column(
    'users',
    'keycloak_id',
    existing_type=sa.String(255),
    nullable=False
)
```

**Timing**: After existing users are migrated (see "Data Migration" below)  
**Error handling**: If any user has NULL keycloak_id, migration fails (catch before downtime)

---

## ALEMBIC MIGRATION FILE

### File: `backend/migrations/versions/003_keycloak_migration.py`

```python
"""Keycloak OIDC migration: remove JWT auth, add Keycloak integration

Revision ID: 003_keycloak_migration
Revises: 002_initial_schema  # Adjust based on actual prior revision
Create Date: 2026-06-22 14:30:00+00:00

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic
revision = '003_keycloak_migration'
down_revision = '002_initial_schema'  # Change to match your prior migration
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Migrate from JWT auth to Keycloak OIDC.
    
    Steps:
    1. Add keycloak_id column (nullable, for gradual migration)
    2. Create unique index on keycloak_id
    3. Add last_login_at column with server default
    4. Drop role column (now derived from Keycloak JWT)
    5. Drop password_hash column (now managed by Keycloak)
    6. Drop idx_users_role index (supporting dropped column)
    7. Drop refresh_tokens table (Keycloak manages tokens)
    8. Make keycloak_id NOT NULL (requires pre-migration of data)
    """
    
    # Step 1: Add keycloak_id (nullable initially)
    op.add_column(
        'users',
        sa.Column('keycloak_id', sa.String(255), nullable=True)
    )
    
    # Step 2: Create unique constraint to prevent duplicates
    op.create_unique_constraint(
        'uq_users_keycloak_id',
        'users',
        ['keycloak_id']
    )
    
    # Step 3: Add last_login_at with default
    op.add_column(
        'users',
        sa.Column(
            'last_login_at',
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False
        )
    )
    
    # Step 4: Drop role column (no longer needed)
    op.drop_column('users', 'role')
    
    # Step 5: Drop password_hash column (Keycloak manages passwords)
    op.drop_column('users', 'password_hash')
    
    # Step 6: Drop idx_users_role index (supporting dropped column)
    op.drop_index('idx_users_role', table_name='users')
    
    # Step 7: Drop refresh_tokens table (Keycloak manages tokens)
    op.drop_table('refresh_tokens')
    
    # Step 8: Make keycloak_id NOT NULL
    # WARNING: This assumes data migration has populated keycloak_id for all users
    # If any user has NULL keycloak_id at this point, the migration will fail
    op.alter_column(
        'users',
        'keycloak_id',
        existing_type=sa.String(255),
        nullable=False
    )


def downgrade() -> None:
    """
    Reverse Keycloak migration (restore to JWT auth).
    
    WARNING: This is a destructive downgrade.
    - User password_hash values are lost (cannot be restored from Keycloak)
    - User role values are lost
    - refresh_tokens data is lost
    - last_login_at data is lost
    
    Only use if migration fails before data is live.
    """
    
    # Step 1: Recreate refresh_tokens table
    op.create_table(
        'refresh_tokens',
        sa.Column('token_id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('token_hash', sa.String(255), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ),
        sa.PrimaryKeyConstraint('token_id')
    )
    op.create_index('idx_refresh_tokens_user', 'refresh_tokens', ['user_id'])
    
    # Step 2: Add idx_users_role index
    op.create_index('idx_users_role', 'users', ['role'])
    
    # Step 3: Add password_hash column (with NULL placeholder)
    op.add_column(
        'users',
        sa.Column('password_hash', sa.String(255), nullable=True)
    )
    
    # Step 4: Add role column (with default)
    op.add_column(
        'users',
        sa.Column('role', sa.String(20), nullable=False, server_default='LEARNER')
    )
    
    # Step 5: Drop last_login_at column
    op.drop_column('users', 'last_login_at')
    
    # Step 6: Drop keycloak_id column
    op.drop_column('users', 'keycloak_id')
```

---

## DATA MIGRATION STRATEGY

### Challenge: Existing Users

**Problem**: Old users have password_hash and role, but no keycloak_id.

**Options**:

#### Option 1: Force Re-authentication (Recommended)

**Steps**:
1. Run Alembic migration (adds keycloak_id column as nullable)
2. Deploy new code (backend no longer validates old passwords)
3. On app startup, check for users with NULL keycloak_id
4. Automatically log them out (clear their sessions)
5. When they log back in via Keycloak, keycloak_id is populated
6. Final step: Make keycloak_id NOT NULL

**Pros**: 
- Clean migration (no password reset code needed)
- Forces all users to authenticate via Keycloak
- No risk of stale password hashes

**Cons**: 
- Users must log in again
- Brief downtime for users

**Timeline**:
1. Migration deploys with keycloak_id nullable
2. Users are redirected to login
3. First login populates keycloak_id
4. After 7 days, all users have keycloak_id
5. Final migration: make keycloak_id NOT NULL

#### Option 2: Batch Keycloak User Creation (Advanced)

**Steps**:
1. Before cutover, create all users in Keycloak with same email+password
2. In migration, populate keycloak_id from Keycloak API
3. Make keycloak_id NOT NULL immediately

**Pros**: 
- Users don't need to log in again
- Existing passwords continue to work (via Keycloak)
- Smoother UX

**Cons**: 
- Requires script to call Keycloak admin API
- Risk of mismatched email/password
- More complex

**Not recommended** for first migration. Keep it simple.

#### Recommendation: Option 1 (Force Re-authentication)

It's cleaner and forces all users through Keycloak's password reset flow, ensuring they have valid accounts.

---

## MIGRATION EXECUTION CHECKLIST

### Pre-Migration (Day Before)

- [ ] Backup PostgreSQL database
- [ ] Notify users of planned maintenance
- [ ] Prepare rollback plan
- [ ] Test migration on staging database
- [ ] Verify migration runs in < 5 minutes (no long locks)
- [ ] Prepare Keycloak server (realm, clients configured)

### Migration Day

- [ ] Stop backend application
- [ ] Run Alembic upgrade: `alembic upgrade head`
- [ ] Verify migration succeeded (check schema)
- [ ] Deploy new backend code (with Keycloak JWT validation)
- [ ] Deploy new frontend code (with keycloak-js)
- [ ] Start backend application
- [ ] Test endpoints: /health, /auth/me (should fail without Keycloak JWT)
- [ ] Monitor logs for errors

### Post-Migration

- [ ] Users attempt to log in
- [ ] Verify Keycloak provisioning works (GET /auth/me creates users)
- [ ] Check audit events for USER_REGISTERED
- [ ] Monitor for any schema-related errors
- [ ] After 7 days: Run second migration to make keycloak_id NOT NULL
- [ ] Celebrate 🎉

---

## MIGRATION TESTING PLAN

### Test 1: Migration Can Run & Rollback

```bash
# Restore from backup
pg_restore prod_backup.sql

# Run migration forward
alembic upgrade head

# Verify schema
psql -c "SELECT column_name FROM information_schema.columns WHERE table_name='users' ORDER BY ordinal_position;"

# Should show: user_id, keycloak_id, email, full_name, created_at, updated_at, last_login_at

# Verify refresh_tokens is gone
psql -c "SELECT * FROM refresh_tokens;" 
# Should return: ERROR: relation "refresh_tokens" does not exist
```

### Test 2: First-Login Provisioning Works

```python
# Simulate first-time user logging in via Keycloak
keycloak_jwt = create_signed_jwt({
    'sub': 'test-user-123',
    'email': 'testuser@example.com',
    'name': 'Test User',
    'realm_access': {'roles': ['learner']}
})

# Call /auth/me
response = requests.get(
    'http://localhost:8000/auth/me',
    headers={'Authorization': f'Bearer {keycloak_jwt}'}
)

# Verify response
assert response.status_code == 200
data = response.json()['data']
assert data['email'] == 'testuser@example.com'
assert data['role'] == 'LEARNER'

# Verify user created in DB
user = db.query(User).filter(User.keycloak_id == 'test-user-123').first()
assert user is not None
assert user.keycloak_id == 'test-user-123'
```

### Test 3: Returning User Works

```python
# Same user logs in again
response2 = requests.get(
    'http://localhost:8000/auth/me',
    headers={'Authorization': f'Bearer {keycloak_jwt}'}
)

# Should succeed and return same user_id
assert response2.json()['data']['user_id'] == data['user_id']

# Verify last_login_at was updated
user_updated = db.query(User).filter(User.keycloak_id == 'test-user-123').first()
assert user_updated.last_login_at > user_updated.created_at
```

### Test 4: Protected Routes Require Valid JWT

```python
# Attempt to call protected route without JWT
response = requests.post('http://localhost:8000/challenges/start')

# Should fail with 401
assert response.status_code == 401
```

---

## ROLLBACK PROCEDURE

**If migration fails or causes issues**:

1. **Stop application**
2. **Restore database from backup**:
   ```bash
   psql < backup_pre_migration.sql
   ```
3. **Revert code to pre-migration version**
4. **Restart application**
5. **Verify functionality**

**Downside**: Any users who logged in after migration are lost. Not a big deal if caught quickly.

---

## PERFORMANCE CONSIDERATIONS

### Index Changes

**Removed indices**:
- `idx_users_role` — no longer needed (role column removed)

**Added indices**:
- `idx_users_keycloak_id` — needed for JWT lookup

**Impact**: 
- Queries by keycloak_id are now indexed (fast)
- Queries by role no longer possible (not needed, role is derived)

### Table Size

**refresh_tokens table**: 
- Typically small (1 refresh token per active user)
- Dropping it saves minimal disk space
- No performance impact

### Query Changes

**Before**:
```sql
SELECT user_id FROM users WHERE email = 'user@example.com' AND password_hash = ?;
```

**After**:
```sql
SELECT user_id FROM users WHERE keycloak_id = ?;
```

No performance regression. Simpler query.

---

## DISASTER RECOVERY

### Scenario: Keycloak Deleted Wrong User

**If a user's Keycloak account is deleted but local record exists**:

**Option 1: Keep local user, delete local record**
- User cannot log in (JWT won't be issued for deleted Keycloak account)
- Local record can be preserved for audit history
- Or deleted if GDPR right-to-be-forgotten applies

**Option 2: Recreate Keycloak user**
- Admin recreates user in Keycloak (same email)
- User logs in and is linked to same local record
- Seamless recovery

---

## SUMMARY

This migration is **relatively straightforward**:

✅ Single Alembic file  
✅ ~8 SQL operations  
✅ No new tables  
✅ No schema conflicts  
✅ Testable on staging  
✅ Reversible (with caveats)  
✅ Minimal downtime

**Timeline**: 10-15 minutes for migration  
**Risk**: LOW (straightforward schema change)  
**Rollback**: 10-15 minutes

**Status**: Specification complete, ready for implementation
