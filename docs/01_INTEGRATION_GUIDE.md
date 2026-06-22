# P5 Evaluation Engine - Integration Guide

## Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Set Environment Variables
```bash
export DATABASE_URL="postgresql://user:pass@localhost/cloud_flight_simulator"
export OPENAI_API_KEY="sk-..."
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
export JWT_SECRET="your-secret-key"
```

### 3. Initialize Database
```bash
python -c "from backend.app.database import init_db; init_db()"
```

### 4. Run Application
```bash
uvicorn backend.app.main:app --reload
```

## Contract Verification

### P5 → P1 (Frontend)
**Contract:** `EvaluationResultSchema`
- Frontend polls `GET /evaluate/{session_id}` every 3 seconds
- Receives full evaluation result with criteria breakdown
- Displays percentage, resource_met status, reasoning to learner
- **No raw resource_snapshot shown to user**

### P5 → P6 (Feedback)
**Contract:** `EvaluationResultSchema`
- P6 reads `evaluations` table to retrieve results
- Uses `percentage` and `criteria_results` to generate feedback
- **P6 does NOT generate scores; P5 owns scoring**

### P5 ← P3 (Scenarios)
**Contract:** `MissionSchema`
- P5 reads missions table to get success_criteria
- Uses `resource_type`, `expected_state`, `weight` for validation
- Uses `track` to determine which GCP inspectors to use

### P5 ← P4 (Challenges)
**Contracts:** `ChallengeSessionSchema`, `EnvironmentSchema`
- P5 reads session to get mission_id, user_id, status
- P5 reads environment to get gcp_project_id, resource_prefix
- P5 reads challenge_sessions to construct full resource names

### P5 ← P1 (Submissions)
**Contract:** `SubmissionSchema`
- P5 reads latest submission for a session
- Uses `description` (learner's explanation) as LLM input
- Submission is read-only; no writes

### P5 → P7 (Audit)
**Audit Events:**
- `EVALUATION_RUN` — fired when evaluation starts
- `EVALUATION_COMPLETED` — fired when evaluation finishes
- Payload includes `evaluation_id`, `percentage`, `submission_id`

## API Contract

### GET /evaluate/{session_id}

**Request:**
```bash
GET /evaluate/session-123 HTTP/1.1
Authorization: Bearer <jwt_token>
```

**Response (No evaluation yet):**
```json
{
  "success": true,
  "data": null
}
```

**Response (Evaluation exists):**
```json
{
  "success": true,
  "data": {
    "evaluation_id": "eval-uuid",
    "session_id": "session-123",
    "submission_id": "sub-uuid",
    "resource_snapshot": {...},
    "criteria_results": [
      {
        "criterion_id": "crit-1",
        "description": "VM exists",
        "resource_met": true,
        "understanding_score": 85,
        "reasoning": "The learner correctly described...",
        "points_awarded": 42
      }
    ],
    "percentage": 84.5,
    "evaluation_mode": "LLM_GROUNDED",
    "evaluated_at": "2024-01-20T10:30:45.123456"
  }
}
```

### POST /evaluate/{session_id}/run

**Request:**
```bash
POST /evaluate/session-123/run HTTP/1.1
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Response:**
```json
{
  "success": true,
  "data": {
    "evaluation_id": "eval-uuid",
    "session_id": "session-123",
    "submission_id": "sub-uuid",
    "resource_snapshot": {
      "gcp_project_id": "cloud-flight-sim",
      "resource_prefix": "lab-123-alice",
      "fetched_at": "2024-01-20T10:30:40.123456",
      "resources": {
        "lab-123-alice-web-vm": {
          "name": "lab-123-alice-web-vm",
          "machine_type": "e2-micro",
          "status": "RUNNING",
          ...
        }
      }
    },
    "criteria_results": [
      {
        "criterion_id": "crit-1",
        "description": "VM exists with correct specs",
        "resource_met": true,
        "understanding_score": 88,
        "reasoning": "Learner correctly created e2-micro VM at lab-123-alice-web-vm",
        "points_awarded": 44
      },
      {
        "criterion_id": "crit-2",
        "description": "HTTP traffic allowed",
        "resource_met": false,
        "understanding_score": 60,
        "reasoning": "No firewall rule found, but learner mentioned attempting to configure it",
        "points_awarded": 0
      }
    ],
    "percentage": 73.3,
    "evaluation_mode": "LLM_GROUNDED",
    "evaluated_at": "2024-01-20T10:30:45.123456"
  }
}
```

**Error: Session not found**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Session not found"
  }
}
```

**Error: Authorization failed**
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Not authorized to access this session"
  }
}
```

## Scoring Gate Examples

### Example 1: Resource exists, understanding good
```
resource_met = true
understanding_score = 85
weight = 50
→ points_awarded = round(50 * 85/100) = 42
```

### Example 2: Resource missing, understanding perfect
```
resource_met = false
understanding_score = 100
weight = 50
→ points_awarded = 0  ← HARD GATE
```

### Example 3: Resource exists, understanding poor
```
resource_met = true
understanding_score = 20
weight = 50
→ points_awarded = round(50 * 20/100) = 10
```

### Example 4: Multiple criteria
```
Criteria 1: resource_met=true, score=90, weight=50 → points=45
Criteria 2: resource_met=true, score=80, weight=30 → points=24
Criteria 3: resource_met=false, score=95, weight=20 → points=0

Total: 69 / 100 = 69.0%
```

## Testing Checklist

### Unit Tests

- [ ] `test_validator_compute_instance_correct.py`
  - Create mock instance matching expected_state
  - Verify `validate_compute_instance()` returns True

- [ ] `test_validator_compute_instance_missing.py`
  - Pass empty resource_snapshot
  - Verify returns False

- [ ] `test_validator_wrong_machine_type.py`
  - Instance exists but machine_type is e2-standard instead of e2-micro
  - Verify returns False

- [ ] `test_scoring_gate_resource_met_false.py`
  - resource_met=false, understanding_score=100
  - Verify points_awarded=0

- [ ] `test_scoring_gate_calculation.py`
  - weight=50, understanding_score=85
  - Verify points_awarded=42

- [ ] `test_percentage_calculation.py`
  - Multiple criteria with different scores
  - Verify percentage = (sum(points) / sum(weights)) * 100

### Integration Tests

- [ ] `test_evaluation_pipeline_end_to_end.py`
  - Mock GCP responses
  - Mock LLM responses
  - Run full pipeline
  - Verify EvaluationResultSchema matches contract

- [ ] `test_get_evaluation_endpoint.py`
  - GET /evaluate/{session_id} with valid token
  - Verify returns EvaluationResultSchema or null

- [ ] `test_post_evaluation_endpoint.py`
  - POST /evaluate/{session_id}/run with valid token
  - Verify returns EvaluationResultSchema
  - Verify audit events written

- [ ] `test_authorization_check.py`
  - GET /evaluate with different user_id
  - Verify 403 Forbidden

- [ ] `test_llm_fallback.py`
  - Mock LLM API failure
  - Verify evaluation still completes with neutral scores

### Manual Testing

1. **Setup test data:**
   ```python
   # Create user
   user = User(email="test@example.com", full_name="Test User")
   db.add(user)
   db.commit()

   # Create mission
   mission = Mission(
       track="COMPUTE",
       difficulty="BEGINNER",
       title="Deploy VM",
       success_criteria=[{
           "criterion_id": "...",
           "description": "VM exists",
           "resource_type": "compute_instance",
           "expected_state": {"name_suffix": "web-01", "machine_type": "e2-micro"},
           "weight": 100
       }],
       time_limit_minutes=45
   )
   db.add(mission)
   db.commit()

   # Create session
   session = ChallengeSession(
       user_id=user.user_id,
       mission_id=mission.mission_id,
       status="ACTIVE"
   )
   db.add(session)
   db.commit()

   # Create environment
   environment = Environment(
       session_id=session.session_id,
       gcp_project_id="cloud-flight-sim",
       resource_prefix="lab-test-user",
       status="READY"
   )
   db.add(environment)
   db.commit()

   # Create submission
   submission = Submission(
       session_id=session.session_id,
       description="I created an e2-micro VM named web-01"
   )
   db.add(submission)
   db.commit()
   ```

2. **Test evaluation endpoint:**
   ```bash
   # Get JWT token (from P2 login)
   TOKEN="..."

   # Trigger evaluation
   curl -X POST http://localhost:8000/evaluate/{session_id}/run \
     -H "Authorization: Bearer $TOKEN"

   # Poll for result
   curl -X GET http://localhost:8000/evaluate/{session_id} \
     -H "Authorization: Bearer $TOKEN"
   ```

3. **Verify database:**
   ```sql
   SELECT * FROM evaluations WHERE session_id = '...';
   SELECT * FROM audit_events WHERE event_type IN ('EVALUATION_RUN', 'EVALUATION_COMPLETED');
   ```

## Troubleshooting

### LLM Returns Invalid JSON
- Check OPENAI_API_KEY is valid
- Check model is "gpt-4" (not gpt-3.5)
- Fallback: LLM service returns neutral scores (50) for all criteria

### GCP Resource Not Found
- Verify gcp_project_id is correct
- Verify resource_prefix matches actual resource names
- Verify service account has Compute/Storage IAM roles
- Check GCP project exists and is accessible

### Database Connection Error
- Verify DATABASE_URL format: `postgresql://user:pass@host:5432/db`
- Verify PostgreSQL is running
- Verify credentials are correct

### Audit Events Not Written
- Check audit_service is initialized
- Verify audit_events table exists
- Check for SQL errors in logs

## Rollout Plan

1. **Phase 1: Local Testing**
   - Set up local PostgreSQL and mock GCP
   - Run all unit and integration tests
   - Verify all 8 test cases pass

2. **Phase 2: Staging**
   - Deploy to staging with real GCP credentials
   - Create test mission and session
   - Manually trigger evaluation
   - Verify scoring gate works

3. **Phase 3: Production**
   - Deploy with production credentials
   - Monitor evaluation latency (should be <30s)
   - Monitor LLM API costs
   - Monitor GCP API costs

## Monitoring

### Key Metrics

- **Evaluation latency** — P95 should be <30s (includes GCP + LLM calls)
- **Resource snapshot fetch latency** — should be <5s
- **LLM call latency** — should be <20s
- **Scoring gate enforcement** — verify all scores with resource_met=false have 0 points
- **Audit event writes** — verify all evaluations have corresponding events

### Log Examples

```
[P5] Running evaluation for session session-123
[P5] Step 1: Fetching resource snapshot for lab-test-user
[P5] Step 2: Running deterministic validation
[P5] Step 3: Invoking evaluation LLM
[P5] Step 4-5: Applying scoring gate and calculating percentage
[P5] Step 6: Persisting evaluation to database
[P5] Step 7: Returning evaluation result
```

## Notes for Other Engineers

### P1 (Frontend)
- Poll `/evaluate/{session_id}` every 3 seconds
- Display `percentage` as main score
- Show `criteria_results` as checklist with `points_awarded` and `reasoning`
- Do NOT display raw `resource_snapshot` JSON

### P2 (Platform)
- Ensure `JWT_SECRET` is strong (32+ chars)
- Register P5 router in `main.py`: `app.include_router(evaluation_router)`
- Ensure database migrations create all 9 tables
- Provide `get_current_user` and `get_db` dependencies

### P3 (Scenarios)
- Ensure `success_criteria` has unique `criterion_id` values
- Ensure weights sum to 100
- Use only valid `resource_type` values (compute_instance, persistent_disk, firewall_rule, storage_bucket)
- Provide `expected_state` with at least `name_suffix`

### P4 (Challenges)
- Ensure `resource_prefix` is unique in database
- Provision resources matching `name_suffix` from mission
- Set `environment.gcp_project_id` correctly
- Ensure resource names follow pattern: `{resource_prefix}-{name_suffix}`

### P6 (Feedback)
- Read `evaluations` table for evaluation results
- Do NOT calculate scores; P5 owns scoring
- Use `criteria_results` to explain what went well/wrong
- Generate feedback based on `understanding_score` and `reasoning`

### P7 (Audit)
- Implement `audit_service.write_event()` callable by all domains
- Ensure `audit_events` table is append-only (no UPDATE/DELETE)
- Provide `get_audit_service()` for P5 to import

## Known Limitations

1. **Single zone hardcoded** — VMs assumed in us-central1-a (easy to generalize)
2. **No network validation** — only checks firewall rule exists, not effectiveness
3. **No IAM policy validation** — no deeper bucket IAM checks beyond bindings
4. **LLM latency** — 20s+ per evaluation due to LLM call (acceptable for async ops)
5. **No partial credit for misconfigured resources** — if one field is wrong, resource_met=false

## Future Roadmap

- Multi-region resource support
- Parallel LLM calls for large mission criteria counts
- Caching of frequently-evaluated resources (with TTL)
- Cost optimization: reuse resource_snapshot for multiple evaluations within time window
- Custom evaluation prompts per track/difficulty
