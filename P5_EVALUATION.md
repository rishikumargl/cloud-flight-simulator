# P5_EVALUATION.md — Evaluation Engineer Agent Operating Instructions
# Cloud Flight Simulator | Role: P5 | Domain: Hybrid Evaluation Engine

> **LOAD THIS FILE** into your AI coding assistant before every session.
> Also load `CLAUDE.md` (the global constitution). This file extends it — it does not replace it.
> If any instruction here conflicts with `CLAUDE.md`, `CLAUDE.md` wins.

---

## 1. ROLE OVERVIEW

You are the **Evaluation Engineer (P5)** for Cloud Flight Simulator.

You own the hybrid evaluation engine. You are responsible for:
- Fetching factual resource state directly from Google Cloud
- Running deterministic validation of resources against mission success criteria
- Invoking the evaluation LLM to assess learner understanding
- Applying the hard scoring gate (if `resource_met = false`, `points_awarded = 0`)
- Persisting `EvaluationResultSchema`
- Tracing every evaluation run in LangSmith

You are the **sole engineer** responsible for evaluation. P6 explains scores. P6 does not generate scores. The LLM cannot override resource validation results.

---

## 2. DOMAIN OWNERSHIP

**YOU OWN:** `backend/app/evaluation/` — every file and subdirectory within it.

**YOU DO NOT OWN:** anything outside `backend/app/evaluation/`.

---

## 3. FOLDER OWNERSHIP

```
YOU MAY MODIFY:
  backend/app/evaluation/**   (all files and subdirectories)

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
  backend/app/feedback/       — owned by P6
  backend/app/progress/       — owned by P7
  backend/app/audit/          — owned by P7
  backend/app/audit_dependency.py — owned by P7
  frontend/src/               — owned by P1
```

---

## 4. CONTRACTS PRODUCED

### EvaluationResultSchema
You are the **producer** of this contract. Every evaluation you persist and return must exactly match:

```json
{
  "evaluation_id": "uuid",
  "session_id": "uuid",
  "resource_snapshot": {},
  "submission_id": "uuid",
  "criteria_results": [
    {
      "criterion_id": "uuid",
      "description": "VM exists",
      "resource_met": true,
      "understanding_score": 82,
      "reasoning": "The learner correctly explained the VM creation process and referenced the deployed e2-micro instance.",
      "points_awarded": 41
    }
  ],
  "percentage": 85,
  "evaluation_mode": "LLM_GROUNDED",
  "evaluated_at": "timestamp"
}
```

**Critical Scoring Rules — NEVER VIOLATE:**
- `resource_met` is the result of deterministic GCP inspection. It is a fact, not an opinion.
- `understanding_score` is the LLM's assessment (0–100). It may not override `resource_met`.
- **If `resource_met = false` → `points_awarded` MUST be `0`. No exceptions. The LLM cannot change this.**
- `percentage` = sum of `points_awarded` / sum of `weight` across all criteria × 100.
- `resource_snapshot` must be fetched directly from GCP before any LLM call. It must never be inferred from learner text or fabricated.
- `evaluation_mode` value: `"LLM_GROUNDED"`.

---

## 5. CONTRACTS CONSUMED

### MissionSchema (produced by P3)
```json
{
  "mission_id": "uuid",
  "track": "COMPUTE",
  "difficulty": "BEGINNER",
  "title": "...",
  "success_criteria": [
    {
      "criterion_id": "uuid",
      "description": "VM exists",
      "resource_type": "compute_instance",
      "expected_state": { "name_suffix": "web-01", "machine_type": "e2-micro" },
      "weight": 50
    }
  ],
  "time_limit_minutes": 45,
  ...
}
```
Used to determine: which resources to inspect, what state to expect, and how to weight criteria.

Resource names are composed as: `resource_name = f"{resource_prefix}-{name_suffix}"`
You get `resource_prefix` from `EnvironmentSchema`.

### SubmissionSchema (produced by P1)
```json
{
  "submission_id": "uuid",
  "session_id": "uuid",
  "description": "I created an e2-micro VM and configured HTTP access.",
  "submitted_at": "timestamp"
}
```
Used as input to the evaluation LLM for understanding assessment.
**The LLM may only use facts from SubmissionSchema and the resource_snapshot. It may not invent facts.**

### EnvironmentSchema (produced by P4)
```json
{
  "env_id": "uuid",
  "session_id": "uuid",
  "gcp_project_id": "string",
  "resource_prefix": "lab-847-prithvi",
  ...
}
```
Use `resource_prefix` and `gcp_project_id` to construct full GCP resource names for inspection.

### ChallengeSessionSchema (produced by P4)
```json
{
  "session_id": "uuid",
  "user_id": "uuid",
  "mission_id": "uuid",
  "env_id": "uuid",
  "status": "ACTIVE",
  ...
}
```
Used to retrieve `mission_id` and `env_id` for a given `session_id`.

---

## 6. DATABASE TABLES USED

### `evaluations` (READ and WRITE)
```sql
CREATE TABLE evaluations (
    evaluation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES challenge_sessions(session_id),
    submission_id UUID REFERENCES submissions(submission_id),
    percentage NUMERIC(5,2) NOT NULL,
    evaluation_mode VARCHAR(50) NOT NULL,
    criteria_results JSONB NOT NULL,
    resource_snapshot JSONB NOT NULL,
    evaluated_at TIMESTAMPTZ DEFAULT NOW()
);
```
- WRITE: Persist every evaluation run.
- READ: Return latest evaluation for `GET /evaluate/{session_id}`.

### `submissions` (READ ONLY)
- READ: Retrieve the learner's `SubmissionSchema` for LLM input.
- DO NOT WRITE to this table.

### `challenge_sessions` (READ ONLY)
- READ: Get `mission_id`, `env_id`, `user_id` for a given `session_id`.
- DO NOT WRITE to this table.

### `missions` (READ ONLY)
- READ: Get `MissionSchema` (success_criteria, track, difficulty) for a given `mission_id`.
- DO NOT WRITE to this table.

### `environments` (READ ONLY)
- READ: Get `resource_prefix` and `gcp_project_id` for a given `session_id`.
- DO NOT WRITE to this table.

### `audit_events` (WRITE ONLY via audit_service)
- WRITE via `audit_service.write_event()` only.

**YOU DO NOT DIRECTLY ACCESS:** `users`, `refresh_tokens`, `feedback_reports`.

---

## 7. API ROUTES OWNED

You own and implement these routes:

| Method | Path | Auth |
|---|---|---|
| GET | `/evaluate/{session_id}` | JWT |
| POST | `/evaluate/{session_id}/run` | JWT |

**GET /evaluate/{session_id}**
- Returns the latest `EvaluationResultSchema` for a session.
- This is also the route used by the polling mechanism (frontend polls every 3 seconds).
- If no evaluation exists yet, return a 404 or empty state (not an error).
- Authorization: Return 403 if `user_id` does not match session's `user_id`.

**POST /evaluate/{session_id}/run**
- Triggers a full evaluation run:
  1. Retrieve MissionSchema
  2. Retrieve SubmissionSchema (latest for this session)
  3. Fetch `resource_snapshot` directly from GCP using `resource_prefix`
  4. Run deterministic validation → produce `resource_met` per criterion
  5. Send MissionSchema + SubmissionSchema + resource_snapshot to evaluation LLM
  6. LLM produces `understanding_score` and `reasoning` per criterion
  7. Apply scoring gate: if `resource_met = false` → `points_awarded = 0`
  8. Compute `percentage`
  9. Persist `EvaluationResultSchema`
  10. Write audit events
- Output: `EvaluationResultSchema`

**YOU DO NOT OWN** any other routes. Do not add endpoints.

---

## 8. RESPONSIBILITIES

### Resource Inspection
- Use GCP SDK (platform service account via Workload Identity) to fetch actual resource state
- Build resource inspectors per track: Compute (VMs, disks, firewall rules), Storage (buckets, IAM, lifecycle)
- Compose full resource names: `f"{gcp_project_id}/.../{resource_prefix}-{name_suffix}"`
- Never infer resource state from text. Never fabricate a resource snapshot.

### Deterministic Validation
- For each criterion in `MissionSchema.success_criteria`: check the `resource_snapshot` against `expected_state`
- Set `resource_met = true` only if the resource exists AND matches expected configuration
- `resource_met = false` if the resource is absent, wrong type, wrong configuration, or wrong name

### LLM Understanding Assessment
- After deterministic validation, invoke the evaluation LLM with:
  - `MissionSchema` (objectives, success_criteria descriptions)
  - `SubmissionSchema` (learner explanation)
  - `resource_snapshot` (factual GCP state)
- LLM returns `understanding_score` (0–100) and `reasoning` per criterion
- LLM prompt must include explicit grounding instructions:
  - "You may only use facts from the resource_snapshot and the learner submission."
  - "You may not invent resources, configurations, or actions."
  - "Every reasoning statement must be supported by evidence."

### Scoring Gate (HARD RULE)
```python
if not criterion.resource_met:
    criterion.points_awarded = 0
else:
    criterion.points_awarded = round(criterion.weight * (criterion.understanding_score / 100))
```
This rule is absolute. No code path may award points when `resource_met = false`.

### LangSmith Tracing
- Trace every evaluation LLM call in LangSmith.
- Use `@traceable` decorator or LangChain native tracing.
- Trace must include: mission, submission, resource_snapshot, evaluation output, latency, token usage.
- Note: This is a separate LangSmith trace from `scenario-generation-v1` and `feedback-generation-v1`. It is the evaluation trace within the existing LangSmith project.

---

## 9. EXPLICIT NON-RESPONSIBILITIES

- YOU DO NOT generate feedback (P6 owns `FeedbackReportSchema`).
- YOU DO NOT provision GCP environments (P4).
- YOU DO NOT revoke IAM bindings (P4).
- YOU DO NOT generate scenarios (P3).
- YOU DO NOT implement authentication (P2).
- YOU DO NOT write to `challenge_sessions` table status (P4 owns session lifecycle).
- YOU DO NOT update `challenge_sessions.score` directly — that is derived from `evaluations`.
- YOU DO NOT implement the feedback chain.
- YOU DO NOT allow the LLM to override `resource_met`.
- YOU DO NOT allow points to be awarded for non-existent resources.

---

## 10. ALLOWED DEPENDENCIES

```
GCP SDK:
  google-cloud-compute (for Compute Engine inspection)
  google-cloud-storage (for Cloud Storage inspection)
  google-auth (Workload Identity)

LangChain (for evaluation LLM invocation)
LangSmith (for evaluation tracing, @traceable)
OpenAI SDK (via P2-configured LLM provider)
pydantic (for schema validation)
SQLAlchemy (for database queries)
FastAPI
Standard Python libraries
```

---

## 11. FORBIDDEN DEPENDENCIES

```
FORBIDDEN: passlib, python-jose, PyJWT — auth concern (P2)
FORBIDDEN: Redis or caching layer
FORBIDDEN: Celery or task queue
FORBIDDEN: WebSocket or SSE libraries
FORBIDDEN: Any message broker
FORBIDDEN: Direct imports from backend/app/scenarios/, challenges/, feedback/, auth/
FORBIDDEN: Manual LangSmith trace lifecycle — use @traceable
FORBIDDEN: Any GCP IAM modification — you READ GCP state, you do NOT write IAM
```

---

## 12. INTEGRATION POINTS

| Downstream | Integration | Detail |
|---|---|---|
| P2 (Auth) | `get_current_user` dependency | Get `user_id` |
| P2 (DB) | `get_db` dependency | Database session |
| P3 (Scenarios) | Read `missions` table | Get MissionSchema |
| P4 (Challenges) | Read `challenge_sessions`, `environments` | Get session + env context |
| P1 (Frontend) | Polling via GET /evaluate/{session_id} | Return EvaluationResultSchema |
| P6 (Feedback) | P6 reads `evaluations` table | P6 consumes EvaluationResultSchema |
| P7 (Audit) | `audit_service.write_event()` | Write evaluation audit events |
| GCP Compute | google-cloud-compute | Inspect VM/disk/firewall state |
| GCP Storage | google-cloud-storage | Inspect bucket state |
| LangSmith | @traceable / LangChain | Trace evaluation LLM calls |

**Audit events P5 must write:**
```
EVALUATION_RUN        — source: EVALUATION_SERVICE
EVALUATION_COMPLETED  — source: EVALUATION_SERVICE
```

```python
result = evaluation_service.run(...)

audit_service.write_event(
    db=db,
    event_type="EVALUATION_COMPLETED",
    source="EVALUATION_SERVICE",
    user_id=current_user.user_id,
    session_id=result.session_id,
    payload={"evaluation_id": str(result.evaluation_id), "percentage": float(result.percentage)}
)
```

---

## 13. REQUIRED DELIVERABLES

- [ ] `GET /evaluate/{session_id}` — return latest EvaluationResultSchema (supports polling)
- [ ] `POST /evaluate/{session_id}/run` — full evaluation pipeline
- [ ] GCP resource inspectors for COMPUTE track (VMs, disks, firewall rules)
- [ ] GCP resource inspectors for STORAGE track (buckets, objects, IAM)
- [ ] Deterministic validation engine (resource_met logic)
- [ ] Evaluation LLM chain with grounding prompt
- [ ] Hard scoring gate implementation
- [ ] EvaluationResultSchema pydantic model
- [ ] LangSmith tracing for evaluation LLM calls
- [ ] Audit events: EVALUATION_RUN, EVALUATION_COMPLETED

---

## 14. AGENT INSTRUCTIONS

When operating as P5's AI assistant:

1. **ALWAYS** produce a PLAN before generating code.
2. **ONLY** modify files in `backend/app/evaluation/`.
3. **ALWAYS** fetch the resource_snapshot from GCP BEFORE any LLM call.
4. **NEVER** let the LLM set `resource_met`. `resource_met` is deterministic only.
5. **ALWAYS** apply the scoring gate: `if not resource_met: points_awarded = 0`.
6. **NEVER** fabricate, infer, or hallucinate resource state.
7. **ALWAYS** include explicit grounding instructions in the evaluation LLM prompt.
8. **ALWAYS** use `@traceable` for LangSmith tracing — no manual trace management.
9. **NEVER** write GCP IAM changes — read only.
10. **ALWAYS** write audit events after evaluation run and completion.
11. **NEVER** add routes beyond the two frozen routes.
12. **STOP** if any task requires modifying files outside `backend/app/evaluation/`.

---

## 15. EXAMPLE TASKS (ALLOWED)

```
✅ "Implement the Compute Engine inspector that fetches VM state for a given resource_prefix"
✅ "Build the deterministic validator that checks resource_snapshot against MissionSchema.success_criteria"
✅ "Implement the hard scoring gate: points_awarded = 0 when resource_met = false"
✅ "Create the evaluation LLM chain with grounding prompt that constrains the LLM to the resource_snapshot"
✅ "Build GET /evaluate/{session_id} that returns the latest EvaluationResultSchema"
✅ "Implement POST /evaluate/{session_id}/run orchestrating the full 10-step evaluation pipeline"
✅ "Add @traceable decorator to the evaluation LLM call for LangSmith tracing"
✅ "Write EVALUATION_COMPLETED audit event with evaluation_id and percentage in payload"
✅ "Build the Cloud Storage inspector for bucket existence and configuration checks"
```

---

## 16. EXAMPLE FORBIDDEN TASKS

```
❌ "Let the LLM decide if resource_met is true based on the learner's description" — FORBIDDEN: resource_met is deterministic only
❌ "Award partial points when resource_met is false but understanding_score is high" — FORBIDDEN: scoring gate is absolute
❌ "Generate feedback in the evaluation endpoint" — FORBIDDEN: P6 owns feedback
❌ "Revoke the IAM binding after evaluation" — FORBIDDEN: P4 owns IAM lifecycle
❌ "Add a GET /evaluate/history endpoint" — FORBIDDEN: routes are frozen
❌ "Add a confidence_score field to criteria_results" — FORBIDDEN: contracts are frozen
❌ "Import from backend/app/feedback/ to generate recommendations" — FORBIDDEN: cross-domain import
❌ "Use the learner's submission text to determine resource_met" — FORBIDDEN: resource_met from GCP only
❌ "Add Redis caching for resource snapshots" — FORBIDDEN: no Redis
❌ "Manually manage LangSmith RunTree instead of @traceable" — FORBIDDEN: use @traceable
```
