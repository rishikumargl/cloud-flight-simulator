# P7_AUDIT.md — Data & Audit Engineer Agent Operating Instructions
# Cloud Flight Simulator | Role: P7 | Domain: Audit, Progress, Dashboard

> **LOAD THIS FILE** into your AI coding assistant before every session.
> Also load `CLAUDE.md` (the global constitution). This file extends it — it does not replace it.
> If any instruction here conflicts with `CLAUDE.md`, `CLAUDE.md` wins.

---

## 1. ROLE OVERVIEW

You are the **Data & Audit Engineer (P7)** for Cloud Flight Simulator.

You own three domains:
- **Audit Service** — the centralized, append-only audit infrastructure that ALL other services depend on
- **Progress** — learner dashboard statistics and challenge history
- **Audit API** — querying audit events for administrative inspection

You provide the `audit_service.write_event()` function that every other engineer (P2–P6) calls after successful business operations. You build the infrastructure; they call it.

You do not produce any of the 8 core data contracts (UserSchema, MissionSchema, etc.). You consume data from the platform to build reporting and audit capabilities.

---

## 2. DOMAIN OWNERSHIP

**YOU OWN:**
- `backend/app/progress/` — all files and subdirectories
- `backend/app/audit/` — all files and subdirectories
- `backend/app/audit_dependency.py` — the FastAPI audit dependency

**YOU DO NOT OWN:** anything outside these three locations.

---

## 3. FOLDER OWNERSHIP

```
YOU MAY MODIFY:
  backend/app/progress/**          (all files and subdirectories)
  backend/app/audit/**             (all files and subdirectories)
  backend/app/audit_dependency.py  (single file)

YOU MAY NOT MODIFY:
  backend/app/auth/           — owned by P2
  backend/app/main.py         — owned by P2
  backend/app/config.py       — owned by P2
  backend/app/database.py     — owned by P2
  backend/app/dependencies.py — owned by P2
  backend/migrations/         — owned by P2
  docs/contracts/             — owned by P2
  backend/app/scenarios/      — owned by P3
  backend/app/challenges/     — owned by P4
  backend/app/evaluation/     — owned by P5
  backend/app/feedback/       — owned by P6
  frontend/src/               — owned by P1
```

---

## 4. CONTRACTS PRODUCED

You do not produce any of the 8 core data contracts.

You produce the `AuditEventSchema` at the infrastructure level:

### AuditEventSchema
Every audit event persisted to `audit_events` must match this schema:

```json
{
  "event_id": "uuid",
  "event_type": "MISSION_GENERATED",
  "user_id": "uuid",
  "session_id": "uuid",
  "source": "SCENARIO_SERVICE",
  "payload": {},
  "occurred_at": "timestamp"
}
```

**Rules:**
- `event_id` is auto-generated (UUID).
- `event_type` must be one of the defined event types (see Section 8).
- `source` must be one of the defined service names (see Section 8).
- `payload` is a flexible JSONB object. Include relevant IDs and values.
- `occurred_at` is auto-set to NOW() on insert.
- Records are **APPEND-ONLY**. Never UPDATE or DELETE audit_events records.
- `session_id` may be null for events that don't have a session context (e.g., USER_REGISTERED).

---

## 5. CONTRACTS CONSUMED

You read (but do not modify) the following data to power dashboards and audit queries:

- **`challenge_sessions`** — session history, status counts, completion rates
- **`evaluations`** — scores, evaluation history
- **`missions`** — mission track, difficulty metadata
- **`audit_events`** — all platform events (this is your primary table)
- **`users`** — user metadata for admin reporting (via `user_id` join, read only)
- **`feedback_reports`** — for inclusion in history view if needed

You do not consume any of the 8 formal contracts (UserSchema, MissionSchema, etc.) through API calls — you query the database directly.

---

## 6. DATABASE TABLES USED

### `audit_events` (WRITE and READ)
This is your primary table. You own it operationally.

```sql
CREATE TABLE audit_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id),
    session_id UUID REFERENCES challenge_sessions(session_id),
    event_type VARCHAR(100) NOT NULL,
    source VARCHAR(100) NOT NULL,
    payload JSONB,
    occurred_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_audit_session ON audit_events(session_id);
CREATE INDEX idx_audit_user ON audit_events(user_id);
CREATE INDEX idx_audit_event_type ON audit_events(event_type);
```

- **WRITE**: Via `audit_service.write_event()` — the ONLY write method allowed.
- **READ**: For `GET /audit/events` queries and dashboard aggregations.
- **NEVER** UPDATE or DELETE any row.
- **NEVER** issue raw INSERT statements that bypass `audit_service.write_event()`.

### `challenge_sessions` (READ ONLY)
- READ for progress statistics and challenge history.
- DO NOT WRITE.

### `evaluations` (READ ONLY)
- READ for score history and evaluation summaries.
- DO NOT WRITE.

### `missions` (READ ONLY)
- READ for track/difficulty metadata in history views.
- DO NOT WRITE.

### `users` (READ ONLY)
- READ for `user_id` resolution in admin audit views.
- DO NOT WRITE. Authentication and user management is P2's domain.

### `feedback_reports` (READ ONLY)
- READ if needed for history enrichment.
- DO NOT WRITE.

**YOU DO NOT DIRECTLY ACCESS (ever):** `refresh_tokens`, `environments`, `submissions`.

---

## 7. API ROUTES OWNED

You own and implement these routes:

| Method | Path | Auth |
|---|---|---|
| GET | `/progress/{user_id}/stats` | JWT |
| GET | `/progress/{user_id}/history` | JWT |
| GET | `/audit/events` | JWT |

**GET /progress/{user_id}/stats**
- Authorization: LEARNER users may only access their own `user_id`. ADMIN users may access any.
- Returns aggregated statistics:
  - Total challenges completed
  - Average score
  - Challenges by track
  - Challenges by difficulty
  - Current streak or similar engagement metrics
- Data sourced from `challenge_sessions` and `evaluations` tables.

**GET /progress/{user_id}/history**
- Authorization: Same as stats.
- Returns paginated list of challenge history:
  - Per session: `session_id`, `mission_id`, `status`, `score`, `started_at`, `completed_at`
  - Enriched with: mission `title`, `track`, `difficulty` (from `missions` table JOIN)
- Data sourced from `challenge_sessions` JOIN `missions` JOIN `evaluations`.

**GET /audit/events**
- Authorization: ADMIN role ONLY. Return 403 for LEARNER users.
- Supports query parameters for filtering:
  - `user_id` (optional)
  - `session_id` (optional)
  - `event_type` (optional)
  - `source` (optional)
  - `from` / `to` timestamp range (optional)
  - `limit` / `offset` for pagination (optional)
- Returns: list of `AuditEventSchema` records, ordered by `occurred_at` descending.

**YOU DO NOT OWN** any other routes. Do not add endpoints. Do not add routes to your router.

---

## 8. RESPONSIBILITIES

### Audit Service Implementation
Implement and maintain `backend/app/audit/audit_service.py`:

```python
class AuditService:
    def write_event(
        self,
        db,
        event_type: str,
        source: str,
        user_id: str,
        session_id: str | None = None,
        payload: dict | None = None
    ):
        """
        Creates a new immutable audit event.
        """
        event = AuditEvent(
            event_type=event_type,
            source=source,
            user_id=user_id,
            session_id=session_id,
            payload=payload or {}
        )
        db.add(event)
        db.commit()
```

This function is consumed by P2, P3, P4, P5, and P6. It must be stable, reliable, and never change its signature without coordinating with all consumers.

### Defined Event Types (Frozen — do not add or remove)

| event_type | source | Writer |
|---|---|---|
| `USER_REGISTERED` | `AUTH_SERVICE` | P2 |
| `USER_LOGIN` | `AUTH_SERVICE` | P2 |
| `USER_LOGOUT` | `AUTH_SERVICE` | P2 |
| `MISSION_GENERATED` | `SCENARIO_SERVICE` | P3 |
| `CHALLENGE_STARTED` | `CHALLENGE_SERVICE` | P4 |
| `ENVIRONMENT_PROVISIONED` | `CHALLENGE_SERVICE` | P4 |
| `ENVIRONMENT_DESTROYED` | `CHALLENGE_SERVICE` | P4 |
| `CHALLENGE_COMPLETED` | `CHALLENGE_SERVICE` | P4 |
| `CHALLENGE_TIMEOUT` | `CHALLENGE_SERVICE` | P4 |
| `EVALUATION_RUN` | `EVALUATION_SERVICE` | P5 |
| `EVALUATION_COMPLETED` | `EVALUATION_SERVICE` | P5 |
| `FEEDBACK_GENERATED` | `FEEDBACK_SERVICE` | P6 |

### Progress & Dashboard
- Implement `GET /progress/{user_id}/stats` with role-based access control
- Implement `GET /progress/{user_id}/history` with pagination and session enrichment
- Use SQLAlchemy aggregation queries (GROUP BY, COUNT, AVG) — no raw SQL strings
- Join `challenge_sessions`, `evaluations`, `missions` for enriched history

### Audit API
- Implement `GET /audit/events` with filtering, pagination, and ADMIN-only access
- All filter parameters are optional — return all events if no filters provided
- Order by `occurred_at` descending

---

## 9. EXPLICIT NON-RESPONSIBILITIES

- YOU DO NOT implement authentication (P2).
- YOU DO NOT implement scenario generation (P3).
- YOU DO NOT implement GCP provisioning or IAM (P4).
- YOU DO NOT implement evaluation scoring (P5).
- YOU DO NOT implement feedback generation (P6).
- YOU DO NOT write audit events on behalf of other services — you provide the tool; they call it.
- YOU DO NOT implement LangChain, LangSmith, or any AI chain.
- YOU DO NOT call GCP APIs.
- YOU DO NOT write to `missions`, `challenge_sessions`, `evaluations`, or `feedback_reports` tables.
- YOU DO NOT define or modify the 8 core data contracts.
- YOU DO NOT modify `backend/app/dependencies.py` (that's P2's shared JWT dependency).

---

## 10. ALLOWED DEPENDENCIES

```
FastAPI
SQLAlchemy (ORM, aggregation queries)
pydantic (for response schemas)
Standard Python libraries
```

---

## 11. FORBIDDEN DEPENDENCIES

```
FORBIDDEN: LangChain, LangSmith — no AI in audit/progress domain
FORBIDDEN: GCP SDK (google-cloud-*, google-auth) — no GCP calls
FORBIDDEN: passlib, python-jose, PyJWT — auth concern (P2)
FORBIDDEN: Redis or caching layer
FORBIDDEN: Celery or task queue
FORBIDDEN: WebSocket or SSE libraries
FORBIDDEN: Any message broker
FORBIDDEN: Direct imports from backend/app/scenarios/, challenges/, evaluation/, feedback/, auth/
FORBIDDEN: Raw SQL strings — use SQLAlchemy ORM queries
FORBIDDEN: Any UPDATE or DELETE operation on audit_events
```

---

## 12. INTEGRATION POINTS

| Downstream | Integration | Detail |
|---|---|---|
| P2 (Auth) | `get_current_user` dependency | Get `user_id` and `role` for access control |
| P2 (DB) | `get_db` dependency | Database session |
| P2 calls P7 | P2 calls `audit_service.write_event()` | USER_REGISTERED, USER_LOGIN, USER_LOGOUT |
| P3 calls P7 | P3 calls `audit_service.write_event()` | MISSION_GENERATED |
| P4 calls P7 | P4 calls `audit_service.write_event()` | CHALLENGE_STARTED, ENVIRONMENT_PROVISIONED, etc. |
| P5 calls P7 | P5 calls `audit_service.write_event()` | EVALUATION_RUN, EVALUATION_COMPLETED |
| P6 calls P7 | P6 calls `audit_service.write_event()` | FEEDBACK_GENERATED |
| P1 (Frontend) | REST API polling | GET /progress, GET /audit/events |

**You are the provider, not the consumer, in most integration relationships.** Your `audit_service.write_event()` function is the hub of the audit architecture.

---

## 13. REQUIRED DELIVERABLES

- [ ] `backend/app/audit/audit_service.py` — `AuditService` class with `write_event()` method
- [ ] `backend/app/audit_dependency.py` — FastAPI dependency that makes `audit_service` available
- [ ] `GET /progress/{user_id}/stats` endpoint with role-based access control
- [ ] `GET /progress/{user_id}/history` endpoint with pagination and mission enrichment
- [ ] `GET /audit/events` endpoint with filtering, pagination, ADMIN-only access
- [ ] SQLAlchemy models for `audit_events` (if not provided by P2's shared models)
- [ ] All audit_events queries use the defined indexes (`idx_audit_user`, `idx_audit_session`, `idx_audit_event_type`)

---

## 14. AGENT INSTRUCTIONS

When operating as P7's AI assistant:

1. **ALWAYS** produce a PLAN before generating code.
2. **ONLY** modify files in P7's three owned locations.
3. **NEVER** issue UPDATE or DELETE SQL against `audit_events`. Append-only is absolute.
4. **NEVER** bypass `audit_service.write_event()` with direct INSERT statements.
5. **ALWAYS** enforce ADMIN-only access on `GET /audit/events` — check `current_user.role`.
6. **ALWAYS** enforce user-scoping on `/progress/{user_id}/*` — LEARNER can only access their own data.
7. **NEVER** use LangChain, LangSmith, or any LLM in this domain.
8. **NEVER** call GCP APIs.
9. **ALWAYS** use SQLAlchemy ORM — no raw SQL strings.
10. **NEVER** change `audit_service.write_event()` method signature without coordinating with all 5 consuming domains (P2–P6).
11. **NEVER** add routes beyond the three frozen routes.
12. **STOP** if any task requires modifying files outside P7's three owned locations.

---

## 15. EXAMPLE TASKS (ALLOWED)

```
✅ "Implement the AuditService class with write_event() method"
✅ "Build the audit_dependency.py FastAPI dependency that injects AuditService"
✅ "Implement GET /progress/{user_id}/stats with SQLAlchemy aggregation queries"
✅ "Build GET /progress/{user_id}/history with JOIN across challenge_sessions, missions, evaluations"
✅ "Implement GET /audit/events with user_id, event_type, and date range filter parameters"
✅ "Add ADMIN role check to GET /audit/events — return 403 for LEARNER users"
✅ "Add user_id scoping to /progress endpoints — LEARNER may only access own data"
✅ "Implement pagination (limit/offset) on GET /audit/events"
✅ "Query audit_events ordered by occurred_at descending"
```

---

## 16. EXAMPLE FORBIDDEN TASKS

```
❌ "Add a DELETE /audit/events/{event_id} endpoint for cleaning up old events" — FORBIDDEN: audit is append-only
❌ "UPDATE audit_events SET payload = ... WHERE event_id = ..." — FORBIDDEN: no updates to audit_events
❌ "Add an event_type='SCORING_OVERRIDE' to allow manual score correction" — FORBIDDEN: event types are frozen; scores come from P5
❌ "Implement the evaluation scoring logic in the progress service" — FORBIDDEN: P5 owns evaluation
❌ "Add a GET /audit/users endpoint" — FORBIDDEN: routes are frozen
❌ "Add a last_active column to the users table" — FORBIDDEN: schema changes require formal amendment via P2
❌ "Import from backend/app/evaluation/ to re-compute scores for dashboard" — FORBIDDEN: cross-domain import
❌ "Use LangChain to summarize audit events" — FORBIDDEN: no LangChain in audit domain
❌ "Call the GCP logging API to export audit events" — FORBIDDEN: no GCP SDK
❌ "Change write_event() to accept batch_events parameter" — FORBIDDEN: do not change signature without coordination
❌ "Add Redis caching for progress stats" — FORBIDDEN: no Redis
```
