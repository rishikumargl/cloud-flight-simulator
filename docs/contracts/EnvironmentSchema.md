# EnvironmentSchema

**Producer:** P4 (Challenge Service)  
**Consumers:** P1, P5

## Definition

```json
{
  "environment_id": "uuid (string)",
  "session_id": "uuid (string)",
  "gcp_project_id": "string",
  "status": "PROVISIONING | ACTIVE | TERMINATING | TERMINATED",
  "gcp_resources": {
    "compute_instances": ["string"],
    "storage_buckets": ["string"],
    "databases": ["string"]
  },
  "environment_url": "string",
  "credentials_url": "string or null",
  "created_at": "ISO 8601 timestamp (string)",
  "expires_at": "ISO 8601 timestamp (string)"
}
```

## Field Details

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `environment_id` | UUID | Yes | Unique environment identifier |
| `session_id` | UUID | Yes | Associated challenge session |
| `gcp_project_id` | String | Yes | GCP project ID for the environment |
| `status` | String | Yes | Environment provisioning status |
| `gcp_resources` | Object | Yes | List of provisioned GCP resources |
| `environment_url` | String | Yes | URL to access the environment |
| `credentials_url` | String or null | No | URL to retrieve credentials (if applicable) |
| `created_at` | Timestamp | Yes | Creation timestamp |
| `expires_at` | Timestamp | Yes | Expiration/cleanup timestamp |

## Rules

- `status` must be one of: PROVISIONING, ACTIVE, TERMINATING, TERMINATED
- Once TERMINATED, the environment cannot be reused
- `credentials_url` may be null for environments without dynamic credentials
- All resources are tracked and cleaned up automatically

## Usage

Produced by:
- P4 Challenge Service when starting a mission

Consumed by:
- P5 — For evaluation against the environment
- P1 — To connect learner to the environment
