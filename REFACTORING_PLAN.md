# Backend Phase 2 Refactoring Plan

**Goal:** Keep all Phase 2 functionality, reorganize for cleaner hybrid architecture.

**Principle:** Services own their domain, rich responses minimize frontend calls.

---

## Architecture After Refactoring

### Service Responsibilities

**ScenarioService**
- Owns: Mission generation (adaptive context built-in)
- Takes learner history + performance as input
- Returns: MissionSchema (automatically adaptive)
- No new endpoints needed

**ChallengeService**  
- Owns: Challenge lifecycle, provisioning, cleanup
- No changes (already clean)

**EvaluationService (The Intelligence Layer)**
- Owns: Mission assessment + immediate coaching
- Input: session_id
- Output: Rich EvaluationResponse containing:
  - evaluation (score, status, deterministic checks)
  - analytics (completion_time, efficiency, trends)
  - coach (strengths, weaknesses, biggest_mistake, concept, readiness)
  - recommendation (next difficulty, topic, confidence, reason)
- Makes internal call to FeedbackService
- All data derived during evaluation, not persisted separately

**FeedbackService (Internal)**
- Owns: AI coaching text generation
- Called internally by EvaluationService.evaluate()
- Not exposed as separate endpoint
- Returns coached insights used in EvaluationResponse.coach

**ProgressService (New)**
- Owns: Long-term learner progression
- Input: user_id
- Output: ProgressResponse containing:
  - skill_matrix (7 skills with proficiency)
  - achievements (earned badges)
  - stats (total missions, completion rate, average score)
  - history (recent missions with evaluations)
- All values derived dynamically

**AdminService**
- Owns: System-wide reporting
- Separate domain, unchanged

---

## Endpoints After Refactoring

### Keep (Unchanged)
- POST /scenarios/generate
- GET /scenarios/{mission_id}
- POST /challenges/start
- GET /challenges/{session_id}/status
- POST /challenges/{session_id}/stop
- GET /evaluate/{session_id} (cached)
- POST /evaluate/{session_id}/run (now returns enriched response)
- GET /admin/analytics

### Remove
- GET /scenarios/profile/{user_id} → Fold into ProgressService
- GET /scenarios/recommend/{user_id} → Fold into EvaluationResponse.recommendation
- POST /feedback/generate/{session_id} → Internal call only
- GET /feedback/{session_id} → Internal call only
- GET /evaluate/{session_id}/analytics → Fold into EvaluationResponse.analytics
- GET /evaluate/progress/{user_id}/skills → Fold into ProgressService
- GET /evaluate/missions/{mission_id}/insights → New ProgressService endpoint
- GET /challenges/{session_id}/timeline → Fold into GET /challenges/{session_id}/status

### Add
- GET /progress/{user_id} → Return ProgressResponse (replaces 3 endpoints)

---

## Response Structures

### POST /evaluate/{session_id}/run → EvaluationResponse (Enriched)

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
        "passed": [...],
        "failed": [...]
      },
      "evaluated_at": "ISO 8601"
    },
    "analytics": {
      "completion_time_minutes": 42,
      "expected_time_minutes": 45,
      "time_efficiency": 0.93,
      "provisioning_minutes": 5,
      "retry_count": 2,
      "score_trend": "improving | stable | declining"
    },
    "coach": {
      "strengths": ["What you did well"],
      "weaknesses": ["Areas to improve"],
      "biggest_mistake": "Primary error or misconception",
      "recommendation": "Actionable next steps",
      "cloud_concept": "GCP concept to review",
      "estimated_readiness": "READY_FOR_HARDER | REPEAT_THIS_LEVEL | NEEDS_FOUNDATION"
    },
    "recommendation": {
      "next_difficulty": "BEGINNER | INTERMEDIATE | ADVANCED",
      "next_topic": "Suggested focus area",
      "estimated_duration": 45,
      "confidence": 0-100,
      "reason": "Why this recommendation"
    }
  }
}
```

### GET /challenges/{session_id}/status → ChallengeStatusResponse (Enriched)

```json
{
  "success": true,
  "data": {
    "session": { ... },
    "environment": { ... },
    "timeline": {
      "session_created": "ISO 8601",
      "session_started": "ISO 8601",
      "provisioning_started": "ISO 8601",
      "environment_ready": "ISO 8601",
      "first_evaluation": "ISO 8601",
      "completed": "ISO 8601"
    }
  }
}
```

### GET /progress/{user_id} → ProgressResponse (New)

```json
{
  "success": true,
  "data": {
    "user_id": "uuid",
    "skill_matrix": {
      "COMPUTE": {
        "proficiency": 0-100,
        "confidence": 0-100,
        "missions_attempted": N,
        "success_rate": 0-100
      },
      "IAM": { ... },
      ... 7 skills total
    },
    "overall_proficiency": 0-100,
    "achievements": [
      {
        "id": "first-mission",
        "name": "First Mission",
        "earned_at": "ISO 8601"
      },
      ...
    ],
    "stats": {
      "total_missions": N,
      "completed_missions": N,
      "completion_rate": 0-100,
      "average_score": 0-100,
      "total_attempts": N,
      "current_streak": N
    },
    "recent_missions": [
      {
        "mission_id": "uuid",
        "title": "...",
        "difficulty": "BEGINNER | INTERMEDIATE | ADVANCED",
        "score": 0-100,
        "status": "PASSED | PARTIAL | FAILED",
        "completed_at": "ISO 8601"
      }
    ]
  }
}
```

---

## Files to Modify

### Delete
- backend/app/feedback/router.py (feedback is now internal)
- backend/app/admin/schemas.py (consolidated)
- backend/app/scenarios/schemas.py (remove new schemas, keep MissionSchema)

### Modify
- backend/app/evaluation/schemas.py → Enrich EvaluationResponse
- backend/app/evaluation/service.py → Add coaching, analytics, recommendation generation
- backend/app/evaluation/router.py → Keep only 2 endpoints, enrich responses
- backend/app/challenges/router.py → Add timeline to status response
- backend/app/scenarios/schemas.py → Remove LearningProfileSchema, RecommendationSchema
- backend/app/main.py → Remove feedback router

### Create
- backend/app/progress/__init__.py
- backend/app/progress/service.py (ProgressService)
- backend/app/progress/schemas.py (ProgressResponse, SkillSchema, AchievementSchema)
- backend/app/progress/router.py (GET /progress/{user_id})

---

## Implementation Order

1. Create ProgressService (derives all learner progression metrics dynamically)
2. Simplify FeedbackService (keep it internal, remove router)
3. Enrich EvaluationService (add analytics + coaching generation)
4. Enrich EvaluationResponse schema
5. Enrich GET /challenges/{session_id}/status with timeline
6. Remove unnecessary schemas from scenarios
7. Update main.py router registrations
8. Delete unused files
9. Document final architecture

---

## Database Changes

- Remove 009 migration (timeline column not needed)
- Remove policy_constraints from Mission model
- Remove timeline column from ChallengeSession model
- No migrations needed

---

## Key Design Decisions

1. **Adaptive is Automatic** — ScenarioService.generate() always uses learner context. Frontend doesn't choose "adaptive vs normal"—it's just adaptive by default.

2. **Coaching During Evaluation** — Feedback generation happens inside EvaluationService.evaluate(), not as separate endpoint. Learner gets coaching immediately with eval results.

3. **Rich Responses** — POST /evaluate and GET /challenges/status both include everything needed on the page. Frontend doesn't need 5 separate requests.

4. **Progress is Derived** — Skills, achievements, stats are calculated on-demand, not persisted. Fresh data every time, no staleness.

5. **Services are Focused** — Each service owns one domain. No God service. Evaluation owns assessment + immediate coaching. Progress owns long-term metrics. Admin owns reporting.

---

This refactoring keeps all Phase 2 functionality while improving the architecture for maintainability, performance, and frontend developer experience.
