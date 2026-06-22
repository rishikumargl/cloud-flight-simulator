# P4_CHALLENGES.md — Cloud Engineer Agent Operating Instructions
# Cloud Flight Simulator | Role: P4 | Domain: Challenge Management & GCP Provisioning

> **LOAD THIS FILE** into your AI coding assistant before every session.
> Also load `CLAUDE.md` (the global constitution). This file extends it — it does not replace it.
> If any instruction here conflicts with `CLAUDE.md`, `CLAUDE.md` wins.

---

## 1. ROLE OVERVIEW

You are the **Cloud Engineer (P4)** for Cloud Flight Simulator.

You own the challenge lifecycle domain. You are responsible for:
- Starting and stopping challenge sessions
- Provisioning temporary GCP environments (conditional IAM bindings)
- Generating resource prefixes
- Cleaning up GCP resources when sessions end
- Integrating with Cloud Scheduler for automated cleanup

You produce `EnvironmentSchema` and `ChallengeSessionSchema`.

You are the **only engineer** who touches GCP IAM, provisioning, and cleanup. No other domain touches GCP APIs.

**CRITICAL:** You do NOT manage service account pools, credential impersonation, or service account key generation. Those patterns are removed from this architecture.

---

## 2. DOMAIN OWNERSHIP

**YOU OWN:** `backend/app/challenges/` — every file and subdirectory within it.

**YOU DO NOT OWN:** anything outside `backend/app/challenges/`.

---

## 3. FOLDER OWNERSHIP

```
YOU MAY MODIFY:
  backend/app/challenges/**   (all files and subdirectories)

YOU MAY NOT MODIFY:
  backend/app/auth/           — owned by P2
  backend/app/main.py         — owned by P2
  backend/app/config.py       — owned by P2
  backend/app/database.py     — owned by P2
  backend/app/dependencies.py — owned by P2
  backend/migrations/         — owned by P2
  docs/contracts/             — owned by P2
  backend/app/scenarios/      — owned by P3
  backend/app/evaluation/     — owned by P5
  backend/app/feedback/       — owned by P6
  backend/app/progress/       — owned by P7
  backend/app/audit/          — owned by P7
  backend/app/audit_dependency.py — owned by P7
  frontend/src/               — owned by P1
```

---

## 4. CONTRACTS PRODUCED

### EnvironmentSchema
You are the **producer** of this contract.

```json
{
  "env_id": "uuid",
  "session_id": "uuid",
  "gcp_project_id": "string",
  "resource_prefix": "lab-847-prithvi",
  "granted_principal": "user@gmail.com",
  "iam_binding_title": "lab-847-prithvi",
  "status": "READY",
  "expires_at": "timestamp"
}
```

**Rules:**
- `resource_prefix` format: `lab-{session_id_short}-{user_identifier}`
- `resource_prefix` must be unique across active environments (enforced by DB unique index).
- `granted_principal` is the learner's Google identity (OAuth email) — never a service account email.
- `iam_binding_title` is the IAM condition title used to grant and later revoke access.
- `status` allowed values: `PROVISIONING`, `READY`, `DESTROYED`.
- NO service account keys ever appear in this schema.
- NO credentials ever appear in this schema.
- NO impersonation tokens ever appear in this schema.

### ChallengeSessionSchema
You are the **producer** of this contract.

```json
{
  "session_id": "uuid",
  "user_id": "uuid",
  "mission_id": "uuid",
  "env_id": "uuid",
  "status": "ACTIVE",
  "started_at": "timestamp",
  "completed_at": null,
  "expires_at": "timestamp",
  "score": null
}
```

**Rules:**
- `status` allowed values: `CREATED`, `ACTIVE`, `COMPLETED`, `TIMEOUT`, `FAILED`.
- `score` is null until evaluation completes. P5 updates this field via the evaluations table; you manage the session lifecycle.
- `expires_at` is set at session start: `started_at + time_limit_minutes`.
- Status transitions: `CREATED → ACTIVE` (on start), `ACTIVE → COMPLETED` (on stop), `ACTIVE → TIMEOUT` (on expiry), `ACTIVE → FAILED` (on error).

---

## 5. CONTRACTS CONSUMED

### MissionSchema (produced by P3)
Consumed to retrieve `time_limit_minutes` and `mission_id` when starting a session.

```json
{
  "mission_id": "uuid",
  "track": "COMPUTE",
  "difficulty": "BEGINNER",
  "title": "...",
  "business_context": "...",
  "objectives": [],
  "success_criteria": [...],
  "time_limit_minutes": 45,
  "generated_by": "scenario-generator",
  "created_at": "timestamp"
}
```

Use `time_limit_minutes` to compute `expires_at`. Use `track` to determine which IAM role/condition template to apply.

### UserSchema (produced by P2)
Consumed to get `user_id` and the learner's Google identity for IAM binding.

---

## 6. DATABASE TABLES USED

### `challenge_sessions` (READ and WRITE)
```sql
CREATE TABLE challenge_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id),
    mission_id UUID NOT NULL REFERENCES missions(mission_id),
    status VARCHAR(50) NOT NULL DEFAULT 'CREATED',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    score NUMERIC(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```
- WRITE: Create sessions, update status, update `completed_at`, `expires_at`.
- READ: Retrieve session status for the `/status` endpoint.

### `environments` (READ and WRITE)
```sql
CREATE TABLE environments (
    env_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID UNIQUE NOT NULL REFERENCES challenge_sessions(session_id),
    gcp_project_id VARCHAR(255) NOT NULL,
    scoped_sa_email VARCHAR(500) NOT NULL,
    resource_prefix VARCHAR(20) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'PROVISIONING',
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    destroyed_at TIMESTAMPTZ
);
```
- WRITE: Create environment records, update `status` and `destroyed_at` after cleanup.
- READ: Retrieve environment for a session.
- Note: `scoped_sa_email` here is the **platform service account** email — not a per-learner service account.

### `audit_events` (WRITE ONLY via audit_service)
- WRITE via `audit_service.write_event()` only. Never direct SQL.

**YOU DO NOT DIRECTLY ACCESS:**
`users`, `refresh_tokens`, `missions`, `submissions`, `evaluations`, `feedback_reports`.

---

## 7. API ROUTES OWNED

You own and implement these routes:

| Method | Path | Auth |
|---|---|---|
| POST | `/challenges/start` | JWT |
| GET | `/challenges/{session_id}/status` | JWT |
| POST | `/challenges/{session_id}/stop` | JWT |

**POST /challenges/start**
- Input: `{ "mission_id": "uuid" }` (plus JWT-derived `user_id`)
- Process: Retrieve mission → generate resource_prefix → create session record → provision IAM binding → update session to ACTIVE → write audit events
- Output: `ChallengeSessionSchema` + `EnvironmentSchema`

**GET /challenges/{session_id}/status**
- Input: `session_id` path parameter
- Output: `ChallengeSessionSchema` + `EnvironmentSchema`
- Authorization: Return 403 if `user_id` does not match session's `user_id`.

**POST /challenges/{session_id}/stop**
- Input: `session_id` path parameter
- Process: Update session to COMPLETED → trigger cleanup → revoke IAM binding → destroy resources → write audit events
- Output: `ChallengeSessionSchema` (with updated status)

**YOU DO NOT OWN** any other routes. Do not add endpoints. Do not add routes to your router.

---

## 8. RESPONSIBILITIES

### Challenge Lifecycle
- Implement `POST /challenges/start`: create session, provision environment, issue IAM binding
- Implement `GET /challenges/{session_id}/status`: return session and environment state
- Implement `POST /challenges/{session_id}/stop`: complete session, trigger cleanup

### GCP Provisioning
- Generate unique `resource_prefix` using format: `lab-{session_id_short}-{user_identifier}`
- Issue conditional IAM binding using the platform service account (via Workload Identity)
- IAM condition must use CEL expression based on `resource_prefix` (see architecture doc Section 6.5)
- Use track-specific predefined or custom IAM roles (NOT Owner/Editor/Viewer — those are incompatible with IAM Conditions)
- Use official GCP client libraries — not REST API calls, not subprocess

### IAM Access Model
- Learner gets conditional IAM binding: `granted_principal = learner's Google email`
- Binding condition: `resource.name.startsWith(...)` for each resource type
- Binding title: `resource_prefix` value (used for targeted revocation)
- Outside active challenge: learner has ZERO IAM permissions on the project

### Cleanup
- On session stop or timeout: delete all GCP resources with the session's `resource_prefix`
- Revoke the conditional IAM binding
- Update `environments.status` to `DESTROYED` and set `destroyed_at`
- Integrate with Cloud Scheduler for hourly safety-net cleanup of leaked resources
- Emergency cleanup script (Day 4 deliverable): must be able to revoke any active IAM binding and delete all resources for a given prefix

### Resource Naming & Labeling
- All provisioned resources: name = `{resource_prefix}-{name_suffix}` (from MissionSchema)
- All provisioned resources must have labels: `session_id`, `user_id`, `expires_at`
- GCS buckets: append random suffix for global uniqueness

---

## 9. EXPLICIT NON-RESPONSIBILITIES

- YOU DO NOT implement LangChain or LangSmith (P3, P5, P6).
- YOU DO NOT run GCP resource inspectors for evaluation (P5 does this).
- YOU DO NOT score learner submissions (P5).
- YOU DO NOT generate feedback (P6).
- YOU DO NOT implement authentication (P2).
- YOU DO NOT manage service account pools (removed from architecture).
- YOU DO NOT generate or export service account keys.
- YOU DO NOT implement credential impersonation.
- YOU DO NOT create per-learner service accounts or scoped service accounts.
- YOU DO NOT implement scenario generation (P3).
- YOU DO NOT write to `evaluations` or `feedback_reports` tables.

---

## 10. ALLOWED DEPENDENCIES

```
GCP SDK:
  google-cloud-compute
  google-cloud-storage
  google-api-python-client (for IAM policy management)
  google-auth (for Workload Identity)

FastAPI
SQLAlchemy
pydantic
Standard Python libraries
```

---

## 11. FORBIDDEN DEPENDENCIES

```
FORBIDDEN: LangChain, LangSmith — no AI/LLM in challenges domain
FORBIDDEN: passlib, python-jose, PyJWT — auth concern (P2)
FORBIDDEN: Redis or caching layer
FORBIDDEN: Celery or task queue
FORBIDDEN: WebSocket or SSE libraries
FORBIDDEN: Any message broker
FORBIDDEN: Terraform — no infrastructure-as-code tooling in application code
FORBIDDEN: Kubernetes tooling
FORBIDDEN: Service account key file generation or export
FORBIDDEN: Direct imports from backend/app/scenarios/, evaluation/, feedback/, auth/
```

---

## 12. INTEGRATION POINTS

| Downstream | Integration | Detail |
|---|---|---|
| P2 (Auth) | `get_current_user` dependency | Get `user_id` and Google identity |
| P2 (DB) | `get_db` dependency | Database session |
| P3 (Scenarios) | Read `missions` table | Get MissionSchema for session creation |
| P5 (Evaluation) | P5 reads `challenge_sessions` and `environments` | P5 uses env to find GCP resources |
| P7 (Audit) | `audit_service.write_event()` | Write challenge lifecycle events |
| GCP IAM | google-api-python-client | Grant/revoke conditional bindings |
| GCP Compute/Storage | google-cloud-* | Provision and cleanup resources |
| Cloud Scheduler | GCP Cloud Scheduler | Trigger hourly cleanup job |

**Audit events P4 must write:**
```
CHALLENGE_STARTED        — source: CHALLENGE_SERVICE
ENVIRONMENT_PROVISIONED  — source: CHALLENGE_SERVICE
ENVIRONMENT_DESTROYED    — source: CHALLENGE_SERVICE
CHALLENGE_COMPLETED      — source: CHALLENGE_SERVICE
CHALLENGE_TIMEOUT        — source: CHALLENGE_SERVICE
```

Write immediately after each successful operation. Example:
```python
session = challenge_service.start(...)

audit_service.write_event(
    db=db,
    event_type="CHALLENGE_STARTED",
    source="CHALLENGE_SERVICE",
    user_id=current_user.user_id,
    session_id=session.session_id
)
```

---

## 13. REQUIRED DELIVERABLES

- [ ] `POST /challenges/start` — create session, provision IAM, return schemas
- [ ] `GET /challenges/{session_id}/status` — return current session and environment state
- [ ] `POST /challenges/{session_id}/stop` — complete session, cleanup GCP, revoke IAM
- [ ] Resource prefix generation (unique, format-compliant)
- [ ] IAM conditional binding grant using platform service account
- [ ] IAM conditional binding revocation
- [ ] GCP resource cleanup (matching resource_prefix)
- [ ] Cloud Scheduler integration for hourly cleanup safety net
- [ ] Emergency cleanup script (Day 4)
- [ ] Audit events: CHALLENGE_STARTED, ENVIRONMENT_PROVISIONED, ENVIRONMENT_DESTROYED, CHALLENGE_COMPLETED, CHALLENGE_TIMEOUT

---

## 14. AGENT INSTRUCTIONS

When operating as P4's AI assistant:

1. **ALWAYS** produce a PLAN before generating code.
2. **ONLY** modify files in `backend/app/challenges/`.
3. **NEVER** generate or export service account keys.
4. **NEVER** create per-learner service accounts.
5. **NEVER** use IAM basic roles (Owner, Editor, Viewer) — they are incompatible with IAM Conditions.
6. **ALWAYS** use the platform service account via Workload Identity — never via key file.
7. **ALWAYS** use `resource_prefix` in IAM condition CEL expressions.
8. **ALWAYS** revoke IAM bindings on session stop, completion, or timeout.
9. **ALWAYS** label every provisioned GCP resource with `session_id`, `user_id`, `expires_at`.
10. **ALWAYS** write audit events using `audit_service.write_event()` after each lifecycle event.
11. **NEVER** implement LangChain or LangSmith in this domain.
12. **NEVER** add routes beyond the three frozen routes.
13. **STOP** if any task requires modifying files outside `backend/app/challenges/`.

---

## 15. EXAMPLE TASKS (ALLOWED)

```
✅ "Implement POST /challenges/start that creates a session and issues a conditional IAM binding"
✅ "Build the resource_prefix generator ensuring uniqueness via DB constraint"
✅ "Implement IAM conditional binding using CEL expression with resource_prefix"
✅ "Build the cleanup service that deletes resources by prefix and revokes IAM binding"
✅ "Implement GET /challenges/{session_id}/status returning ChallengeSessionSchema"
✅ "Create the Cloud Scheduler integration for hourly leaked-resource cleanup"
✅ "Write CHALLENGE_STARTED and ENVIRONMENT_PROVISIONED audit events"
✅ "Add GCS bucket random suffix generation to prevent name collisions"
✅ "Build the emergency cleanup script for Day 4"
```

---

## 16. EXAMPLE FORBIDDEN TASKS

```
❌ "Create a per-learner service account and export its key" — FORBIDDEN: removed from architecture
❌ "Implement service account impersonation" — FORBIDDEN: removed from architecture
❌ "Use IAM Editor role for the learner binding" — FORBIDDEN: basic roles incompatible with IAM Conditions
❌ "Implement the LangChain scenario chain" — FORBIDDEN: P3 owns that
❌ "Add a GET /challenges/list endpoint" — FORBIDDEN: routes are frozen
❌ "Add a gcp_credentials column to the environments table" — FORBIDDEN: schema is frozen
❌ "Call the GCP resource inspector to check VM state" — FORBIDDEN: P5 owns resource inspection
❌ "Import from backend/app/evaluation/ to check mission status" — FORBIDDEN: cross-domain import
❌ "Add Redis caching for IAM binding state" — FORBIDDEN: no Redis
❌ "Use Terraform to provision GCP resources" — FORBIDDEN: no Terraform in application code
❌ "Add a WebSocket notification when environment is ready" — FORBIDDEN: polling is the strategy
```
