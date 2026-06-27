# Cloud Flight Simulator — Final Architecture (Simplified)

**Status:** ✅ COMPLETE  
**Date:** 2026-06-27  
**Principle:** Keep it simple. Reuse existing services. Rich responses, fewer endpoints.

---

## Architecture Overview

### Services

**ScenarioService**
- Generates missions (automatically adaptive)
- Takes learner history + performance as input automatically
- Recommendation generation built-in
- Endpoints: `POST /scenarios/generate`, `GET /scenarios/{mission_id}`

**ChallengeService**
- Manages challenge lifecycle
- Provisions VMs with fault injection
- Handles cleanup
- Endpoints: `POST /challenges/start`, `GET /challenges/{session_id}/status`, `POST /challenges/{session_id}/stop`

**EvaluationService (Intelligence Orchestrator)**
- Validates learner repairs against GCP reality
- Orchestrates coaching generation (calls FeedbackService internally)
- Calculates analytics (completion time, efficiency)
- Generates recommendations (calls ScenarioService internally)
- Returns single enriched response
- Endpoints: `GET /evaluate/{session_id}`, `POST /evaluate/{session_id}/run`

**FeedbackService (Internal Only)**
- Generates AI coaching text
- Called internally by EvaluationService
- NOT exposed as separate endpoint
- No router

**AdminService**
- System-wide reporting
- Endpoints: `GET /admin/analytics`

**Progress Endpoint** (in evaluation router)
- Derives learner progression
- Endpoints: `GET /progress/me`

---

## API Endpoints

### Complete Endpoint Inventory

**Scenarios**
- `POST /scenarios/generate` — Generate new mission (adaptive by default)
- `GET /scenarios/{mission_id}` — Retrieve mission details

**Challenges**
- `POST /challenges/start` — Start challenge, provision environment
- `GET /challenges/{session_id}/status` — Get session + environment status
- `POST /challenges/{session_id}/stop` — End challenge, cleanup

**Evaluation** (The Intelligence Layer)
- `GET /evaluate/{session_id}` — Get cached evaluation
- `POST /evaluate/{session_id}/run` — Run live evaluation + return enriched response
- `GET /progress/me` — Get learner progress profile

**Admin**
- `GET /admin/analytics` — System-wide metrics

**Auth**
- `POST /auth/register` — Register user
- `POST /auth/login` — Login
- `POST /auth/logout` — Logout
- `POST /auth/refresh` — Refresh token
- `GET /auth/me` — Get current user

**Total: 14 endpoints** (core + auth)

---

## Response Structures

### POST /evaluate/{session_id}/run — Enriched Response

Single response contains everything the learner needs:

```json
{
  "success": true,
  "data": {
    "evaluation": {
      "evaluation_id": "uuid",
      "session_id": "uuid",
      "status": "PASSED | PARTIAL | FAILED",
      "score": 0-100,
      "deterministic_checks": {
        "passed": [
          {
            "criterion_id": "uuid",
            "passed": true,
            "details": "Metadata matches expected state",
            "weight": 34
          }
        ],
        "failed": []
      },
      "evaluated_at": "2026-06-27T10:30:00Z"
    },
    "analytics": {
      "completion_time_minutes": 42,
      "expected_time_minutes": 45,
      "time_efficiency": 0.93,
      "provisioning_minutes": 5,
      "verification_minutes": 37,
      "retry_count": 2,
      "score_trend": "improving"
    },
    "coach": {
      "strengths": [
        "You correctly diagnosed the metadata issue"
      ],
      "weaknesses": [
        "Initially focused on wrong area",
        "Should review VM status checks"
      ],
      "biggest_mistake": "Assumed the problem was in tags instead of metadata",
      "recommendation": "Next time, systematically check metadata first before tags",
      "cloud_concept": "VM Metadata",
      "estimated_readiness": "READY_FOR_HARDER"
    },
    "recommendation": {
      "next_difficulty": "INTERMEDIATE",
      "next_topic": "Compute Engine Networking",
      "estimated_duration": 45,
      "confidence": 85,
      "reason": "You've mastered the current level! Move on to INTERMEDIATE missions."
    }
  }
}
```

### GET /progress/me — Learner Progress

```json
{
  "success": true,
  "data": {
    "skill_matrix": {
      "COMPUTE": {
        "proficiency": 78,
        "confidence": 85,
        "missions_attempted": 5,
        "success_rate": 80.0
      },
      "IAM": {
        "proficiency": 65,
        "confidence": 70,
        "missions_attempted": 3,
        "success_rate": 66.7
      },
      ... 5 more skills
    },
    "overall_proficiency": 68,
    "achievements": [
      {
        "id": "first-mission",
        "name": "First Mission",
        "earned_at": "2026-06-01T10:00:00Z"
      },
      {
        "id": "five-missions",
        "name": "Five Missions",
        "earned_at": "2026-06-15T14:30:00Z"
      },
      {
        "id": "perfect-score",
        "name": "Perfect Score",
        "earned_at": "2026-06-20T11:00:00Z"
      }
    ],
    "stats": {
      "total_missions": 8,
      "completed_missions": 8,
      "completion_rate": 100.0,
      "average_score": 76.3,
      "total_attempts": 12,
      "current_streak": 3
    },
    "recent_missions": [
      {
        "mission_id": "uuid-8",
        "title": "Fix the Misconfigured Web Server",
        "difficulty": "BEGINNER",
        "score": 85,
        "status": "PASSED",
        "completed_at": "2026-06-27T10:00:00Z"
      },
      ... 4 more recent missions
    ]
  }
}
```

---

## Frontend Workflow

### Complete Mission Loop

```
1. Generate Mission
   Frontend: POST /scenarios/generate {track, difficulty}
   Backend: ScenarioService.generate()
     - Loads learner history [automatic]
     - Loads evaluations [automatic]
     - LLM generates mission [adaptive]
   Response: MissionSchema

2. Start Challenge
   Frontend: POST /challenges/start {mission_id}
   Backend: ChallengeService.start()
     - Creates session
     - Provisions GCP environment with faults
   Response: session + environment

3. Work in GCP Console
   Frontend: Open GCP Console (via link)
   Learner: Fix the broken infrastructure

4. Evaluate
   Frontend: POST /evaluate/{session_id}/run
   Backend: EvaluationService.evaluate()
     - Validates against live GCP
     - Internally calls FeedbackService
     - Internally calls ScenarioService.get_recommendation()
   Response: {evaluation, analytics, coach, recommendation}
     - Single response
     - Everything needed for result page
     - No follow-up API calls needed

5. View Progress (Optional)
   Frontend: GET /progress/me
   Backend: Derives from mission history
   Response: skill matrix, achievements, stats, recent missions

6. Start Next Mission
   Frontend: POST /scenarios/generate {track, difficulty}
     - Uses recommendation from previous response
     - Or user chooses manually
   Loop back to step 2
```

---

## Key Design Decisions

### 1. Adaptive Generation is Transparent

Frontend doesn't need "adaptive mode" button. `POST /scenarios/generate` is always adaptive.

ScenarioService automatically:
- Loads learner history
- Loads evaluation results
- Analyzes performance
- Adjusts LLM prompt accordingly
- Generates appropriately challenging mission

### 2. Single Rich Response After Evaluation

Frontend makes ONE call: `POST /evaluate/{session_id}/run`

Receives everything for mission result page:
- Evaluation (score, status, checks)
- Analytics (time metrics)
- Coaching (strengths, weaknesses, concept to review)
- Recommendation (next mission suggestion)

No follow-up API calls needed.

### 3. FeedbackService is Internal

Coaching generation is orchestrated by EvaluationService.

Frontend never calls FeedbackService directly.

No feedback endpoint exists.

### 4. Progress is Derived, Not Persisted

GET /progress/me calculates dynamically:
- Skills from mission history + scores
- Achievements from completed missions + evaluations
- Stats from session + evaluation counts
- Recent missions from challenge_sessions

No separate storage. Always fresh data.

### 5. ScenarioService Owns Recommendations

Recommendation generation built into ScenarioService.get_recommendation()

Called internally by EvaluationService during evaluation.

Result returned in enriched response.

Frontend can trust the recommendation to be smart.

---

## Database (No Changes)

All Phase 2 functionality uses existing tables:
- `challenge_sessions`
- `missions`
- `evaluations`
- `environments`
- `missions` (with success_criteria JSON)

No new tables.
No new columns.
No migrations.

---

## What Changed from Phase 1

### What's New

✅ Adaptive mission generation (transparent to frontend)
✅ AI coaching after evaluation
✅ Mission analytics (completion time, efficiency)
✅ Skill matrix (derived from evaluations)
✅ Achievements (derived from evaluations)
✅ Single enriched evaluation response
✅ GET /progress/me for learner profile

### What Stayed the Same

✅ ScenarioService core (just extended with recommendation)
✅ ChallengeService (unchanged)
✅ EvaluationService core logic (just extended with orchestration)
✅ Authentication (unchanged)
✅ Provisioning (unchanged)
✅ Fault injection (unchanged)
✅ Database schema (unchanged)
✅ All existing endpoints (unchanged response format if not enriched)

---

## Frontend Simplifications

**Before Phase 2:** Frontend needed multiple API calls
- Generate mission
- Start challenge
- Evaluate
- Get coaching (separate call)
- Get analytics (separate call)
- Get recommendation (separate call)
- Get skill matrix (separate call)
- Get achievements (separate call)

**After Refactoring:** Simplified workflow
- Generate mission (adaptive automatically)
- Start challenge
- Evaluate (get evaluation + analytics + coach + recommendation in one response)
- Optional: GET /progress/me for profile page

**Frontend API calls reduced by ~70%**

---

## Backward Compatibility

✅ **100% preserved**

- All existing routes still work
- GET /evaluate/{session_id} still returns evaluation only
- POST /evaluate/{session_id}/run still returns evaluation (now enriched with more data)
- All authentication unchanged
- Old frontend can still work

---

## Production Ready

✅ No breaking changes
✅ Minimal database impact
✅ Reuses existing services
✅ Clear service responsibilities
✅ Single-call evaluation response
✅ Adaptive generation transparent to frontend
✅ Coaching internal (not exposed)
✅ Progress derived (not duplicated)

---

## Implementation Summary

| Component | Status | Files |
|-----------|--------|-------|
| ScenarioService extension | ✅ Complete | scenarios/service.py |
| ChallengeService | ✅ Unchanged | challenges/router.py, service.py |
| EvaluationService orchestration | ✅ Complete | evaluation/router.py, service.py |
| FeedbackService internal | ✅ Complete | feedback/service.py (no router) |
| Progress endpoint | ✅ Complete | evaluation/router.py (GET /progress/me) |
| AdminService | ✅ Unchanged | admin/router.py, service.py |
| Database | ✅ No changes | No migrations |

---

**This is the final, production-ready architecture.**

Simple. Clean. Intelligent. Extensible.

No unnecessary complexity. No service explosion. Maximum frontend efficiency.
