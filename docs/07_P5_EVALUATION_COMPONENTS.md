# P5: Evaluation Engine Implementation

## Overview

The Evaluation Engine (P5) is responsible for the hybrid evaluation of learner submissions:
1. **Deterministic validation** — checks GCP resources against success criteria
2. **LLM understanding assessment** — evaluates learner explanation quality
3. **Hard scoring gate** — enforces the rule: if resource_met=false, points_awarded=0

## Architecture

### Components

#### `schemas.py`
Pydantic models for all data contracts:
- `EvaluationResultSchema` — the contract produced by P5, consumed by P1 (frontend) and P6 (feedback)
- `CriterionResult` — single criterion evaluation result
- `LLMEvaluationInput` / `LLMEvaluationOutput` — internal LLM chain I/O

#### `resource_inspector.py`
GCP resource inspection using official client libraries:
- `ComputeResourceInspector` — fetches VM, disk, firewall rule state
  - Methods: `get_instance()`, `get_disk()`, `get_firewall_rule()`
- `StorageResourceInspector` — fetches bucket and IAM policy state
  - Methods: `get_bucket()`, `get_bucket_iam_policy()`
- `ResourceInspectorFactory` — singleton factory for lazy initialization

**Key constraint:** Resource snapshot must be fetched BEFORE any LLM call.

#### `validator.py`
Deterministic validation engine:
- `DeterministicValidator.validate_criterion()` — validates individual criteria
- Supports: `compute_instance`, `persistent_disk`, `firewall_rule`, `storage_bucket`
- Sets `resource_met = true` only if resource exists AND matches all expected_state fields
- Never infers resource state from text; uses GCP snapshot only

#### `llm_chain.py`
LangSmith-traced evaluation LLM chain:
- `@traceable(name="evaluation-understanding-assessment")` — LangSmith integration
- Grounding prompt explicitly constrains LLM to resource_snapshot and submission text
- Returns `understanding_score` (0-100) and `reasoning` per criterion
- Fallback behavior: returns neutral scores (50) if LLM fails

#### `scoring.py`
Hard scoring gate implementation:
- `ScoringGate.calculate_points()` — applies the gate: if resource_met=false, points=0
- `ScoringGate.calculate_percentage()` — overall score calculation
- Formula: `percentage = (sum(points_awarded) / sum(weights)) * 100`

#### `service.py`
Orchestrates the full evaluation pipeline:
- `EvaluationService.fetch_resource_snapshot()` — GCP inspection by criterion
- `EvaluationService.run_evaluation()` — 7-step pipeline
- `EvaluationService.get_latest_evaluation()` — retrieves last evaluation for polling
- `EvaluationService._persist_evaluation()` — saves to database

#### `router.py`
FastAPI endpoints:
- `GET /evaluate/{session_id}` — returns latest evaluation (supports polling)
- `POST /evaluate/{session_id}/run` — triggers full evaluation pipeline
- Both endpoints require JWT authentication
- Both enforce authorization (user_id must match session owner)

### Evaluation Pipeline (7 Steps)

```
run_evaluation():
  1. Fetch resource_snapshot from GCP
  2. Run deterministic validation per criterion (resource_met)
  3. Invoke evaluation LLM with mission + submission + snapshot
  4. LLM returns understanding_score + reasoning per criterion
  5. Apply scoring gate: if resource_met=false → points_awarded=0
  6. Calculate percentage: sum(points) / sum(weights) * 100
  7. Persist to evaluations table + write audit events
```

## Integration Points

### Consumed Contracts (Read-Only)

**MissionSchema (P3):**
- `mission.title` — for LLM context
- `mission.objectives` — for LLM context
- `mission.track` — determines which GCP inspectors to use
- `mission.success_criteria` — defines validation rules
  - `criterion_id`, `description`, `resource_type`, `expected_state`, `weight`

**SubmissionSchema (P1):**
- `submission.description` — learner's explanation for LLM assessment
- `submission.submitted_at` — metadata only

**EnvironmentSchema (P4):**
- `environment.gcp_project_id` — for GCP API calls
- `environment.resource_prefix` — for constructing resource names

**ChallengeSessionSchema (P4):**
- `session.mission_id`, `session.env_id`, `session.user_id` — for session context

### Produced Contract (Write)

**EvaluationResultSchema:**
- Contract exactly matches defined schema
- All fields required
- `percentage` rounded to 2 decimals
- `evaluation_mode` always "LLM_GROUNDED"
- `evaluated_at` set to current UTC time

### Database

**Tables Used:**
- `evaluations` — WRITE (persist results)
- `challenge_sessions` — READ (get session context)
- `missions` — READ (get success criteria)
- `environments` — READ (get GCP project/prefix)
- `submissions` — READ (get learner explanation)
- `audit_events` — WRITE (via audit_service only)

### Audit Events

P5 writes two events per evaluation:

```python
# After submission received
audit_service.write_event(
    event_type="EVALUATION_RUN",
    source="EVALUATION_SERVICE",
    user_id=...,
    session_id=...,
    payload={"submission_id": "..."}
)

# After evaluation completes
audit_service.write_event(
    event_type="EVALUATION_COMPLETED",
    source="EVALUATION_SERVICE",
    user_id=...,
    session_id=...,
    payload={
        "evaluation_id": "...",
        "percentage": 85.5,
    }
)
```

## Configuration

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost/cloud_flight_simulator

# OpenAI / LLM
OPENAI_API_KEY=sk-...

# JWT
JWT_SECRET=your-secret-key-change-in-production
```

### GCP Authentication

P5 uses **Workload Identity** to access GCP APIs:
- Platform service account (not per-learner accounts)
- Uses `GOOGLE_APPLICATION_CREDENTIALS` or Workload Identity binding
- Uses official GCP client libraries (google-cloud-compute, google-cloud-storage)

## Usage Examples

### Trigger Evaluation
```bash
curl -X POST http://localhost:8000/evaluate/session-123/run \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json"
```

### Get Latest Evaluation
```bash
curl -X GET http://localhost:8000/evaluate/session-123 \
  -H "Authorization: Bearer <jwt_token>"
```

Frontend polls this endpoint every 3 seconds during an active challenge.

## Testing Checklist

- [ ] Resource snapshot fetches VM correctly
- [ ] Resource snapshot fetches disk correctly
- [ ] Resource snapshot fetches firewall rule correctly
- [ ] Resource snapshot fetches GCS bucket correctly
- [ ] Deterministic validator rejects missing resources
- [ ] Deterministic validator rejects wrong machine_type
- [ ] Deterministic validator rejects wrong name_suffix
- [ ] LLM chain returns valid understanding_score (0-100)
- [ ] LLM chain fallback works on API failure
- [ ] Scoring gate: resource_met=false → points=0
- [ ] Scoring gate: resource_met=true → points = weight * (score/100)
- [ ] Percentage calculation sums correctly
- [ ] Evaluation persisted to database
- [ ] Audit events written (EVALUATION_RUN, EVALUATION_COMPLETED)
- [ ] GET /evaluate/{session_id} returns latest evaluation
- [ ] GET /evaluate/{session_id} returns 404 if no evaluation
- [ ] Authorization check rejects wrong user_id
- [ ] POST /evaluate/{session_id}/run requires JWT

## Constraints & Rules

### HARD RULES (Non-negotiable)

1. **Resource_met is deterministic only** — LLM cannot set this field
2. **Scoring gate is absolute** — points_awarded=0 if resource_met=false, no exceptions
3. **Resource snapshot is GCP-sourced** — never inferred from learner text
4. **Grounding prompt constrains LLM** — explicitly forbids fabrication
5. **No direct database updates** — migrations authored by P2 only

### Design Constraints

- No Redis, Celery, message queues
- No WebSockets or SSE (polling only)
- No service account key exports
- No per-learner service accounts
- No direct cross-domain imports (use contracts via dependencies)
- LangSmith tracing via `@traceable` only (no manual trace management)

## Dependency Notes

**Allowed:**
- google-cloud-compute, google-cloud-storage
- LangChain, LangSmith (@traceable)
- OpenAI SDK
- SQLAlchemy, FastAPI, pydantic

**Forbidden:**
- passlib, PyJWT (auth only in P2)
- Any GCP SDK in P3, P4, P6
- Direct imports from other backend domains

## Future Enhancements

- Multi-zone VM support (currently hardcoded to us-central1-a)
- Custom IAM role validation
- Bucket versioning checks
- Network interface validation
- GCP tag/label validation
