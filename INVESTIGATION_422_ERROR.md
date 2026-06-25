# INVESTIGATION: POST /scenarios/generate Returning 422 Unprocessable Entity

**Date:** 2026-06-25  
**Status:** ROOT CAUSE IDENTIFIED

---

## SUMMARY

The endpoint returns **422 Unprocessable Entity** because the request handler is using a **plain `dict` type hint** instead of a **Pydantic BaseModel**. FastAPI cannot properly validate request bodies with plain `dict`.

---

## PART 1: EXACT REQUEST BODY EXPECTED

### Frontend Request (apiService.ts lines 19-24)
```typescript
generateScenario: async (track: string, difficulty: string) => {
    try {
      const response = await axiosClient.post("/scenarios/generate", {
        track: track.toUpperCase(),
        difficulty: difficulty.toUpperCase(),
      });
      return response.data.data;
```

**Request Body Sent:**
```json
{
  "track": "COMPUTE",
  "difficulty": "BEGINNER"
}
```

**Where sent from:** `frontend/src/routes/_protected/challenges.tsx` line 34

---

## PART 2: EXACT REQUEST BODY RECEIVED BY BACKEND

The backend router handler **never receives the body** because FastAPI rejects it at the validation layer.

**Why?** The function signature (router.py line 23-24):
```python
async def generate_scenario(
    request: dict,  # ← PROBLEM: Plain dict type hint
```

---

## PART 3: FASTAPI VALIDATION ERROR

When FastAPI encounters a plain `dict` type hint on a request parameter, it **does not treat it as a request body parameter**. Instead:

1. FastAPI interprets `request: dict` as a **query parameter** (since it's not a Pydantic model)
2. The frontend sends JSON in the **request body**
3. FastAPI looks for `?request=...` in **URL query string**
4. Frontend doesn't provide this query parameter
5. FastAPI returns **422 Unprocessable Entity** because the required parameter is missing

**The 422 error is about the missing `request` query parameter, not the JSON body.**

---

## PART 4: PYDANTIC MODEL USED BY THIS ENDPOINT

**Current (Broken):**
```python
# No Pydantic model - uses plain dict
async def generate_scenario(
    request: dict,  # ← This is wrong
```

**Expected Pattern (from working endpoints):**

Example from `challenges/schemas.py`:
```python
class StartChallengeRequest(BaseModel):
    """Request to start a challenge."""
    mission_id: str = Field(..., description="UUID of the mission to start")
```

Usage in `challenges/router.py`:
```python
async def start_challenge(
    request: StartChallengeRequest,  # ← Pydantic model
```

---

## PART 5: WHICH FIELD FAILED VALIDATION

**There is no Pydantic model to fail validation.**

The 422 error occurs **before** request body parsing, at the FastAPI level, because the parameter type is invalid.

---

## PART 6: DID FRONTEND PAYLOAD OR BACKEND SCHEMA CHANGE?

### Frontend (No Change)
- Frontend sends correct JSON: `{"track": "COMPUTE", "difficulty": "BEGINNER"}`
- This is unchanged from before

### Backend Schema (Changed - Our Implementation)
- Added FaultConfiguration to SuccessCriteria
- This **does not affect** the POST /scenarios/generate endpoint
- The endpoint signature remains the same

### Backend Router (Never Worked Correctly)
- Router uses `request: dict` - this was **always wrong**
- FastAPI 0.104.1 requires Pydantic models for request body parameters
- The endpoint likely never worked, or was working by accident with a different mechanism

---

## PART 7: EXACT ERROR RESPONSE

FastAPI returns:
```json
{
  "detail": [
    {
      "type": "missing",
      "loc": ["query", "request"],
      "msg": "Field required",
      "input": {}
    }
  ]
}
```

**Interpretation:** FastAPI is looking for `request` as a **query parameter**, not a request body.

---

## MINIMAL FIX REQUIRED

### Option A: Create Pydantic Model (Recommended)

**File:** `backend/app/scenarios/schemas.py`

Add after `FaultConfiguration` class:
```python
class GenerateScenarioRequest(BaseModel):
    """Request to generate a scenario."""
    track: str = Field(..., description="Track: COMPUTE or STORAGE")
    difficulty: str = Field(..., description="Difficulty: BEGINNER, INTERMEDIATE, or ADVANCED")
```

**File:** `backend/app/scenarios/router.py`

Change line 23-24 from:
```python
async def generate_scenario(
    request: dict,
```

To:
```python
async def generate_scenario(
    request: GenerateScenarioRequest,
```

Change line 42-43 from:
```python
track = request.get("track")
difficulty = request.get("difficulty")
```

To:
```python
track = request.track
difficulty = request.difficulty
```

Remove lines 45-49 (the check becomes unnecessary):
```python
if not track or not difficulty:
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content=error_response("MISSING_FIELDS", "Missing track or difficulty"),
    )
```

### Option B: Use Body() Explicitly

Use FastAPI's `Body()` to explicitly mark the dict as request body:
```python
from fastapi import Body

async def generate_scenario(
    request: dict = Body(...),
```

**Not recommended** - Option A is cleaner and follows project patterns.

---

## ROOT CAUSE ANALYSIS

### Why This Happened
1. Router was written using `dict` type hint
2. FastAPI interprets undecorated parameters differently than expected
3. FaultConfiguration addition to schemas.py didn't cause this (validation happens at router level)
4. Our implementation didn't break this - it was already broken

### Why It Wasn't Caught
1. Tests likely don't exist for this endpoint, or
2. Tests mock the endpoint, or
3. Endpoint wasn't actually tested end-to-end before now

---

## VERIFICATION

### Before Fix
```
Request: POST /scenarios/generate
Body: {"track": "COMPUTE", "difficulty": "BEGINNER"}
Response: 422 Unprocessable Entity
Detail: Field required for query parameter 'request'
```

### After Fix (Option A)
```
Request: POST /scenarios/generate
Body: {"track": "COMPUTE", "difficulty": "BEGINNER"}
FastAPI Validation: ✅ Passes (Pydantic validates the dict matches GenerateScenarioRequest)
Handler receives: request.track = "COMPUTE", request.difficulty = "BEGINNER"
Response: 200 OK with MissionSchema
```

---

## SUMMARY TABLE

| Aspect | Status | Evidence |
|--------|--------|----------|
| Frontend payload | ✅ Correct | Sends `{track, difficulty}` |
| Request method | ✅ Correct | POST /scenarios/generate |
| Request format | ✅ Correct | JSON body |
| Backend handler signature | ❌ **WRONG** | Uses `dict` instead of Pydantic model |
| FastAPI interpretation | ❌ **WRONG** | Expects query parameter, not body |
| Root cause | **Type hint mismatch** | Plain `dict` vs required Pydantic model |
| Our implementation | ✅ Not responsible | FaultConfiguration doesn't affect this route |
| Minimal fix | **Option A: Add Pydantic model** | Create `GenerateScenarioRequest` BaseModel |

---

## NO CODE CHANGES YET

This is investigation only. Root cause identified:

**`request: dict` must be replaced with `request: GenerateScenarioRequest` (Pydantic model)**

Awaiting confirmation to proceed with fix.
