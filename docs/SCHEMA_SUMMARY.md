# Database Schema Summary — Revision 001

**Migration File:** `versions/001_initial_schema.py`  
**Revision ID:** 001  
**Create Date:** 2026-06-21  
**Status:** Day 1 Platform Foundation

---

## Overview

This migration creates all 9 platform tables as specified in the architecture document. All tables are created in a single migration to prevent schema drift during development.

---

## Table Inventory

### 1. `users` (Auth Domain)

**Purpose:** Learner account management

**Columns:**
| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| user_id | UUID | PRIMARY KEY | gen_random_uuid() |
| email | VARCHAR(255) | UNIQUE NOT NULL | - |
| password_hash | VARCHAR(255) | NOT NULL | - |
| full_name | VARCHAR(255) | NULLABLE | - |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() |
| updated_at | TIMESTAMPTZ | NOT NULL | NOW() |

**Indexes:**
- `idx_users_email` on (email)

**Foreign Key Relationships:**
- Referenced by: `refresh_tokens.user_id` (1:N)
- Referenced by: `challenge_sessions.user_id` (1:N)
- Referenced by: `audit_events.user_id` (1:N)

---

### 2. `refresh_tokens` (Auth Domain)

**Purpose:** JWT session management and token rotation

**Columns:**
| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| token_id | UUID | PRIMARY KEY | gen_random_uuid() |
| user_id | UUID | NOT NULL, FK(users.user_id) | - |
| token_hash | VARCHAR(255) | NOT NULL | - |
| expires_at | TIMESTAMPTZ | NOT NULL | - |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() |

**Indexes:**
- `idx_refresh_tokens_user` on (user_id)

**Foreign Key Relationships:**
- References: `users.user_id` (many:one)

---

### 3. `missions` (Scenario Domain — P3 produces, P2 creates)

**Purpose:** AI-generated challenge definitions

**Columns:**
| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| mission_id | UUID | PRIMARY KEY | gen_random_uuid() |
| track | VARCHAR(50) | NOT NULL | - |
| difficulty | VARCHAR(50) | NOT NULL | - |
| title | VARCHAR(255) | NOT NULL | - |
| business_context | TEXT | NOT NULL | - |
| objectives | JSON | NOT NULL | - |
| success_criteria | JSON | NOT NULL | - |
| time_limit_minutes | INTEGER | NOT NULL | - |
| generated_by | VARCHAR(100) | NOT NULL | 'scenario-generator' |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() |

**Indexes:**
- `idx_missions_track` on (track)
- `idx_missions_difficulty` on (difficulty)

**Foreign Key Relationships:**
- Referenced by: `challenge_sessions.mission_id` (1:N)

---

### 4. `challenge_sessions` (Challenge Domain — P4 produces, P2 creates)

**Purpose:** Learner mission attempts and session state

**Columns:**
| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| session_id | UUID | PRIMARY KEY | gen_random_uuid() |
| user_id | UUID | NOT NULL, FK(users.user_id) | - |
| mission_id | UUID | NOT NULL, FK(missions.mission_id) | - |
| status | VARCHAR(50) | NOT NULL | 'CREATED' |
| started_at | TIMESTAMPTZ | NULLABLE | - |
| completed_at | TIMESTAMPTZ | NULLABLE | - |
| expires_at | TIMESTAMPTZ | NULLABLE | - |
| score | NUMERIC(5,2) | NULLABLE | - |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() |

**Indexes:**
- `idx_sessions_user` on (user_id)
- `idx_sessions_mission` on (mission_id)

**Foreign Key Relationships:**
- References: `users.user_id` (many:one)
- References: `missions.mission_id` (many:one)
- Referenced by: `environments.session_id` (1:1)
- Referenced by: `submissions.session_id` (1:N)
- Referenced by: `evaluations.session_id` (1:N)
- Referenced by: `feedback_reports.session_id` (1:N)
- Referenced by: `audit_events.session_id` (1:N)

---

### 5. `environments` (Challenge Domain — P4 produces, P2 creates)

**Purpose:** Temporary GCP environment provisioning state

**Columns:**
| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| env_id | UUID | PRIMARY KEY | gen_random_uuid() |
| session_id | UUID | UNIQUE NOT NULL, FK(challenge_sessions.session_id) | - |
| gcp_project_id | VARCHAR(255) | NOT NULL | - |
| scoped_sa_email | VARCHAR(500) | NOT NULL | - |
| resource_prefix | VARCHAR(20) | UNIQUE NOT NULL | - |
| status | VARCHAR(20) | NOT NULL | 'PROVISIONING' |
| expires_at | TIMESTAMPTZ | NOT NULL | - |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() |
| destroyed_at | TIMESTAMPTZ | NULLABLE | - |

**Indexes:**
- `idx_environments_active_prefix` on (resource_prefix) WHERE status = 'READY' (UNIQUE, partial)

**Foreign Key Relationships:**
- References: `challenge_sessions.session_id` (one:one)

---

### 6. `submissions` (Submission Domain)

**Purpose:** Learner explanations and text-based submissions

**Columns:**
| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| submission_id | UUID | PRIMARY KEY | gen_random_uuid() |
| session_id | UUID | NOT NULL, FK(challenge_sessions.session_id) | - |
| explanation | TEXT | NOT NULL | - |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() |

**Indexes:**
- `idx_submissions_session` on (session_id)

**Foreign Key Relationships:**
- References: `challenge_sessions.session_id` (many:one)

---

### 7. `evaluations` (Evaluation Domain — P5 produces, P2 creates)

**Purpose:** Deterministic scoring results

**Columns:**
| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| evaluation_id | UUID | PRIMARY KEY | gen_random_uuid() |
| session_id | UUID | NOT NULL, FK(challenge_sessions.session_id) | - |
| percentage | NUMERIC(5,2) | NOT NULL | - |
| criteria_results | JSON | NOT NULL | - |
| resource_snapshot | JSON | NOT NULL | - |
| evaluated_at | TIMESTAMPTZ | NOT NULL | NOW() |

**Indexes:**
- `idx_evaluations_session` on (session_id)

**Foreign Key Relationships:**
- References: `challenge_sessions.session_id` (many:one)

---

### 8. `feedback_reports` (Feedback Domain — P6 produces, P2 creates)

**Purpose:** AI-generated learner feedback and recommendations

**Columns:**
| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| feedback_id | UUID | PRIMARY KEY | gen_random_uuid() |
| session_id | UUID | NOT NULL, FK(challenge_sessions.session_id) | - |
| summary | TEXT | NOT NULL | - |
| strengths | JSON | NULLABLE | - |
| mistakes | JSON | NULLABLE | - |
| improvements | JSON | NULLABLE | - |
| next_recommendation | JSON | NULLABLE | - |
| generated_at | TIMESTAMPTZ | NOT NULL | NOW() |

**Indexes:**
- `idx_feedback_session` on (session_id)

**Foreign Key Relationships:**
- References: `challenge_sessions.session_id` (many:one)

---

### 9. `audit_events` (Audit Domain — P7 owns, P2 creates)

**Purpose:** Append-only audit trail (immutable)

**Columns:**
| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| event_id | UUID | PRIMARY KEY | gen_random_uuid() |
| user_id | UUID | NULLABLE, FK(users.user_id) | - |
| session_id | UUID | NULLABLE, FK(challenge_sessions.session_id) | - |
| event_type | VARCHAR(100) | NOT NULL | - |
| source | VARCHAR(100) | NOT NULL | - |
| payload | JSON | NULLABLE | - |
| occurred_at | TIMESTAMPTZ | NOT NULL | NOW() |

**Indexes:**
- `idx_audit_user` on (user_id)
- `idx_audit_session` on (session_id)
- `idx_audit_event_type` on (event_type)

**Foreign Key Relationships:**
- References: `users.user_id` (many:one, optional)
- References: `challenge_sessions.session_id` (many:one, optional)

**Special Properties:**
- APPEND-ONLY: No UPDATE or DELETE operations allowed
- All foreign keys are optional (user_id, session_id can be NULL for system-level events)

---

## Foreign Key Graph

```
users
├─ 1:N refresh_tokens (user_id)
├─ 1:N challenge_sessions (user_id)
└─ 1:N audit_events (user_id, nullable)

missions
└─ 1:N challenge_sessions (mission_id)

challenge_sessions
├─ 1:1 environments (session_id)
├─ 1:N submissions (session_id)
├─ 1:N evaluations (session_id)
├─ 1:N feedback_reports (session_id)
└─ 1:N audit_events (session_id, nullable)
```

---

## Domain Ownership

| Table | Producer/Owner | P2 Role |
|-------|---|---|
| users | P2 | OWNS |
| refresh_tokens | P2 | OWNS |
| missions | P3 | CREATES (via P2) |
| challenge_sessions | P4 | CREATES (via P2) |
| environments | P4 | CREATES (via P2) |
| submissions | P1/P5 | CREATES (via P2) |
| evaluations | P5 | CREATES (via P2) |
| feedback_reports | P6 | CREATES (via P2) |
| audit_events | P7 | CREATES (via P2) |

---

## Data Type Summary

| Type | Usage | Tables |
|------|-------|--------|
| UUID | Primary keys, foreign keys | All tables |
| VARCHAR | Identifiers, status codes, text fields | users, missions, challenge_sessions, environments, audit_events |
| TEXT | Long-form content | missions, submissions, feedback_reports |
| JSON/JSONB | Structured data | missions, evaluations, feedback_reports, audit_events |
| NUMERIC(5,2) | Scores and percentages | challenge_sessions, evaluations |
| TIMESTAMPTZ | Timestamps with timezone awareness | All tables |
| INTEGER | Time limits in minutes | missions |

---

## Constraints Summary

**Primary Keys:** 9 (one per table)  
**Unique Constraints:** 3
- `users.email`
- `environments.session_id`
- `environments.resource_prefix`

**Foreign Keys:** 9
- `refresh_tokens.user_id`
- `challenge_sessions.user_id`
- `challenge_sessions.mission_id`
- `environments.session_id`
- `submissions.session_id`
- `evaluations.session_id`
- `feedback_reports.session_id`
- `audit_events.user_id` (nullable)
- `audit_events.session_id` (nullable)

**Indexes:** 16
- 1 email index
- 2 mission indexes (track, difficulty)
- 2 session indexes (user, mission)
- 1 environments active prefix (partial unique)
- 1 submissions session
- 1 evaluations session
- 1 feedback session
- 3 audit indexes (user, session, event_type)
- 1 refresh tokens index (user)

---

## Migration Verification

✅ All 9 tables created  
✅ All column names match architecture exactly  
✅ All types are PostgreSQL-compatible  
✅ All foreign keys created  
✅ All indexes created  
✅ Partial unique index on environments(resource_prefix) WHERE status = 'READY'  
✅ Downgrade function reverses all operations in reverse order  
✅ No invented columns  
✅ No removed columns  
✅ Audit events table is append-only (no UPDATE/DELETE in schema)

---

## Rollback Strategy

The migration includes a `downgrade()` function that:
1. Drops all indexes in reverse order
2. Drops all tables in reverse dependency order
3. Ensures no foreign key constraint violations

To rollback: `alembic downgrade -1`

---

## Notes

- All UUID columns use PostgreSQL's `gen_random_uuid()` for generation
- All timestamp columns use `TIMESTAMPTZ` for timezone-aware storage
- All JSON columns use PostgreSQL's JSONB type (not JSON) for better performance
- Default values for timestamps use `NOW()` function to capture insertion time
- Foreign key constraints are enforced at the database level
- The `environments.resource_prefix` has a partial unique index that only applies when status='READY'
