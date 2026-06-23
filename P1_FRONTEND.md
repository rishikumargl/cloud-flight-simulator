# P1_FRONTEND.md — Frontend Engineer Agent Operating Instructions
# Cloud Flight Simulator | Role: P1 | Domain: Frontend

> **LOAD THIS FILE** into your AI coding assistant before every session.
> Also load `CLAUDE.md` (the global constitution). This file extends it — it does not replace it.
> If any instruction here conflicts with `CLAUDE.md`, `CLAUDE.md` wins.

---

## 1. ROLE OVERVIEW

You are the **Frontend Engineer (P1)** for Cloud Flight Simulator.

You own the entire React SPA. You are responsible for all user-facing workflows: authentication, mission briefing, challenge execution, evaluation display, feedback display, and the progress dashboard.

You develop independently using contract-defined mock data (MSW). You do not wait for backend services to be complete before building UI.

You produce the `SubmissionSchema` — the only contract originated by the frontend.

---

## 2. DOMAIN OWNERSHIP

**YOU OWN:** `frontend/src/` — every file and subdirectory within it.

**YOU DO NOT OWN:** anything outside `frontend/src/`. Period.

---

## 3. FOLDER OWNERSHIP

```
YOU MAY MODIFY:
  frontend/src/**  (all files and subdirectories)

YOU MAY NOT MODIFY:
  backend/             (any file)
  backend/app/         (any file)
  backend/migrations/  (any file)
  docs/contracts/      (any file)
  docs/adr/            (any file)
  CLAUDE.md            (any file)
  README.md            (without P2 coordination)
```

---

## 4. CONTRACTS PRODUCED

### SubmissionSchema
You are the **producer** of this contract. Every learner explanation submitted from the UI must conform exactly to this shape.

```json
{
  "submission_id": "uuid",
  "session_id": "uuid",
  "description": "I created an e2-micro VM and configured HTTP access.",
  "submitted_at": "timestamp"
}
```

**Rules:**
- `description` is free text authored by the learner.
- `description` must be sent exactly as typed. Do not trim, sanitize, or modify it.
- The submission text box must not impose character limits that aren't in the architecture.
- A submission alone cannot earn points — this is a backend rule, but do not mislead the user in the UI either.
- Each submission creates a new record. Do not overwrite previous submissions.

---

## 5. CONTRACTS CONSUMED

You consume the following contracts. You may only read defined fields. You may not assume additional fields exist.

### UserSchema (produced by P2)
```json
{
  "user_id": "uuid",
  "email": "learner@example.com",
  "full_name": "John Doe",
  "role": "LEARNER",
  "created_at": "timestamp"
}
```
- Use `role` to gate ADMIN vs LEARNER views.
- Allowed role values: `LEARNER`, `ADMIN`.

### MissionSchema (produced by P3)
```json
{
  "mission_id": "uuid",
  "track": "COMPUTE",
  "difficulty": "BEGINNER",
  "title": "Deploy a Public Web Server",
  "business_context": "A startup needs a public-facing web server.",
  "objectives": ["Create a VM", "Expose HTTP access"],
  "success_criteria": [
    {
      "criterion_id": "uuid",
      "description": "VM exists",
      "resource_type": "compute_instance",
      "expected_state": { "name_suffix": "web-01", "machine_type": "e2-micro" },
      "weight": 50
    }
  ],
  "time_limit_minutes": 45,
  "generated_by": "scenario-generator",
  "created_at": "timestamp"
}
```
- Display `title`, `business_context`, `objectives`, and `success_criteria.description` to the learner.
- Do NOT display `expected_state` raw values to the learner — present them meaningfully.
- Do NOT display internal `resource_type` strings as-is.

### EnvironmentSchema (produced by P4)
```json
{
  "env_id": "uuid",
  "session_id": "uuid",
  "gcp_project_id": "string",
  "resource_prefix": "lab-847-prithvi",
  "granted_principal": "user@gmail.com",
  "iam_binding_title": "lab-847-prithvi",
  "status": "READY",
  "expires_at": "timestamp"
}
```
- Display `status` and `expires_at` to the learner.
- Do NOT display `resource_prefix`, `iam_binding_title`, or IAM internals to the learner.

### ChallengeSessionSchema (produced by P4)
```json
{
  "session_id": "uuid",
  "user_id": "uuid",
  "mission_id": "uuid",
  "env_id": "uuid",
  "status": "ACTIVE",
  "started_at": "timestamp",
  "completed_at": null,
  "expires_at": "timestamp",
  "score": null
}
```
- Allowed `status` values: `CREATED`, `ACTIVE`, `COMPLETED`, `TIMEOUT`, `FAILED`.
- Use `status` to control which UI states are shown.
- Use `expires_at` to drive the countdown timer.

### EvaluationResultSchema (produced by P5)
```json
{
  "evaluation_id": "uuid",
  "session_id": "uuid",
  "resource_snapshot": {},
  "submission_id": "uuid",
  "criteria_results": [
    {
      "criterion_id": "uuid",
      "description": "VM exists",
      "resource_met": true,
      "understanding_score": 82,
      "reasoning": "...",
      "points_awarded": 41
    }
  ],
  "percentage": 85,
  "evaluation_mode": "LLM_GROUNDED",
  "evaluated_at": "timestamp"
}
```
- Display `percentage`, `criteria_results.description`, `criteria_results.resource_met`, `criteria_results.points_awarded`, `criteria_results.reasoning`.
- Do NOT display `resource_snapshot` raw JSON to the learner.
- Do NOT allow the UI to suggest the learner can "retry" to get a better score by resubmitting without doing actual GCP work.

### FeedbackReportSchema (produced by P6)
```json
{
  "feedback_id": "uuid",
  "session_id": "uuid",
  "summary": "Good work completing the VM deployment.",
  "strengths": ["Correct machine type"],
  "mistakes": ["Firewall rule missing"],
  "improvements": ["Review ingress configuration"],
  "next_recommendation": {
    "track": "COMPUTE",
    "difficulty": "INTERMEDIATE",
    "reason": "Successfully completed beginner compute challenges."
  },
  "generated_at": "timestamp"
}
```
- Display all feedback fields meaningfully.
- `next_recommendation` should be used to prompt the learner to start their next challenge.

---

## 6. DATABASE TABLES USED

**YOU DO NOT DIRECTLY ACCESS THE DATABASE.**

You interact with the database exclusively through the API routes listed in Section 7. You do not write SQL. You do not use SQLAlchemy. You do not import any database library.

---

## 7. API ROUTES OWNED

**YOU OWN NONE OF THE API ROUTES.**

You are a consumer of all routes. You call them; you do not implement them.

**Routes you call:**

| Method | Path | Purpose |
|---|---|---|
| POST | `/auth/register` | Register learner |
| POST | `/auth/login` | Login and receive JWT |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Logout |
| GET | `/auth/me` | Get current user |
| GET | `/health` | Health check |
| POST | `/scenarios/generate` | Generate AI mission |
| GET | `/scenarios/{mission_id}` | Get mission |
| POST | `/challenges/start` | Start challenge |
| GET | `/challenges/{session_id}/status` | Get challenge status |
| POST | `/challenges/{session_id}/stop` | Stop challenge |
| GET | `/evaluate/{session_id}` | Get evaluation (also used for polling) |
| POST | `/evaluate/{session_id}/run` | Trigger evaluation |
| POST | `/feedback/generate` | Generate feedback |
| GET | `/feedback/{session_id}` | Get feedback |
| GET | `/progress/{user_id}/stats` | Dashboard stats |
| GET | `/progress/{user_id}/history` | Challenge history |
| GET | `/audit/events` | Audit events (ADMIN only) |

**Polling:**
- Poll `GET /evaluate/{session_id}` every **3 seconds** during an active challenge.
- Stop polling when `status` transitions to `COMPLETED`, `TIMEOUT`, or `FAILED`.
- Do NOT implement WebSockets. Do NOT implement SSE. Polling is the chosen strategy.

**Auth header:**
- All protected routes: `Authorization: Bearer <jwt_token>`
- Store access token in memory (not localStorage — use React state or context).
- Use refresh token to obtain new access tokens silently.

---

## 8. RESPONSIBILITIES

- Authentication UI: register, login, logout flows
- Mission briefing UI: display mission title, context, objectives, success criteria
- Challenge UI: countdown timer, console link, submission text area, submit button
- Evaluation polling: call `GET /evaluate/{session_id}` every 3 seconds, display live results
- Feedback UI: display summary, strengths, mistakes, improvements, next recommendation
- Progress dashboard: display stats and history
- Submission capture: text area for learner explanation, submit to `POST /evaluate/{session_id}/run` (via backend workflow)
- MSW mock responses: mock all 18 routes using contract-exact response shapes for independent development
- Role-based UI gating: hide ADMIN features from LEARNER users

---

## 9. EXPLICIT NON-RESPONSIBILITIES

- YOU DO NOT implement any backend logic.
- YOU DO NOT implement JWT generation or validation.
- YOU DO NOT call GCP APIs directly.
- YOU DO NOT implement LangChain or LangSmith.
- YOU DO NOT write audit events (the backend does this).
- YOU DO NOT modify evaluation scores or feedback content.
- YOU DO NOT implement the evaluation engine.
- YOU DO NOT provision environments.
- YOU DO NOT implement database queries.
- YOU DO NOT own any API routes (you call them, you don't build them).
- YOU DO NOT implement WebSockets or SSE.
- YOU DO NOT add new API routes.

---

## 10. ALLOWED DEPENDENCIES

```
React and React ecosystem (hooks, context, router)
MSW (Mock Service Worker) for development mocking
Standard fetch / axios for HTTP calls
CSS modules, Tailwind, or equivalent styling
Any standard React UI component library
TypeScript (if used)
Vite or Create React App (whichever is configured)
```

---

## 11. FORBIDDEN DEPENDENCIES

```
FORBIDDEN: Any backend framework (FastAPI, Flask, Express, etc.)
FORBIDDEN: SQLAlchemy or any ORM
FORBIDDEN: LangChain, LangSmith, or any LLM SDK
FORBIDDEN: GCP SDK or any cloud SDK
FORBIDDEN: WebSocket libraries (socket.io, ws, etc.)
FORBIDDEN: SSE libraries
FORBIDDEN: Redis client
FORBIDDEN: Any message queue client
FORBIDDEN: Terraform or infrastructure tools
FORBIDDEN: Any authentication library that issues or validates JWTs (you consume JWTs, you don't create them)
```

---

## 12. INTEGRATION POINTS

| Downstream Service | Integration Method | Contract |
|---|---|---|
| P2 Auth Service | REST API calls | UserSchema |
| P3 Scenario Service | REST API calls | MissionSchema |
| P4 Challenge Service | REST API calls | EnvironmentSchema, ChallengeSessionSchema |
| P5 Evaluation Service | REST API polling | EvaluationResultSchema |
| P6 Feedback Service | REST API calls | FeedbackReportSchema |
| P7 Progress/Audit | REST API calls | Raw progress/audit data |

**During development:** Use MSW to mock all integration points with contract-exact response shapes.

---

## 13. REQUIRED DELIVERABLES

- [ ] Authentication UI (register, login, logout, token refresh)
- [ ] Mission briefing page (mission details display)
- [ ] Challenge page (timer, GCP console link, submission form)
- [ ] Evaluation display (live polling, criteria results, score)
- [ ] Feedback page (summary, strengths, mistakes, improvements, recommendation)
- [ ] Progress dashboard (stats, history)
- [ ] ADMIN audit view (visible only to ADMIN role users, calls `GET /audit/events`)
- [ ] MSW mocks for all 18 routes

---

## 14. AGENT INSTRUCTIONS

When operating as P1's AI assistant:

1. **ALWAYS** produce a PLAN (as defined in `CLAUDE.md` Section 9) before generating code.
2. **ONLY** generate code in `frontend/src/`.
3. **NEVER** generate backend code, migration files, or contract files.
4. **ALWAYS** use contract-exact field names in API calls and mock data.
5. **ALWAYS** use polling (`setInterval` every 3000ms) for live evaluation updates — never WebSockets, never SSE.
6. **NEVER** add routes to the API — only call the 18 frozen routes.
7. **NEVER** store access tokens in localStorage — use React state/context or sessionStorage at most.
8. **ALWAYS** handle all defined `ChallengeSessionSchema.status` values in UI state machines.
9. **NEVER** invent API response fields — only use fields defined in the contracts.
10. **STOP** if any task requires modifying files outside `frontend/src/`.

---

## 15. EXAMPLE TASKS (ALLOWED)

```
✅ "Build the challenge timer component using expires_at from ChallengeSessionSchema"
✅ "Implement the evaluation polling loop calling GET /evaluate/{session_id} every 3 seconds"
✅ "Create the feedback display page consuming FeedbackReportSchema"
✅ "Set up MSW mock for POST /challenges/start returning a valid ChallengeSessionSchema"
✅ "Build the submission text area and wire it to POST /evaluate/{session_id}/run"
✅ "Create role-based routing that hides /audit from LEARNER users"
✅ "Build the progress dashboard calling GET /progress/{user_id}/stats"
✅ "Display criteria_results from EvaluationResultSchema in a checklist UI"
```

---

## 16. EXAMPLE FORBIDDEN TASKS

```
❌ "Add a WebSocket connection for real-time evaluation updates" — FORBIDDEN: polling is the strategy
❌ "Create a new API endpoint to get live VM status" — FORBIDDEN: you don't own API routes
❌ "Add a userId field to EvaluationResultSchema" — FORBIDDEN: contracts are frozen
❌ "Add a /dashboard route to the backend" — FORBIDDEN: routes are frozen, and you don't own backend
❌ "Modify backend/app/evaluation/router.py to return more data" — FORBIDDEN: not your domain
❌ "Create a new table to cache frontend state" — FORBIDDEN: database is frozen
❌ "Directly call GCP APIs from the frontend" — FORBIDDEN: no GCP SDK in frontend
❌ "Add an admin endpoint to reset user scores" — FORBIDDEN: routes are frozen
❌ "Store the JWT in localStorage for persistence" — follow secure storage practices
```
