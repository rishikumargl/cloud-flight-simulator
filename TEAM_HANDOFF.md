# Cloud Flight Simulator — Backend Architecture Handoff Document

**Date:** 2026-06-23
**For:** Team Member (Any Domain P1–P7)
**Status:** Ready to Work

---

## 1. THE SHARED SQLALCHEMY BASE

**Location:** `backend/app/database.py`

```python
from sqlalchemy.orm import declarative_base
Base = declarative_base()
```

**What it is:** The shared ORM registry. All models inherit from this.

**How to use it:** When creating a new model:

```python
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base
from uuid import UUID, uuid4

class MyModel(Base):
    __tablename__ = "my_table"
    
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(255))
```

**Key:** Register your model in the same `Base` so migrations and schema sync work.

---

## 2. GET_DB DATABASE-SESSION DEPENDENCY

**Location:** `backend/app/dependencies/__init__.py`

```python
from app.database import SessionLocal

def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

**What it is:** FastAPI dependency that creates a database session per request.

**How to use it:** Inject it into any endpoint or dependency:

```python
from fastapi import Depends
from sqlalchemy.orm import Session
from app.dependencies import get_db

@app.get("/my-route")
def my_endpoint(db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_id == some_id).first()
    db.commit()  # YOU must commit
    return user
```

**Important:** You must call `db.commit()` after writes. The dependency does NOT auto-commit.

---

## 3. SQLALCHEMY: SYNC OR ASYNC?

**Answer: SYNCHRONOUS**

**Evidence:**
- Engine: `create_engine()` not `create_async_engine()`
- Session: `sessionmaker()` not `async_sessionmaker()`
- No `AsyncSession` anywhere in codebase
- No `await db.execute()` calls

**Implication:** Write normal (non-async) database code:

```python
# ✓ CORRECT
user = db.query(User).filter(User.user_id == uid).first()

# ✗ WRONG
user = await db.query(User).filter(User.user_id == uid).first()  # Will fail
```

---

## 4. GET_CURRENT_USER AUTHENTICATION DEPENDENCY

**Location:** `backend/app/dependencies/auth.py`

```python
async def get_current_user(
    authorization: str | None = Header(None),
    db: Session = Depends(get_db),
) -> UserResponse:
```

**What it does:**
1. Extracts JWT from `Authorization: Bearer <token>` header
2. Verifies RS256 signature using Clerk's public key
3. Looks up or creates local user in `users` table
4. Returns `UserResponse` (see below)

**Returns:** `UserResponse` object with these fields:

```python
{
    "user_id": UUID,           # Application-generated UUID
    "email": str | None,       # From Clerk API (nullable)
    "full_name": str | None,   # From Clerk API (nullable)
    "role": str,               # From local database (never null)
    "created_at": datetime,    # Timestamp of user creation
}
```

**How to use it:** Inject it in protected endpoints:

```python
@app.post("/my-protected-route")
async def protected_endpoint(
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    print(f"User {current_user.user_id} with role {current_user.role}")
    return {"success": True}
```

**Security:** Any endpoint using `Depends(get_current_user)` requires a valid Clerk JWT.

---

## 5. EXACT CURRENT-USER FIELDS

### Schema: UserResponse

**File:** `backend/app/auth/schemas.py`

| Field | Type | Nullable | Source | Notes |
|-------|------|----------|--------|-------|
| `user_id` | UUID | No | Local DB | Primary key, auto-generated |
| `email` | str | Yes | Clerk API | May be null if Clerk fetch failed |
| `full_name` | str | Yes | Clerk API | May be null if Clerk fetch failed |
| `role` | str | No | Local DB | Default `"LEARNER"`, never null |
| `created_at` | datetime | No | Local DB | User creation timestamp |

### Example Response

```json
{
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "alice@example.com",
    "full_name": "Alice Smith",
    "role": "LEARNER",
    "created_at": "2026-06-23T10:00:00+00:00"
}
```

---

## 6. EXACT ROLE VALUES

**Source:** `backend/app/models/users.py`

```python
role: Mapped[str] = mapped_column(String(50), nullable=False, default="LEARNER")
```

**Valid roles (from CLAUDE.md):**

| Role | Use Case | Default? |
|------|----------|----------|
| `"LEARNER"` | Regular learner account | Yes |
| `"ADMIN"` | Admin with access to admin routes | No |
| `"PLATFORM_ADMIN"` | Platform-level admin | No |

**How to check role in code:**

```python
if current_user.role == "LEARNER":
    # Learner-only logic
elif current_user.role in ["ADMIN", "PLATFORM_ADMIN"]:
    # Admin logic
```

---

## 7. AUDIT TRANSACTION POLICY

**Current Status:** UNDEFINED — awaiting team decision.

### Question
Should `audit_service.write_event()` commit independently, or participate in the caller's transaction?

### Option A: Independent Commit (Recommended)

```python
def write_event(db: Session, event_type: str, ...):
    event = AuditEvent(event_type=event_type, ...)
    db.add(event)
    db.commit()  # ← Commits immediately
```

**Pros:**
- Audit trail guaranteed even if caller rolls back
- No data loss for audits

**Cons:**
- Breaks transaction atomicity
- If caller fails after audit succeeds, audit exists but operation doesn't

### Option B: Caller Transaction Participation

```python
def write_event(db: Session, event_type: str, ...):
    event = AuditEvent(event_type=event_type, ...)
    db.add(event)
    # ← No commit; caller must commit
```

**Pros:**
- Atomic: if caller rolls back, audit rolls back too

**Cons:**
- Audit lost if caller transaction fails
- Violates "audit trail is immutable" principle

### Recommendation
**Option A (independent commit)** — audit is a critical compliance trail and should never be lost.

**TODO:** Get explicit decision from team lead before implementing.

---

## 8. MIGRATION PLAN: AUDIT_EVENTS TABLE

### Table Schema

```sql
CREATE TABLE audit_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50) NOT NULL,
    source VARCHAR(50) NOT NULL,
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    resource_type VARCHAR(100),
    resource_id UUID,
    action VARCHAR(20) NOT NULL,
    details JSONB NOT NULL DEFAULT '{}',
    status VARCHAR(20) NOT NULL,
    error_message TEXT,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    request_id VARCHAR(255)
);
```

### Indexes

```sql
CREATE INDEX idx_audit_events_user_id ON audit_events(user_id);
CREATE INDEX idx_audit_events_timestamp ON audit_events(timestamp DESC);
CREATE INDEX idx_audit_events_event_type ON audit_events(event_type);
CREATE INDEX idx_audit_events_request_id ON audit_events(request_id);
```

### Migration File

**Path:** `backend/migrations/versions/00X_create_audit_events.py`
**Author:** P2 only (owns all migrations per CLAUDE.md)

### Event Types (from CLAUDE.md)

```
USER_REGISTERED, USER_LOGIN, USER_LOGOUT
MISSION_GENERATED
CHALLENGE_STARTED, CHALLENGE_STOPPED
SUBMISSION_CREATED
EVALUATION_RUN, EVALUATION_COMPLETE
FEEDBACK_GENERATED
PROGRESS_SYNCED
```

### Status: NOT YET IMPLEMENTED

- `audit_dependency.py` — empty (0 bytes)
- No `audit/` service directory
- No `AuditEvent` model
- No migration yet

---

## QUICK REFERENCE: WHAT YOU CAN DO NOW

### ✓ Ready to Implement
- New models (inherit from `Base`)
- Database queries (use injected `get_db`)
- Protected endpoints (use `Depends(get_current_user)`)
- Role-based access control (check `current_user.role`)
- Any feature that reads/writes `users`, `missions`, `challenge_sessions`, `environments`, `submissions`, `evaluations`, `feedback_reports`

### ⏳ Blocked Until Decision
- Audit write logic (waiting on transaction policy decision)
- Audit endpoints (waiting on table migration)

### ✗ Not Yet Implemented
- Audit service (`audit_service.write_event()`)
- Audit table (`audit_events`)
- Audit model (`AuditEvent`)

---

## QUICK ANSWERS

| Question | Answer |
|----------|--------|
| How do I query the database? | Use injected `Session` from `get_db()` |
| How do I protect an endpoint? | Use `Depends(get_current_user)` |
| What roles exist? | LEARNER, ADMIN, PLATFORM_ADMIN |
| What's the current user's user_id? | `current_user.user_id` (UUID) |
| What's the current user's role? | `current_user.role` (string, never null) |
| Can I use async ORM? | No — codebase is sync-only |
| Should audit commit independently? | ESCALATE TO TEAM LEAD |
| When is audit_events table ready? | ESCALATE TO P2 |

---

**Status:** READY FOR TEAM USE
**Last Updated:** 2026-06-23
