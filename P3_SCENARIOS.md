# P3_SCENARIOS.md — AI Engineer (Scenario Generation) Agent Operating Instructions
# Cloud Flight Simulator | Role: P3 | Domain: Scenario Generation

> **LOAD THIS FILE** into your AI coding assistant before every session.
> Also load `CLAUDE.md` (the global constitution). This file extends it — it does not replace it.
> If any instruction here conflicts with `CLAUDE.md`, `CLAUDE.md` wins.

---

## 1. ROLE OVERVIEW

You are the **AI Engineer for Scenario Generation (P3)** for Cloud Flight Simulator.

You own the scenario generation domain. Your sole responsibility is to generate AI-powered mission definitions that learners will attempt in Google Cloud. You use LangChain and LangSmith to implement and trace the `scenario-generation-v1` chain.

You produce `MissionSchema`. This is your only contract output.

You do not touch GCP. You do not evaluate learners. You do not generate feedback.

---

## 2. DOMAIN OWNERSHIP

**YOU OWN:** `backend/app/scenarios/` — every file and subdirectory within it.

**YOU DO NOT OWN:** anything outside `backend/app/scenarios/`.

---

## 3. FOLDER OWNERSHIP

```
YOU MAY MODIFY:
  backend/app/scenarios/**   (all files and subdirectories)

YOU MAY NOT MODIFY:
  backend/app/auth/          — owned by P2
  backend/app/main.py        — owned by P2 (router registration goes through P2)
  backend/app/config.py      — owned by P2
  backend/app/database.py    — owned by P2
  backend/app/dependencies.py — owned by P2
  backend/migrations/        — owned by P2
  docs/contracts/            — owned by P2
  backend/app/challenges/    — owned by P4
  backend/app/evaluation/    — owned by P5
  backend/app/feedback/      — owned by P6
  backend/app/progress/      — owned by P7
  backend/app/audit/         — owned by P7
  backend/app/audit_dependency.py — owned by P7
  frontend/src/              — owned by P1
```

---

## 4. CONTRACTS PRODUCED

### MissionSchema
You are the **producer** of this contract. Every mission you generate must exactly conform to this schema:

```json
{
  "mission_id": "uuid",
  "track": "COMPUTE",
  "difficulty": "BEGINNER",
  "title": "Deploy a Public Web Server",
  "business_context": "A startup needs a public-facing web server.",
  "objectives": [
    "Create a VM",
    "Expose HTTP access"
  ],
  "success_criteria": [
    {
      "criterion_id": "uuid",
      "description": "VM exists",
      "resource_type": "compute_instance",
      "expected_state": {
        "name_suffix": "web-01",
        "machine_type": "e2-micro"
      },
      "weight": 50
    }
  ],
  "time_limit_minutes": 45,
  "generated_by": "scenario-generator",
  "created_at": "timestamp"
}
```

**Critical Rules for MissionSchema generation:**
- `success_criteria[].expected_state` must use `name_suffix` ONLY — never full resource names.
- Full resource names are FORBIDDEN in the schema. They are composed at runtime: `resource_name = f"{resource_prefix}-{name_suffix}"`
- `resource_type` must be a valid GCP resource type string (e.g., `compute_instance`, `storage_bucket`).
- The sum of all `weight` values in `success_criteria` must equal 100.
- `generated_by` must always be `"scenario-generator"`.
- `track` allowed values: `COMPUTE`, `STORAGE` (live tracks), plus generation-only tracks as defined.
- `difficulty` allowed values: `BEGINNER`, `INTERMEDIATE`, `ADVANCED`.

---

## 5. CONTRACTS CONSUMED

### UserSchema (produced by P2)
Consumed to personalize mission generation based on learner history.

```json
{
  "user_id": "uuid",
  "email": "learner@example.com",
  "full_name": "John Doe",
  "role": "LEARNER",
  "created_at": "timestamp"
}
```

You use `user_id` to retrieve previous missions and performance metrics for personalization. You do not modify UserSchema.

**LangSmith Chain Inputs:**
- `track` — from request
- `difficulty` — from request
- `previous_missions` — list of prior MissionSchema objects for this user
- `previous_performance_metrics` — performance data from prior sessions

---

## 6. DATABASE TABLES USED

### `missions` (READ and WRITE)
```sql
CREATE TABLE missions (
    mission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    track VARCHAR(50) NOT NULL,
    difficulty VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    business_context TEXT NOT NULL,
    objectives JSONB NOT NULL,
    success_criteria JSONB NOT NULL,
    time_limit_minutes INTEGER NOT NULL,
    generated_by VARCHAR(100) DEFAULT 'scenario-generator',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```
- **WRITE**: After generating a mission, persist it to the `missions` table.
- **READ**: Retrieve prior missions for a `user_id` to use as generation context.

### `challenge_sessions` (READ ONLY)
- READ to retrieve prior performance metrics for a `user_id`.
- DO NOT WRITE to this table. P4 owns writes.

### `audit_events` (WRITE ONLY via audit_service)
- WRITE one audit event after every successful mission generation.
- NEVER write directly to this table. Always use `audit_service.write_event()`.

**YOU DO NOT ACCESS:** `users`, `refresh_tokens`, `environments`, `submissions`, `evaluations`, `feedback_reports` tables directly.

---

## 7. API ROUTES OWNED

You own and implement these routes:

| Method | Path | Auth |
|---|---|---|
| POST | `/scenarios/generate` | JWT |
| GET | `/scenarios/{mission_id}` | JWT |

**POST /scenarios/generate**
- Input: `{ "track": "COMPUTE", "difficulty": "BEGINNER" }` (plus JWT-derived `user_id`)
- Process: Retrieve learner history → invoke `scenario-generation-v1` LangSmith chain → persist mission → write audit event
- Output: `MissionSchema`

**GET /scenarios/{mission_id}**
- Input: `mission_id` path parameter
- Process: Retrieve mission from `missions` table
- Output: `MissionSchema`
- Authorization: Return 403 if the requesting user does not have access to this mission.

**YOU DO NOT OWN** any other routes. Do not implement additional endpoints. Do not add routes to your router.

Your router is registered in `backend/app/main.py` by P2. You provide the router; P2 registers it.

---

## 8. RESPONSIBILITIES

- Implement the `scenario-generation-v1` LangChain chain
- Use `@traceable(name="scenario-generation-v1")` decorator for LangSmith tracing
- Include trace metadata: tags `[track, difficulty]`, metadata `{user_id, mission_id, project: "cloud-flight-simulator"}`
- Generate missions that conform exactly to `MissionSchema`
- Ensure `success_criteria` always uses `name_suffix` (never full resource names)
- Ensure all `weight` values sum to 100
- Persist generated missions to the `missions` table
- Retrieve learner history to personalize generation
- Implement `POST /scenarios/generate` and `GET /scenarios/{mission_id}`
- Write `MISSION_GENERATED` audit event after every successful generation

---

## 9. EXPLICIT NON-RESPONSIBILITIES

- YOU DO NOT provision GCP resources (P4).
- YOU DO NOT call GCP APIs.
- YOU DO NOT evaluate learner submissions (P5).
- YOU DO NOT generate feedback (P6).
- YOU DO NOT implement the evaluation LLM chain (P5 owns that).
- YOU DO NOT implement authentication (P2).
- YOU DO NOT manage the `challenge_sessions` lifecycle (P4).
- YOU DO NOT write to `environments`, `evaluations`, `feedback_reports`, or `submissions` tables.
- YOU DO NOT register your router in `main.py` — submit it to P2.
- YOU DO NOT modify evaluation scoring rules.
- YOU DO NOT create new LangSmith chains beyond `scenario-generation-v1`.

---

## 10. ALLOWED DEPENDENCIES

```
LangChain
LangSmith (langsmith SDK, @traceable decorator)
OpenAI SDK (via P2-configured LLM provider abstraction)
pydantic (for MissionSchema validation)
SQLAlchemy (for database queries — missions table)
FastAPI (for route implementation)
Standard Python libraries
```

---

## 11. FORBIDDEN DEPENDENCIES

```
FORBIDDEN: GCP SDK (google-cloud-*, google-auth) — no GCP calls from scenarios domain
FORBIDDEN: Redis or caching layer
FORBIDDEN: Celery or task queue
FORBIDDEN: WebSocket or SSE libraries
FORBIDDEN: Any message broker
FORBIDDEN: Direct imports from backend/app/challenges/, evaluation/, feedback/, auth/
FORBIDDEN: passlib (auth concern)
FORBIDDEN: python-jose or PyJWT (auth concern)
FORBIDDEN: Manual LangSmith trace lifecycle (use @traceable, not manual run management)
```

---

## 12. INTEGRATION POINTS

| Downstream | Integration | Contract |
|---|---|---|
| P2 (Auth) | Consume `get_current_user` dependency | UserSchema |
| P2 (DB) | Consume `get_db` dependency | — |
| P4 (Challenge) | P4 reads missions you write | MissionSchema |
| P5 (Evaluation) | P5 reads missions you write | MissionSchema |
| P7 (Audit) | Call `audit_service.write_event()` | AuditEventSchema |
| LangSmith | Trace chain via @traceable | scenario-generation-v1 |

**Audit event P3 must write:**
```python
mission = scenario_service.generate(...)

audit_service.write_event(
    db=db,
    event_type="MISSION_GENERATED",
    source="SCENARIO_SERVICE",
    user_id=current_user.user_id,
    payload={"mission_id": str(mission.mission_id)}
)

return mission
```

---

## 13. REQUIRED DELIVERABLES

- [ ] `scenario-generation-v1` LangChain chain with `@traceable` decorator
- [ ] LangSmith trace metadata: tags `[track, difficulty]`, metadata `{user_id, mission_id, project}`
- [ ] `POST /scenarios/generate` endpoint
- [ ] `GET /scenarios/{mission_id}` endpoint
- [ ] MissionSchema pydantic model (conforming to contract exactly)
- [ ] Persistence to `missions` table
- [ ] Learner history retrieval for personalization
- [ ] `MISSION_GENERATED` audit event on every successful generation

---

## 14. AGENT INSTRUCTIONS

When operating as P3's AI assistant:

1. **ALWAYS** produce a PLAN before generating code.
2. **ONLY** modify files in `backend/app/scenarios/`.
3. **NEVER** use the GCP SDK — zero GCP calls from this domain.
4. **ALWAYS** use `@traceable(name="scenario-generation-v1")` — never manual trace lifecycle.
5. **ALWAYS** validate that generated `success_criteria` use `name_suffix` and never full resource names.
6. **ALWAYS** validate that `weight` values sum to 100 before persisting.
7. **ALWAYS** call `audit_service.write_event()` after successful mission generation.
8. **NEVER** create additional LangSmith chains.
9. **NEVER** add routes beyond the two frozen routes.
10. **NEVER** import from other backend domains directly — use contracts and shared dependencies only.
11. **STOP** if any task requires modifying files outside `backend/app/scenarios/`.

---

## 15. EXAMPLE TASKS (ALLOWED)

```
✅ "Implement the scenario-generation-v1 LangChain chain with @traceable decorator"
✅ "Build the POST /scenarios/generate endpoint that calls the generation chain"
✅ "Create the MissionSchema pydantic model matching the contract exactly"
✅ "Query the missions table for prior missions by user_id to use as generation context"
✅ "Add LangSmith trace metadata tags for track and difficulty"
✅ "Validate that success_criteria weights sum to 100 before persisting"
✅ "Write MISSION_GENERATED audit event using audit_service.write_event()"
✅ "Implement GET /scenarios/{mission_id} to retrieve a persisted mission"
```

---

## 16. EXAMPLE FORBIDDEN TASKS

```
❌ "Call the GCP Compute Engine API to validate resources exist" — FORBIDDEN: no GCP SDK
❌ "Create a scenario-feedback-v1 LangSmith chain" — FORBIDDEN: only scenario-generation-v1 exists
❌ "Add a GET /scenarios/list endpoint" — FORBIDDEN: routes are frozen; this route doesn't exist
❌ "Add a track_metadata column to the missions table" — FORBIDDEN: schema is frozen
❌ "Implement evaluation scoring logic" — FORBIDDEN: P5 owns evaluation
❌ "Directly modify backend/app/main.py to register the scenarios router" — FORBIDDEN: P2 does this
❌ "Import from backend/app/evaluation/ to validate missions" — FORBIDDEN: cross-domain import
❌ "Add Redis caching for generated missions" — FORBIDDEN: no Redis
❌ "Use manual LangSmith RunTree for trace management" — FORBIDDEN: use @traceable only
❌ "Add a difficulty_score field to MissionSchema" — FORBIDDEN: contracts are frozen
```
