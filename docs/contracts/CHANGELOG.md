# Contract Amendment Changelog

## Version 3.0 — Initial Release

### Contracts Defined

#### P2: UserSchema (Auth Service)
- `user_id` (UUID): Primary identifier
- `email` (string): Unique email address
- `full_name` (string): Full name
- `role` (enum): LEARNER or ADMIN
- `created_at` (timestamp): Account creation time

#### P3: MissionSchema (Scenario Service)
- `mission_id` (UUID): Unique mission identifier
- `track` (enum): COMPUTE, STORAGE
- `difficulty` (enum): BEGINNER, INTERMEDIATE, ADVANCED
- `title` (string): Mission title
- `business_context` (string): Real-world scenario context
- `objectives` (array): Learning objectives
- `success_criteria` (array of objects): Evaluation criteria with `criterion_id`, `description`, `resource_type`, `expected_state`, `weight`
- `time_limit_minutes` (integer): Time allowed for mission
- `generated_by` (string): "scenario-generator"
- `created_at` (timestamp): Generation time

#### P4: EnvironmentSchema (Challenge Service)
- `env_id` (UUID): Environment identifier
- `session_id` (UUID): Associated challenge session
- `gcp_project_id` (string): GCP project ID
- `resource_prefix` (string): Prefix for all resources in this environment
- `granted_principal` (string): Learner's Google email
- `iam_binding_title` (string): IAM condition title
- `status` (enum): PROVISIONING, READY, DESTROYED
- `expires_at` (timestamp): Environment expiration time

#### P4: ChallengeSessionSchema (Challenge Service)
- `session_id` (UUID): Challenge session identifier
- `user_id` (UUID): Learner's user ID
- `mission_id` (UUID): Associated mission
- `env_id` (UUID): Associated environment
- `status` (enum): CREATED, ACTIVE, COMPLETED, TIMEOUT, FAILED
- `started_at` (timestamp): Session start time
- `completed_at` (timestamp): Session completion time (null if active)
- `expires_at` (timestamp): Session expiration time
- `score` (float): Final score (null until evaluation completes)

#### P1: SubmissionSchema (Frontend)
- `submission_id` (UUID): Unique submission identifier
- `session_id` (UUID): Associated challenge session
- `description` (string): Learner's explanation of their work
- `submitted_at` (timestamp): Submission time

#### P5: EvaluationResultSchema (Evaluation Service)
- `evaluation_id` (UUID): Unique evaluation identifier
- `session_id` (UUID): Associated challenge session
- `resource_snapshot` (object): Actual GCP resource state at evaluation time
- `submission_id` (UUID): Associated learner submission
- `criteria_results` (array): Per-criterion evaluation results
  - `criterion_id` (UUID): Criterion identifier
  - `description` (string): Criterion description
  - `resource_met` (boolean): Deterministic validation result
  - `understanding_score` (integer, 0-100): LLM understanding assessment
  - `reasoning` (string): Evidence-based explanation
  - `points_awarded` (integer): Final points (0 if resource_met=false)
- `percentage` (float, 0-100): Overall score percentage
- `evaluation_mode` (string): "LLM_GROUNDED"
- `evaluated_at` (timestamp): Evaluation completion time

#### P6: FeedbackReportSchema (Feedback Service)
- `feedback_id` (UUID): Unique feedback identifier
- `session_id` (UUID): Associated challenge session
- `summary` (string): Overall feedback summary
- `strengths` (array): What the learner did well
- `mistakes` (array): What needs improvement
- `improvements` (array): Specific recommendations
- `next_recommendation` (object): Suggested next challenge
- `generated_at` (timestamp): Generation time

### Frozen Specifications

#### Tables (8 total)
- `users` (P2)
- `refresh_tokens` (P2)
- `missions` (P3)
- `challenge_sessions` (P4)
- `environments` (P4)
- `submissions` (P1)
- `evaluations` (P5)
- `feedback_reports` (P6)
- `audit_events` (P7)

#### Routes (18 total)
- POST `/auth/register` (P2)
- POST `/auth/login` (P2)
- POST `/auth/refresh` (P2)
- POST `/auth/logout` (P2)
- GET `/auth/me` (P2)
- GET `/health` (P2)
- POST `/scenarios/generate` (P3)
- GET `/scenarios/{mission_id}` (P3)
- POST `/challenges/start` (P4)
- GET `/challenges/{session_id}/status` (P4)
- POST `/challenges/{session_id}/stop` (P4)
- GET `/evaluate/{session_id}` (P5)
- POST `/evaluate/{session_id}/run` (P5)
- POST `/feedback/generate` (P6)
- GET `/feedback/{session_id}` (P6)
- GET `/progress/{user_id}/stats` (P7)
- GET `/progress/{user_id}/history` (P7)
- GET `/audit/events` (P7)

### Critical Rules

**Contract Immutability:**
- All field names, types, and structure are frozen
- No new fields can be added without full team amendment
- No fields can be removed or renamed
- Field types cannot change

**Scoring Gate (P5):**
- If `resource_met = false`, then `points_awarded = 0` (absolute rule)
- LLM cannot override deterministic resource validation
- Resource snapshot must be fetched from GCP BEFORE any LLM call

**Audit Trail:**
- All services must write events via `audit_service.write_event()`
- `audit_events` table is append-only (no UPDATE/DELETE)
- Every significant operation must have an audit record
