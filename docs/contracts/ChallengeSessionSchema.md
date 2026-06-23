# ChallengeSessionSchema

**Producer:** P4 (Challenge Service)  
**Consumers:** P1, P5, P6

## Definition

```json
{
  "session_id": "uuid (string)",
  "user_id": "uuid (string)",
  "mission_id": "uuid (string)",
  "status": "PENDING | ACTIVE | SUBMITTED | COMPLETED | FAILED | CANCELLED",
  "environment_id": "uuid (string)",
  "started_at": "ISO 8601 timestamp (string)",
  "submitted_at": "ISO 8601 timestamp (string) or null",
  "completed_at": "ISO 8601 timestamp (string) or null",
  "time_spent_seconds": "integer",
  "submission_id": "uuid (string) or null"
}
```

## Field Details

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `session_id` | UUID | Yes | Unique session identifier |
| `user_id` | UUID | Yes | User attempting the challenge |
| `mission_id` | UUID | Yes | Mission being challenged |
| `status` | String | Yes | Current session status |
| `environment_id` | UUID | Yes | Associated GCP environment |
| `started_at` | Timestamp | Yes | When the challenge was started |
| `submitted_at` | Timestamp or null | No | When submitted for evaluation |
| `completed_at` | Timestamp or null | No | When evaluation completed |
| `time_spent_seconds` | Integer | Yes | Total time spent on the challenge |
| `submission_id` | UUID or null | No | Associated submission record |

## Rules

- `status` must be one of: PENDING, ACTIVE, SUBMITTED, COMPLETED, FAILED, CANCELLED
- Once COMPLETED or FAILED, the session is final
- `submission_id` is populated only after submission
- `time_spent_seconds` is calculated from `started_at` to `submitted_at` or current time
- A user can have multiple sessions for the same mission

## Usage

Produced by:
- P4 Challenge Service on `POST /challenges/start`

Consumed by:
- P5 — For evaluation against submissions
- P6 — For feedback generation
- P1 — To display session status
