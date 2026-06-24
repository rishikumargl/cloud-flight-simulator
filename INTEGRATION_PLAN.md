# INTEGRATION PLAN: P3 (Scenario Generation) → P4 (Challenge Provisioning)

**Date:** 2026-06-23  
**Status:** ANALYSIS PHASE (Code generation follows after approval)  
**Owner:** P4 (requires P2 router registration)

---

## EXECUTIVE SUMMARY

**Current State:**
- P3 Scenario Service generates missions and stores them in `missions` table ✅
- P4 Challenge Service provisions GCP resources but uses `HARDCODED_MISSION` ❌
- P4 is a standalone FastAPI app, not integrated into main backend ❌

**Goal:**
- Replace HARDCODED_MISSION with actual P3-generated scenario data
- Convert P4 standalone app → FastAPI router registered in main.py
- Implement database-backed challenge session tracking
- Wire GET /scenarios/{mission_id} → POST /challenges/start flow

**Integration Flow (Desired):**
```
Frontend
  ↓
POST /scenarios/generate (P3)
  ↓ returns MissionSchema with mission_id
Frontend stores mission_id
  ↓
POST /challenges/start (P4) 
  payload: { "mission_id": "uuid" }
  ↓
P4 loads mission from missions table
  ↓
P4 extracts provisioning parameters
  ↓
P4 provisions GCP resources
  ↓
P4 returns ChallengeSessionSchema + EnvironmentSchema
  ↓
Frontend displays mission and GCP console link
```

---

## PHASE BREAKDOWN

### PHASE 1: CODE ANALYSIS ✅ (COMPLETE)

#### Findings:

**P3 Scenario Service:**
- ✅ Generates MissionSchema via LangChain chain
- ✅ Stores in `missions` table
- ✅ Route: `POST /scenarios/generate` → returns MissionSchema
- ✅ Route: `GET /scenarios/{mission_id}` → returns MissionSchema from DB
- ✅ Writes MISSION_GENERATED audit events

**P3 Model (missions table):**
```python
mission_id (UUID, PK)
track (STRING)
difficulty (STRING)
title (STRING)
business_context (TEXT)
objectives (JSONB)
success_criteria (JSONB)  ← Contains name_suffix, machine_type, zone, startup_script, etc.
time_limit_minutes (INTEGER)
generated_by (STRING)
created_at (DATETIME)
```

**P4 Challenge Service (CURRENT STATE):**
- ❌ Standalone FastAPI app (backend/app/challenges/main.py)
- ❌ No router pattern
- ❌ No database integration for sessions
- ❌ Uses HARDCODED_MISSION (hardcoded dict)
- ❌ In-memory tracking: `active_instances = {}`
- ❌ Routes: `/api/launch-lab`, `/api/stop-lab` (wrong paths, wrong request format)
- ✅ Has working GCP provisioning logic
- ✅ Has IAM binding and cleanup logic
- ✅ Has threading-based timeout cleanup

**P4 Hardcoded Mission Structure:**
```python
HARDCODED_MISSION = {
    "mission_id": "mission-9cf2-4b2a",
    "track": "COMPUTE",
    "difficulty": "BEGINNER",
    "title": "Deploy a Public Web Server",
    "business_context": "...",
    "objectives": [...],
    "success_criteria": [
        {
            "criterion_id": "crit-890a-11bc",
            "description": "VM exists",
            "resource_type": "compute_instance",
            "expected_state": {
                "name_suffix": "web-01",
                "machine_type": "e2-micro",
                "zone": "us-central1-a",
                "network": "default",
                "startup_script": "#!/bin/bash\napt-get update..."
            },
            "weight": 50
        }
    ],
    "time_limit_minutes": 45,
    ...
}
```

**Database Tables to Use:**
- `missions` (READ) — Load generated missions
- `challenge_sessions` (READ/WRITE) — Create and track sessions
- `environments` (READ/WRITE) — Track GCP environments
- `audit_events` (WRITE) — Write challenge lifecycle events

**Frozen Routes (P4 must implement exactly these):**
1. `POST /challenges/start` ← Currently `/api/launch-lab` (WRONG)
2. `GET /challenges/{session_id}/status` ← Missing
3. `POST /challenges/{session_id}/stop` ← Currently `/api/stop-lab` (WRONG)

---

### PHASE 2: DATABASE MODELS & ORM

**Create P4 Models (if not exist):**

Need to map existing `challenge_sessions` and `environments` tables to ORM models.

**Required Models:**

1. **ChallengeSession Model**
   ```python
   class ChallengeSession(Base):
       __tablename__ = "challenge_sessions"
       session_id: UUID (PK)
       user_id: UUID (FK → users)
       mission_id: UUID (FK → missions)
       status: VARCHAR (PENDING, ACTIVE, SUBMITTED, COMPLETED, FAILED, CANCELLED)
       environment_id: UUID (FK → environments)
       started_at: DATETIME
       submitted_at: DATETIME (nullable)
       completed_at: DATETIME (nullable)
       time_spent_seconds: INT
       submission_id: UUID (FK → submissions, nullable)
   ```

2. **Environment Model**
   ```python
   class Environment(Base):
       __tablename__ = "environments"
       env_id: UUID (PK)
       session_id: UUID (FK → challenge_sessions, UNIQUE)
       gcp_project_id: VARCHAR
       resource_prefix: VARCHAR (UNIQUE)
       status: VARCHAR (PROVISIONING, ACTIVE, TERMINATING, TERMINATED)
       gcp_resources: JSONB (compute instances, buckets, etc.)
       environment_url: VARCHAR
       credentials_url: VARCHAR (nullable)
       created_at: DATETIME
       expires_at: DATETIME
   ```

---

### PHASE 3: CONVERT P4 TO ROUTER PATTERN

**Task:** Convert `backend/app/challenges/main.py` → Router structure

**Steps:**
1. Create `backend/app/challenges/router.py` with APIRouter
2. Move endpoints from main.py to router.py
3. Fix route paths: `/api/launch-lab` → `/challenges/start`
4. Fix request/response formats to match frozen contracts
5. Delete `backend/app/challenges/main.py` (don't keep standalone app)

**Current P4 Code:**
- `launch_lab(LaunchLabRequest)` where LaunchLabRequest has `user_email: EmailStr`
- `stop_lab(StopLabRequest)` where StopLabRequest has `user_email` and `vm_name`

**New P4 Code (per frozen contracts):**
- `POST /challenges/start` input: `{ "mission_id": "uuid" }`
- `POST /challenges/{session_id}/stop` input: just path param
- Auth: Get `user_id` from `get_current_user` dependency
- Output: ChallengeSessionSchema + EnvironmentSchema

---

### PHASE 4: REPLACE HARDCODED_MISSION WITH DB LOOKUP

**Task:** Load mission from missions table instead of hardcoded dict

**Changes:**
1. Replace:
   ```python
   mission_data = HARDCODED_MISSION
   ```
   With:
   ```python
   mission_data = db.query(Mission).filter(Mission.mission_id == mission_id).first()
   if not mission_data:
       raise HTTPException(404, "Mission not found")
   ```

2. Extract provisioning parameters from mission.success_criteria:
   ```python
   compute_criteria = next(
       (c for c in mission_data.success_criteria 
        if c["resource_type"] == "compute_instance"),
       None
   )
   expected_state = compute_criteria["expected_state"]
   
   name_suffix = expected_state.get("name_suffix")
   machine_type = expected_state.get("machine_type")
   zone = expected_state.get("zone")
   startup_script = expected_state.get("startup_script")
   ```

3. Resource prefix generation (per P4_CHALLENGES.md):
   ```python
   # Format: lab-{session_id_short}-{user_identifier}
   resource_prefix = f"lab-{str(session_id)[:8]}-{user_identifier}"
   # Must be unique in database
   ```

---

### PHASE 5: DATABASE-BACKED TRACKING

**Task:** Replace in-memory `active_instances = {}` with database

**Current P4 Code:**
```python
active_instances[user_email] = {
    "vm_name": vm_name,
    "zone": zone,
    "created_at": time.time(),
    "time_limit_minutes": time_limit_minutes
}
```

**New P4 Code:**
```python
session = ChallengeSession(
    session_id=uuid4(),
    user_id=user_id,
    mission_id=mission_id,
    status="PENDING",
    environment_id=None,  # Will be set after env creation
    started_at=datetime.utcnow(),
)
db.add(session)
db.commit()

environment = Environment(
    env_id=uuid4(),
    session_id=session.session_id,
    gcp_project_id=GCP_PROJECT_ID,
    resource_prefix=resource_prefix,
    status="PROVISIONING",
    gcp_resources={},  # Will populate after provisioning
    environment_url=gcp_console_url,
    created_at=datetime.utcnow(),
    expires_at=datetime.utcnow() + timedelta(minutes=mission.time_limit_minutes),
)
db.add(environment)
db.commit()

# Update session with environment_id
session.environment_id = environment.env_id
session.status = "ACTIVE"
db.commit()
```

**Benefits:**
- Survives server restarts
- P5 can query sessions for evaluation
- P7 can query for audit history
- Session state is persistent, auditable

---

### PHASE 6: ROUTE MAPPING

**Frozen Routes (from CLAUDE.md):**

| Route | Current P4 | New P4 | Input | Output |
|-------|-----------|--------|-------|--------|
| POST /challenges/start | `/api/launch-lab` | ✅ Implement | `{ "mission_id": "uuid" }` | ChallengeSessionSchema + EnvironmentSchema |
| GET /challenges/{session_id}/status | ❌ Missing | ✅ Implement | Path param | ChallengeSessionSchema + EnvironmentSchema |
| POST /challenges/{session_id}/stop | `/api/stop-lab` | ✅ Implement | Path param | ChallengeSessionSchema |

**Request Format Conversion:**

**Current:**
```json
POST /api/launch-lab
{ "user_email": "user@gmail.com" }
```

**New (Frozen):**
```json
POST /challenges/start
{ "mission_id": "550e8400-e29b-41d4-a716-446655440000" }

// user_id comes from JWT (get_current_user dependency)
// mission_id comes from request body
```

---

### PHASE 7: RESPONSE FORMAT

**Current P4 Response:**
```json
{
    "status": "Success",
    "vm_name": "web-01-abc123",
    "gcp_console_url": "https://...",
    "time_limit_minutes": 45,
    "display_data": {...},
    "metadata": {...}
}
```

**New (Frozen Contracts):**

**ChallengeSessionSchema:**
```json
{
    "session_id": "uuid",
    "user_id": "uuid",
    "mission_id": "uuid",
    "status": "ACTIVE",
    "environment_id": "uuid",
    "started_at": "2026-06-23T12:34:56Z",
    "submitted_at": null,
    "completed_at": null,
    "time_spent_seconds": 0,
    "submission_id": null
}
```

**EnvironmentSchema:**
```json
{
    "environment_id": "uuid",
    "session_id": "uuid",
    "gcp_project_id": "cloud-flight-sim",
    "status": "ACTIVE",
    "gcp_resources": {
        "compute_instances": ["web-01-abc123"],
        "storage_buckets": [],
        "databases": []
    },
    "environment_url": "https://console.cloud.google.com/compute/...",
    "credentials_url": null,
    "created_at": "2026-06-23T12:34:56Z",
    "expires_at": "2026-06-23T13:19:56Z"
}
```

**Response Format (per CLAUDE.md):**
```json
{
    "success": true,
    "data": {
        "session": ChallengeSessionSchema,
        "environment": EnvironmentSchema
    }
}
```

---

### PHASE 8: AUDIT EVENTS

**P4 Must Write (per P4_CHALLENGES.md):**

| Event | When | Source |
|-------|------|--------|
| CHALLENGE_STARTED | Session created, status → ACTIVE | CHALLENGE_SERVICE |
| ENVIRONMENT_PROVISIONED | GCP resources provisioned | CHALLENGE_SERVICE |
| ENVIRONMENT_DESTROYED | Resources cleaned up | CHALLENGE_SERVICE |
| CHALLENGE_COMPLETED | Session stopped explicitly | CHALLENGE_SERVICE |
| CHALLENGE_TIMEOUT | Session expires | CHALLENGE_SERVICE |

**Integration Point:**
```python
from app.audit_dependency import audit_service

audit_service.write_event(
    db=db,
    event_type="CHALLENGE_STARTED",
    source="CHALLENGE_SERVICE",
    user_id=user_id,
    payload={"session_id": str(session_id), "mission_id": str(mission_id)},
)
```

---

### PHASE 9: CLEANUP & TIMEOUT HANDLING

**Current P4:**
```python
cleanup_thread = threading.Thread(target=auto_cleanup, daemon=True)
cleanup_thread.start()
```

**Issues:**
- Thread lost on server restart
- No database record of cleanup

**New P4:**
- Create environment with `expires_at` timestamp
- P7 (or Cloud Scheduler) queries for expired sessions
- Trigger cleanup via scheduled job
- Write ENVIRONMENT_DESTROYED + CHALLENGE_TIMEOUT audit events

**Short-term:** Keep threading as fallback, add Cloud Scheduler integration for durability (Day 4 deliverable)

---

## FIELD MAPPING: MissionSchema → GCP Provisioning

**Source:** mission.success_criteria (JSONB array)

**Target:** Each success criterion maps to a GCP resource to provision

**Example Mapping:**

```python
# Input (from MissionSchema.success_criteria[0])
{
    "criterion_id": "crit-890a-11bc",
    "description": "VM exists",
    "resource_type": "compute_instance",
    "expected_state": {
        "name_suffix": "web-01",
        "machine_type": "e2-micro",
        "zone": "us-central1-a",
        "network": "default",
        "startup_script": "#!/bin/bash\napt-get update && apt-get install -y apache2"
    },
    "weight": 50
}

# Output (P4 provisions)
name_suffix = "web-01"
machine_type = "e2-micro"
zone = "us-central1-a"
startup_script = "#!/bin/bash\napt-get update && apt-get install -y apache2"

# With resource_prefix
resource_prefix = "lab-abc123-prithvi"
full_vm_name = f"{name_suffix}-{uuid4()[:8]}" = "web-01-xyz789"

# Labels (P4 must add to all resources)
labels = {
    "session_id": session_id,
    "user_id": user_id,
    "expires_at": expires_at,
    "resource_prefix": resource_prefix
}
```

---

## FILES TO MODIFY

### P4 Domain (backend/app/challenges/):

| File | Action | Reason |
|------|--------|--------|
| `router.py` | CREATE | Convert main.py to router pattern |
| `schemas.py` | CREATE | Define ChallengeSessionSchema, EnvironmentSchema (Pydantic) |
| `models.py` | CREATE | Define ChallengeSession, Environment ORM models |
| `service.py` | CREATE | Refactor provisioning logic from main.py |
| `main.py` | DELETE | Remove standalone app |
| `__init__.py` | CREATE | If not exists |

### P2 Domain (requires P2 action):

| File | Action | Reason |
|------|--------|--------|
| `backend/app/main.py` | MODIFY | Register `challenges_router` |

### No Other Files Modified:
- ✅ P3 (scenarios) code unchanged
- ✅ P2 (auth, config, database) unchanged
- ✅ Database schema unchanged (tables already exist)
- ✅ Contracts unchanged (already defined)

---

## UNRESOLVED BLOCKERS

### 1. ✅ RESOLVED: Database Tables Exist
- `challenge_sessions` table exists ✅
- `environments` table exists ✅
- Schema matches P4_CHALLENGES.md ✅

### 2. ⚠️ BLOCKER: AuditService (P7)
- P4 code imports: `from app.audit_dependency import audit_service`
- **MUST VERIFY:** Does P7 have audit_service.write_event() implemented?
- **STATUS:** Checked earlier, P7 hasn't implemented it yet
- **ACTION NEEDED:** P7 must implement before P4 can merge

### 3. ⚠️ BLOCKER: Cloud Scheduler Integration
- P4_CHALLENGES.md requires Cloud Scheduler for hourly cleanup
- **STATUS:** Not needed for Phase 1 (threading fallback is OK)
- **ACTION NEEDED:** Day 4 deliverable, can be deferred

### 4. ✅ RESOLVED: GCP SDK Available
- google-cloud-compute ✅
- google-cloud-storage ✅
- google-api-python-client ✅
- All required packages in backend/requirements.txt

### 5. ⚠️ MINOR: Service Account Credentials
- Current P4 code expects: SERVICE_ACCOUNT_KEY_PATH (file-based)
- **Per P4_CHALLENGES.md:** Should use Workload Identity, not key file
- **STATUS:** Current implementation uses service_account.Credentials.from_service_account_file()
- **ACTION NEEDED:** Keep as-is for Phase 1, refactor to Workload Identity in Phase 2

---

## TESTING STRATEGY (After Implementation)

### Unit Tests Needed:
1. Mission lookup from missions table
2. Resource prefix generation (uniqueness)
3. Session creation and status updates
4. Environment record creation
5. Cleanup logic

### Integration Tests Needed:
1. POST /challenges/start with valid mission_id
2. GET /challenges/{session_id}/status returns current state
3. POST /challenges/{session_id}/stop cleans up resources
4. Audit events written for each lifecycle event
5. Database records persisted across server restart

### Manual Testing (Dev):
1. Generate mission via POST /scenarios/generate
2. Start challenge via POST /challenges/start with mission_id
3. View GCP console URL
4. Stop challenge via POST /challenges/{session_id}/stop
5. Verify VM deleted, IAM binding revoked
6. Check audit_events table for all events written

---

## DEPENDENCIES & IMPORTS

### New Imports Needed:
```python
# ORM models
from app.database import Base
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import ForeignKey

# Pydantic schemas
from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime, timedelta

# FastAPI
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

# Auth & DB
from app.dependencies import get_current_user, get_db

# Audit
from app.audit_dependency import audit_service

# GCP
from google.cloud import compute_v1, resourcemanager_v3
from google.oauth2 import service_account

# Standard
import threading
from typing import Optional, Dict, List, Any
```

### No New Dependencies Added:
- All packages already in requirements.txt ✅
- No new external libraries needed ✅

---

## DECISION POINTS FOR APPROVAL

### Decision 1: Workload Identity vs Service Account Key File
- **Current:** Uses service_account_key.json file (P4/challenges/main.py line 10)
- **Per P4_CHALLENGES.md:** Should use Workload Identity (no key files)
- **Recommendation:** Phase 1 keeps current approach, Phase 2 refactors to Workload Identity
- **Impact:** Deferred security improvement, doesn't block integration

### Decision 2: Resource Prefix Format
- **P4_CHALLENGES.md specifies:** `lab-{session_id_short}-{user_identifier}`
- **Questions:** What is `user_identifier`? Email? UUID?
- **Recommendation:** Use UUID first 8 chars: `lab-{session_id[:8]}-{user_id[:8]}`
- **Alternative:** Use email domain or display name
- **Impact:** Must be unique, P4 enforces via DB unique constraint

### Decision 3: Cleanup Timeout Strategy
- **Current:** Threading-based cleanup (lost on restart)
- **Per P4_CHALLENGES.md:** Cloud Scheduler for hourly safety-net cleanup
- **Recommendation:** Phase 1 keeps threading as fallback, P4 adds Cloud Scheduler in Phase 2
- **Impact:** Phase 1 has resource leak if server restarts during challenge

### Decision 4: IAM Binding Approach
- **Current:** Grants roles to learner email at project level
- **Per P4_CHALLENGES.md:** Conditional IAM binding with CEL expressions matching resource_prefix
- **Recommendation:** Phase 1 simplifies to project-level grants, Phase 2 adds CEL conditions
- **Impact:** Security reduced in Phase 1, learner can access any resource with granted role

---

## SUCCESS CRITERIA

### Phase 1 Complete When:
- ✅ P4 code is a router, not standalone app
- ✅ POST /challenges/start creates session + provisions GCP resources
- ✅ GET /challenges/{session_id}/status returns session and environment state
- ✅ POST /challenges/{session_id}/stop terminates session and cleans up
- ✅ Mission data loaded from missions table (no hardcoded scenarios)
- ✅ Database records created in challenge_sessions and environments tables
- ✅ Audit events written for CHALLENGE_STARTED, ENVIRONMENT_PROVISIONED, ENVIRONMENT_DESTROYED, CHALLENGE_COMPLETED
- ✅ Frontend can call POST /scenarios/generate → POST /challenges/start flow end-to-end
- ✅ GCP VMs provision successfully
- ✅ GCP console URLs work

### Phase 2 Complete When:
- ⏳ Workload Identity implemented (no key files)
- ⏳ Cloud Scheduler integration for hourly cleanup
- ⏳ CEL-based IAM conditional bindings
- ⏳ Emergency cleanup script

---

## NEXT STEPS

### Approval Required:
1. ✅ Analyze existing code (DONE)
2. ⏳ Approve integration plan (PENDING)
3. ⏳ Clarify decision points above
4. ⏳ Generate Phase 1 implementation code
5. ⏳ Code review + testing

### If Approved:
- Generate P4 router.py with all endpoints
- Generate P4 models.py with ORM classes
- Generate P4 schemas.py with Pydantic contracts
- Generate P4 service.py with refactored provisioning logic
- Request P2 to register router in main.py
- Request P7 to verify AuditService interface

---

**Status:** Ready for approval. Proceeding to code generation pending user confirmation.
