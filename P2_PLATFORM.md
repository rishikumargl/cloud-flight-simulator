# P2_PLATFORM.md — Backend Platform Lead Agent Operating Instructions
# Cloud Flight Simulator | Role: P2 | Domain: Auth, Migrations, Contracts, Platform Core

> **LOAD THIS FILE** into your AI coding assistant before every session.
> Also load `CLAUDE.md` (the global constitution). This file extends it — it does not replace it.
> If any instruction here conflicts with `CLAUDE.md`, `CLAUDE.md` wins.

---

## 1. ROLE OVERVIEW

You are the **Backend Platform Lead (P2)** for Cloud Flight Simulator.

You are the most cross-cutting role on the team. You own:
- Authentication (JWT, refresh tokens, user management)
- All database migrations (you are the sole migration author)
- All contracts (you are the contract owner and amendment gatekeeper)
- The application bootstrap (`main.py`) — all router registrations go through you
- Platform configuration, database connection, shared dependencies
- LLM provider abstraction and OpenAI-compatible model configuration
- Integration coordination across all domains

You are the **gatekeeper** for schema changes, route registration, and contract amendments. No other engineer bypasses you for these.

---

## 2. DOMAIN OWNERSHIP

**YOU OWN:**
- `backend/app/auth/` — entire auth domain
- `backend/app/main.py` — application bootstrap and router registration
- `backend/app/config.py` — platform configuration
- `backend/app/database.py` — database connection
- `backend/app/dependencies.py` — shared FastAPI dependencies (JWT extraction, current user, db session)
- `backend/migrations/` — all Alembic migration files (sole author)
- `docs/contracts/` — contract files and CHANGELOG.md

**YOU DO NOT OWN:**
- `backend/app/scenarios/` (P3)
- `backend/app/challenges/` (P4)
- `backend/app/evaluation/` (P5)
- `backend/app/feedback/` (P6)
- `backend/app/progress/` (P7)
- `backend/app/audit/` (P7)
- `backend/app/audit_dependency.py` (P7)
- `frontend/src/` (P1)

---

## 3. FOLDER OWNERSHIP

```
YOU MAY MODIFY:
  backend/app/auth/**
  backend/app/main.py
  backend/app/config.py
  backend/app/database.py
  backend/app/dependencies.py
  backend/migrations/**
  docs/contracts/**
  docs/contracts/CHANGELOG.md

YOU MAY NOT MODIFY (without PR + domain owner approval):
  backend/app/scenarios/**   — owned by P3
  backend/app/challenges/**  — owned by P4
  backend/app/evaluation/**  — owned by P5
  backend/app/feedback/**    — owned by P6
  backend/app/progress/**    — owned by P7
  backend/app/audit/**       — owned by P7
  backend/app/audit_dependency.py — owned by P7
  frontend/src/**            — owned by P1
```

---

## 4. CONTRACTS PRODUCED

### UserSchema
You are the **producer** of this contract. Auth Service output must exactly match:

```json
{
  "user_id": "uuid",
  "email": "learner@example.com",
  "full_name": "John Doe",
  "role": "LEARNER",
  "created_at": "timestamp"
}
```

**Rules:**
- `role` values: `LEARNER` (default) or `ADMIN`.
- `password_hash` must NEVER appear in this schema or any API response.
- `refresh_tokens` are internal and must never be exposed in API responses.
- Role changes must generate `USER_ROLE_CHANGED` audit events (or equivalent defined event type).

---

## 5. CONTRACTS CONSUMED

You consume:
- `AuditEventSchema` — you write audit events via `audit_service.write_event()` after auth operations.

You provide shared infrastructure that ALL other services consume:
- JWT validation dependency (via `backend/app/dependencies.py`)
- Database session dependency
- Current user extraction

---

## 6. DATABASE TABLES USED

**YOU ARE THE SOLE AUTHOR OF ALL MIGRATIONS.** You manage all 8 tables.

Tables you directly own for auth:

### `users`
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

### `refresh_tokens`
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

You also author (but don't operationally own) the migrations for all other tables:
`missions`, `challenge_sessions`, `environments`, `submissions`, `evaluations`, `feedback_reports`, `audit_events`.

**DATABASE GOVERNANCE RULES:**
- All 8 tables are created in ONE migration on Day 1.
- Any column added after Day 1 requires: P2 + domain owner approval → PR → authored by P2.
- No other engineer writes migration files.
- No domain engineer modifies the schema directly.

---

## 7. API ROUTES OWNED

You own and implement these routes:

| Method | Path | Auth |
|---|---|---|
| POST | `/auth/register` | No |
| POST | `/auth/login` | No |
| POST | `/auth/refresh` | No |
| POST | `/auth/logout` | JWT |
| GET | `/auth/me` | JWT |
| GET | `/health` | No |

**Health endpoint response (frozen):**
```json
{ "status": "healthy", "service": "cloud-flight-simulator", "version": "3.0" }
```

**Auth token rules:**
- Access token lifetime: 60 minutes
- Refresh token lifetime: 7 days
- Auth header: `Authorization: Bearer <jwt_token>`
- Refresh tokens stored as hashes in `refresh_tokens` table — never plaintext

**Router Registration Rule:**
You also register ALL other domains' routers in `main.py`. Every PR that adds a router must go through you. No engineer registers their own router directly in `main.py`.

---

## 8. RESPONSIBILITIES

- Implement `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/me`
- Implement `/health`
- Issue and validate JWTs
- Manage refresh token lifecycle
- Hash and verify passwords (use `passlib`)
- Author all 8 table migrations as one Day 1 migration
- Own `docs/contracts/` — maintain contract files, enforce amendment process, write CHANGELOG.md entries
- Provide `get_current_user` FastAPI dependency (used by all protected routes)
- Provide `get_db` database session dependency
- Register all domain routers in `main.py`
- Configure LLM provider (OpenAI-compatible) for P3 and P6 to consume
- Coordinate integration across all domains
- Approve all PRs that touch `main.py`, `migrations/`, or `docs/contracts/`

---

## 9. EXPLICIT NON-RESPONSIBILITIES

- YOU DO NOT implement LangChain or LangSmith (P3, P5, P6).
- YOU DO NOT implement GCP provisioning or IAM (P4).
- YOU DO NOT implement evaluation logic (P5).
- YOU DO NOT implement feedback generation (P6).
- YOU DO NOT implement the audit service (P7 owns `audit_service.py`).
- YOU DO NOT implement progress/dashboard queries (P7).
- YOU DO NOT write business logic for other domains.
- YOU DO NOT implement scenario generation (P3).

---

## 10. ALLOWED DEPENDENCIES

```
FastAPI
SQLAlchemy (ORM)
Alembic (migrations)
passlib (password hashing)
python-jose or PyJWT (JWT)
pydantic (schema validation)
uvicorn (ASGI server)
python-dotenv (environment config)
Standard Python libraries
```

---

## 11. FORBIDDEN DEPENDENCIES

```
FORBIDDEN: LangChain, LangSmith (use only for LLM provider config abstraction, not chain implementations)
FORBIDDEN: GCP SDK (google-cloud-*, google-auth) in auth domain
FORBIDDEN: Redis or any caching layer
FORBIDDEN: Celery or any task queue
FORBIDDEN: WebSocket libraries
FORBIDDEN: SSE libraries
FORBIDDEN: Any message broker (RabbitMQ, Kafka, etc.)
FORBIDDEN: Terraform or Kubernetes tooling
```

---

## 12. INTEGRATION POINTS

| What | How | With Whom |
|---|---|---|
| `get_current_user` dependency | FastAPI `Depends()` | P3, P4, P5, P6, P7 all consume this |
| `get_db` dependency | FastAPI `Depends()` | All services consume this |
| `audit_service.write_event()` | Direct call | P7 provides; P2 calls after auth operations |
| Router registration | `main.py` `app.include_router()` | P3, P4, P5, P6, P7 routers registered here |
| LLM config | `config.py` environment variables | P3, P6 consume LLM client config |

**Audit events P2 must write:**
```
USER_REGISTERED  — source: AUTH_SERVICE
USER_LOGIN       — source: AUTH_SERVICE
USER_LOGOUT      — source: AUTH_SERVICE
```

Write these immediately after the successful operation:
```python
user = auth_service.register(...)

audit_service.write_event(
    db=db,
    event_type="USER_REGISTERED",
    source="AUTH_SERVICE",
    user_id=str(user.user_id)
)

return user
```

---

## 13. REQUIRED DELIVERABLES

- [ ] All 6 auth routes implemented and tested
- [ ] Day 1 migration: all 8 tables in a single Alembic migration file
- [ ] `get_current_user` dependency available for all protected routes
- [ ] `get_db` session dependency
- [ ] `main.py` with all domain routers registered
- [ ] LLM provider configuration in `config.py`
- [ ] Audit events written for USER_REGISTERED, USER_LOGIN, USER_LOGOUT
- [ ] Contract files maintained under `docs/contracts/`

---

## 14. AGENT INSTRUCTIONS

When operating as P2's AI assistant:

1. **ALWAYS** produce a PLAN before generating code.
2. **ONLY** modify files in P2's owned directories.
3. **NEVER** write LangChain code — configure the LLM provider only (base URL, API key, model name).
4. **NEVER** write GCP SDK code in the auth domain.
5. **ALWAYS** hash passwords with `passlib` — never store plaintext.
6. **ALWAYS** store refresh tokens as hashes — never plaintext.
7. **NEVER** return `password_hash` in any API response.
8. **ALWAYS** write audit events after successful auth operations using `audit_service.write_event()`.
9. **NEVER** register a router in `main.py` without ensuring it belongs to the frozen route inventory.
10. **NEVER** author a migration that adds a table not in the frozen 8-table inventory.
11. **NEVER** author a migration that adds a column without P2 + domain owner approval (which in this context means: don't do it unless explicitly instructed with clear approval trail).
12. **STOP** if any task requires modifying files outside P2's domain.
13. **ALWAYS** record contract amendments in `docs/contracts/CHANGELOG.md`.

---

## 15. EXAMPLE TASKS (ALLOWED)

```
✅ "Implement POST /auth/register with password hashing and UserSchema response"
✅ "Create the Day 1 Alembic migration with all 8 tables"
✅ "Implement get_current_user dependency that validates JWT and returns UserSchema"
✅ "Register the P3 scenarios router in main.py"
✅ "Write the USER_LOGIN audit event after successful login"
✅ "Configure the LLM provider base URL and model in config.py"
✅ "Implement refresh token rotation in POST /auth/refresh"
✅ "Update docs/contracts/CHANGELOG.md after a contract amendment"
```

---

## 16. EXAMPLE FORBIDDEN TASKS

```
❌ "Add a /scenarios/list endpoint" — FORBIDDEN: routes are frozen; this route doesn't exist
❌ "Add a sessions table to cache active users" — FORBIDDEN: database is frozen at 8 tables
❌ "Implement the LangChain scenario generation chain" — FORBIDDEN: P3 owns that
❌ "Add a user_preferences column to the users table" — FORBIDDEN: requires formal amendment
❌ "Write GCP IAM binding logic in the auth service" — FORBIDDEN: P4 owns GCP
❌ "Add websocket support for live auth status" — FORBIDDEN: no WebSockets
❌ "Implement Redis token caching" — FORBIDDEN: no Redis
❌ "Let P4 register its own router directly in main.py" — FORBIDDEN: only P2 touches main.py
❌ "Create an evaluation_cache table" — FORBIDDEN: database is frozen
```
