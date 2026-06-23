# UserSchema

**Producer:** P2 (Auth Service)  
**Consumers:** P1, P4, P5, P6, P7

## Definition

```json
{
  "user_id": "uuid (string)",
  "email": "string or null",
  "full_name": "string or null",
  "role": "LEARNER | ADMIN | PLATFORM_ADMIN",
  "created_at": "ISO 8601 timestamp (string)"
}
```

## Field Details

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `user_id` | UUID | Yes | Unique user identifier (application-generated) |
| `email` | String or null | No | User email address (may be null for Clerk-only users) |
| `full_name` | String or null | No | User display name (may be null) |
| `role` | String | Yes | User role: `LEARNER` (default) or `ADMIN` |
| `created_at` | Timestamp | Yes | Account creation timestamp in ISO 8601 format |

## Rules

- `user_id` is guaranteed to be non-null and unique across all users
- `role` must be one of: `LEARNER`, `ADMIN`, `PLATFORM_ADMIN`
- `password_hash` must NEVER appear in any response using this schema
- `refresh_tokens` must NEVER appear in any response
- All timestamps are in UTC timezone with timezone info included

## Usage

This schema is returned by:
- `GET /auth/me` — Returns UserSchema for the authenticated user
- Any endpoint that needs to expose user information

All consumers must handle nullable `email` and `full_name` fields gracefully.
