# SubmissionSchema

**Producer:** P1 (Frontend)  
**Consumers:** P5, P6, P7

## Definition

```json
{
  "submission_id": "uuid (string)",
  "session_id": "uuid (string)",
  "user_id": "uuid (string)",
  "content": "string",
  "submission_type": "TEXT_EXPLANATION | SCREENSHOT | RESOURCE_IDS",
  "submitted_at": "ISO 8601 timestamp (string)",
  "metadata": {
    "gcp_resource_ids": ["string"],
    "screenshots": ["string"],
    "custom_fields": {}
  }
}
```

## Field Details

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `submission_id` | UUID | Yes | Unique submission identifier |
| `session_id` | UUID | Yes | Associated challenge session |
| `user_id` | UUID | Yes | User who submitted |
| `content` | String | Yes | Main submission content (explanation or text) |
| `submission_type` | String | Yes | Type of submission |
| `submitted_at` | Timestamp | Yes | When submitted |
| `metadata` | Object | Yes | Additional data (resources, screenshots, etc.) |

## Rules

- `submission_type` must be one of: TEXT_EXPLANATION, SCREENSHOT, RESOURCE_IDS
- `content` can be empty if metadata contains the actual submission
- `metadata.gcp_resource_ids` contains IDs of created/modified GCP resources
- `metadata.screenshots` contains references to uploaded proof screenshots
- One submission per challenge session

## Usage

Produced by:
- P1 Frontend when learner submits their work

Consumed by:
- P5 — For evaluation
- P6 — For feedback generation
- P7 — For audit logging
