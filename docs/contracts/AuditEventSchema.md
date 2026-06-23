# AuditEventSchema

**Producer:** All Services  
**Consumer:** P7 (Audit Service)

## Definition

```json
{
  "event_id": "uuid (string)",
  "event_type": "string",
  "source": "AUTH_SERVICE | SCENARIO_SERVICE | CHALLENGE_SERVICE | EVALUATION_SERVICE | FEEDBACK_SERVICE | PROGRESS_SERVICE",
  "user_id": "uuid (string) or null",
  "resource_type": "string or null",
  "resource_id": "uuid (string) or null",
  "action": "CREATE | READ | UPDATE | DELETE | EXECUTE",
  "details": "object",
  "status": "SUCCESS | FAILURE",
  "error_message": "string or null",
  "timestamp": "ISO 8601 timestamp (string)",
  "request_id": "string or null"
}
```

## Field Details

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `event_id` | UUID | Yes | Unique event identifier |
| `event_type` | String | Yes | Semantic event type (USER_REGISTERED, CHALLENGE_STARTED, etc.) |
| `source` | String | Yes | Which service produced the event |
| `user_id` | UUID or null | No | Affected user (null for system events) |
| `resource_type` | String or null | No | Type of resource affected (USER, MISSION, SESSION, etc.) |
| `resource_id` | UUID or null | No | ID of affected resource |
| `action` | String | Yes | One of: CREATE, READ, UPDATE, DELETE, EXECUTE |
| `details` | Object | Yes | Additional context (key-value pairs) |
| `status` | String | Yes | SUCCESS or FAILURE |
| `error_message` | String or null | No | Error details if status=FAILURE |
| `timestamp` | Timestamp | Yes | Event occurrence time (UTC) |
| `request_id` | String or null | No | Trace ID for request correlation |

## Rules

- `event_id` is globally unique and auto-generated
- `event_type` follows pattern: `RESOURCE_ACTION` (e.g., USER_LOGIN, MISSION_GENERATED)
- **Append-only table** — NO UPDATE or DELETE statements allowed
- All timestamps must be in UTC with timezone info
- `user_id` is null for system-level events (e.g., health checks)
- Events are immutable once written

## Standard Event Types

| Event Type | Source | Description |
|------------|--------|-------------|
| `USER_REGISTERED` | P2 | User account created |
| `USER_LOGIN` | P2 | User authenticated via Clerk |
| `USER_LOGOUT` | P2 | User logged out |
| `MISSION_GENERATED` | P3 | New mission created by AI |
| `CHALLENGE_STARTED` | P4 | Learner started a challenge |
| `CHALLENGE_STOPPED` | P4 | Learner stopped a challenge |
| `SUBMISSION_CREATED` | P1 | Learner submitted work |
| `EVALUATION_RUN` | P5 | Evaluation executed |
| `EVALUATION_COMPLETE` | P5 | Evaluation finished |
| `FEEDBACK_GENERATED` | P6 | AI feedback created |
| `PROGRESS_SYNCED` | P7 | Progress updated |

## Usage

All services write to this table via `AuditService.write_event()`:

```python
audit_service.write_event(
    db=db,
    event_type="USER_LOGIN",
    source="AUTH_SERVICE",
    user_id=user.user_id,
    action="EXECUTE",
    details={"auth_method": "clerk", "ip": "..."},
    status="SUCCESS"
)
```

Consumed by:
- P7 Progress/Audit Service for compliance, debugging, and analytics
