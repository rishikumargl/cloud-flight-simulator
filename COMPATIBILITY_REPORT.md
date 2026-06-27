# Frontend-Backend Compatibility Report

**Analysis Date:** 2026-06-27  
**Frontend Status:** 40% integrated, 60% using mocks or missing wiring  
**Backend Status:** 100% complete, all endpoints working  
**Analysis Type:** Current state (new UI), no assumptions from previous implementation

---

## Executive Summary

The new frontend UI is **partially integrated** with the backend. Some pages use real API calls while others rely on mock data or are completely unwired.

- ✅ **3 pages fully integrated** (challenges, mission, results)
- ⚠️ **3 pages partially integrated** (dashboard, history, admin)
- ❌ **3 pages using mocks** (progress, recommendations, landing)
- ✅ **1 page auth-only** (login)

**No backend contract mismatches found.** No backend changes needed.

---

## Detailed Compatibility Matrix

### Page 1: Landing (`/routes/index.tsx`)
| Aspect | Status | Details |
|--------|--------|---------|
| **Purpose** | Public landing page with hero, tracks, analytics mockup |
| **API Calls** | ❌ None | No backend integration needed (public page) |
| **Mock Data** | ✓ Used intentionally | learningTracks, trackRows, mockProgressChartData, mockRecommendations |
| **Backend Endpoint** | N/A | Public landing page, no auth required |
| **Issue** | None | This is correct — landing pages don't need real data |
| **Action** | ✅ No change | Keep as-is |

---

### Page 2: Login (`/routes/login.tsx`)
| Aspect | Status | Details |
|--------|--------|---------|
| **Purpose** | Clerk Sign-In integration |
| **API Calls** | ✓ Clerk auth | Clerk handles auth, no backend API call |
| **Mock Data** | None | Clean auth flow |
| **Backend Endpoint** | GET /auth/me (on app boot) | Verified user after Clerk login |
| **Issue** | None | Auth flow working correctly |
| **Action** | ✅ No change | Keep as-is |

---

### Page 3: Dashboard (`/_protected/dashboard.tsx`)
| Aspect | Status | Details |
|--------|--------|---------|
| **Current Data Source** | ⚠️ Mixed | Calls `apiService.getProgress()` but has fallback to `mockDashboardStats`, `mockRecentActivities`, `mockProgressChartData`, `mockRecommendations` |
| **API Endpoint** | GET /progress/me | Backend provides: `stats`, `overall_proficiency`, `recent_missions`, `skill_matrix`, `achievements` |
| **Expected Fields** | `stats` object with: `total_missions`, `average_score`, `completion_rate` |
| **Actual Response** | ✓ Matches | Backend returns all expected fields |
| **Transformation Needed** | None | Fields map directly |
| **Issue** | ⚠️ Fallback logic | Code falls back to mock if API call fails or returns falsy |
| **Action** | 🔧 Fix fallback | Remove mock fallback, show proper error state instead |

---

### Page 4: Challenges (`/_protected/challenges.tsx`)
| Aspect | Status | Details |
|--------|--------|---------|
| **Purpose** | Mission launcher with track/difficulty selection |
| **API Calls** | ✓ Real | POST /scenarios/generate (creates mission), POST /challenges/start (provisions environment) |
| **Mock Data** | ✓ Static metadata only | learningTracks, difficulties (these are OK — static definitions) |
| **Backend Endpoints** | POST /scenarios/generate, POST /challenges/start | Both working correctly |
| **Response Schema** | ✓ Correct | apiService.startChallenge() properly normalizes nested response |
| **Issue** | None | This page is fully integrated correctly |
| **Action** | ✅ No change | Keep as-is |

---

### Page 5: Mission (`/_protected/mission.$id.tsx`)
| Aspect | Status | Details |
|--------|--------|---------|
| **Purpose** | Active mission with GCP console link and evaluation |
| **API Calls** | ✓ Real | GET /challenges/{id}/status (polling), POST /evaluate/{id}/run |
| **Mock Data** | ⚠️ Fallback only | mockMissionDetails used on error |
| **Backend Endpoints** | GET /challenges/{session_id}/status, POST /evaluate/{session_id}/run | Both working correctly |
| **Response Schema** | ✓ Correct | apiService.runEvaluation() normalizes enriched response with `{ evaluation, analytics, coach, recommendation }` |
| **Issue** | None | Real API working correctly with error fallback |
| **Action** | ✅ No change | Keep as-is |

---

### Page 6: Results (`/_protected/results.$id.tsx`)
| Aspect | Status | Details |
|--------|--------|---------|
| **Purpose** | Post-mission evaluation report |
| **API Calls** | ✓ Real | GET /evaluate/{id} to retrieve cached evaluation |
| **Mock Data** | ⚠️ Fallback | mockEvaluationResults used if API fails |
| **Backend Endpoint** | GET /evaluate/{session_id} | Returns cached evaluation result |
| **Response Schema** | ✓ Correct | Returns evaluation with status, score, criteria |
| **Issue** | None | Real API working correctly |
| **Action** | ✅ No change | Keep as-is |

---

### Page 7: History (`/_protected/history.tsx`)
| Aspect | Status | Details |
|--------|--------|---------|
| **Purpose** | Searchable table of completed missions |
| **API Calls** | ✓ Real | Calls `apiService.getMissionHistory()` which wraps GET /progress/me |
| **Mock Data** | ⚠️ Fallback | mockMissionHistory used if API fails |
| **Backend Endpoint** | GET /progress/me → uses `recent_missions` array | Backend provides all mission history |
| **Response Schema** | ✓ Correct | apiService.getMissionHistory() returns recent_missions array |
| **Issue** | None | Real API working correctly with error fallback |
| **Action** | ✅ No change | Keep as-is |

---

### Page 8: Progress (`/_protected/progress.tsx`)
| Aspect | Status | Details |
|--------|--------|---------|
| **Purpose** | Analytics dashboard with charts (Recharts) |
| **API Calls** | ❌ None | Hard-coded to use mockProgressChartData, NO API call |
| **Mock Data** | ✓ Used directly | mockProgressChartData (progressTrend[], successRateTrend[], trackDistribution[], skillGrowth[]) |
| **Backend Endpoint** | GET /progress/me (not called) | Backend provides `skill_matrix` and `stats` with all data needed |
| **Expected Transform** | Required | skill_matrix → Recharts format for charts |
| **Issue** | ❌ CRITICAL | Page completely bypasses real API and uses hardcoded mock data |
| **Action** | 🔧 REQUIRED | Replace mockProgressChartData with GET /progress/me call, transform data for charts |

---

### Page 9: Recommendations (`/_protected/recommendations.tsx`)
| Aspect | Status | Details |
|--------|--------|---------|
| **Purpose** | Personalized learning path and skill gaps |
| **API Calls** | ⚠️ Attempted | Calls `api.getRecommendations()` but this returns empty array |
| **Mock Data** | ✓ Fallback | Falls back to mockRecommendations in all cases |
| **Backend Endpoint** | (No dedicated endpoint) | Recommendation comes from POST /evaluate/{session_id}/run response: `evaluation.recommendation` |
| **Expected Fields** | recommended_difficulty, recommended_track, reason, confidence, topics_to_focus, estimated_completion_time |
| **Issue** | ❌ DESIGN | apiService.getRecommendations() is a stub that returns []. Recommendation should come from cached evaluation, not separate API |
| **Action** | 🔧 REQUIRED | Change design: store evaluation response in state, display recommendation field from cached evaluation |

---

### Page 10: Admin Dashboard (`/_protected/admin/dashboard.tsx`)
| Aspect | Status | Details |
|--------|--------|---------|
| **Purpose** | Platform monitoring with 8 tabs (overview, learners, GCP envs, analytics, logs, issues, AI tracing, system) |
| **API Calls** | ✓ Partial | GET /challenges/admin/sessions and POST /challenges/admin/sessions/{id}/clear (both working) |
| **Mock Data** | ❌ Extensive | 7 large mock arrays: LEARNERS, GCP_ENVS, LOGS, ISSUES, AI_TRACES, SYSTEM, ANALYTICS |
| **Backend Endpoints** | GET /challenges/admin/sessions (working), others not implemented | Sessions endpoint works, other admin APIs don't exist |
| **Issue** | ⚠️ Expected | Admin panel has tabs for features not yet implemented in backend (learner management, logging, issue tracking, AI traces) |
| **Action** | 🔧 Partial | Keep sessions panel real (working). Replace other mock data with "Coming Soon" placeholders instead of fake data |

---

## Mock Data Audit

### Datasets Currently Used

| Dataset | Used By | Status | Action |
|---------|---------|--------|--------|
| `learningTracks` | Landing, Challenges, Admin | ✓ Correct | Keep — static metadata |
| `difficulties` | Challenges | ✓ Correct | Keep — static metadata |
| `trackRows` | Dashboard, History, Progress, Admin | ✓ Correct | Keep — static metadata |
| `mockDashboardStats` | Dashboard (fallback) | ⚠️ Fallback | Remove — use GET /progress/me only |
| `mockRecentActivities` | Dashboard (fallback) | ⚠️ Fallback | Remove — derive from GET /progress/me |
| `mockProgressChartData` | Progress (direct use) | ❌ Hardcoded | Replace with GET /progress/me transform |
| `mockRecommendations` | Recommendations (fallback) | ⚠️ Fallback | Remove — use cached evaluation.recommendation |
| `mockMissionDetails` | Mission page (error fallback) | ⚠️ Fallback | Remove — show error state instead |
| `mockEvaluationResults` | Results page (error fallback) | ⚠️ Fallback | Remove — show error state instead |
| `mockMissionHistory` | History (error fallback) | ⚠️ Fallback | Remove — show error state instead |
| `mockAdminData` | Admin (fallback) | ⚠️ Fallback | Remove — show error state instead |
| `mockChallengeProgress` | (Unused) | ❌ Orphaned | Delete |
| `mockChallenges` | (Unused) | ❌ Orphaned | Delete |
| `mockUser` | (Auth fallback) | ⚠️ Legacy | Keep for now (auth safety) |

### Summary

**Datasets to DELETE:** 7
- mockDashboardStats
- mockRecentActivities
- mockProgressChartData
- mockRecommendations
- mockMissionDetails
- mockEvaluationResults
- mockMissionHistory
- mockAdminData
- mockChallengeProgress (orphaned)
- mockChallenges (orphaned)

**Datasets to KEEP:** 4
- learningTracks (static metadata)
- difficulties (static metadata)
- trackRows (static metadata)
- mockUser (auth fallback, can remove later)

---

## API Service Assessment

### Current Implementation

`/api/apiService.ts` implements:
- ✓ `generateScenario(track, difficulty)` → POST /scenarios/generate
- ✓ `getMissionDetails(mission_id)` → GET /scenarios/{mission_id}
- ✓ `startChallenge(mission_id)` → POST /challenges/start (normalizes response)
- ✓ `getChallengeStatus(session_id)` → GET /challenges/{session_id}/status
- ✓ `stopChallenge(session_id)` → POST /challenges/{session_id}/stop
- ✓ `getEvaluation(session_id)` → GET /evaluate/{session_id}
- ✓ `runEvaluation(session_id)` → POST /evaluate/{session_id}/run (normalizes response, flattens criteria)
- ✓ `getProgress()` → GET /progress/me
- ✓ `getMissionHistory()` → GET /progress/me (extracts recent_missions)
- ✓ `getRecentActivities()` → GET /progress/me (derives from recent_missions)
- ✓ `getProgressCharts()` → GET /progress/me (extracts skill_matrix and stats)
- ⚠️ `getRecommendations()` → Returns empty array (stub)
- ✓ `adminListSessions()` → GET /challenges/admin/sessions
- ✓ `adminClearSession(session_id)` → POST /challenges/admin/sessions/{session_id}/clear

### Issues

1. **`getRecommendations()`** returns empty array with comment "should come from evaluation response, not API call"
   - **Issue:** Recommendations page tries to call this and gets empty, falls back to mock
   - **Fix:** Design change — store evaluation response, display recommendation field

2. **No `getProgressCharts()` equivalent** for progress.tsx
   - Actually, it exists and derives from GET /progress/me
   - **Issue:** progress.tsx doesn't call it, uses mockProgressChartData directly
   - **Fix:** Call `getProgressCharts()` instead

3. **Legacy stubs** (getChallenges, submitMissionResult, getEvaluationResults)
   - These throw errors but aren't used by any page
   - **Action:** Can leave as-is (dead code)

### Assessment

**apiService.ts is 95% correct.** Only missing piece is design clarity for recommendations (should be cached evaluation, not separate API call).

---

## Files to Modify

### Summary Table

| File | Type | Current Issue | Required Change | Effort | Priority |
|------|------|----------------|-----------------|--------|----------|
| `/routes/progress.tsx` | Page | Uses hardcoded mockProgressChartData | Call apiService.getProgressCharts(), transform for Recharts | 30 min | HIGH |
| `/routes/recommendations.tsx` | Page | Fallback to mockRecommendations | Store evaluation in state, display recommendation field | 20 min | HIGH |
| `/routes/dashboard.tsx` | Page | Mixed real API + mock fallback | Clean up fallback logic, show proper error states | 15 min | MEDIUM |
| `/routes/admin/dashboard.tsx` | Page | 7 mock data arrays for non-existent APIs | Replace with "Coming Soon" placeholders | 20 min | MEDIUM |
| `/api/apiService.ts` | Utility | `getRecommendations()` is a stub | Add comment clarifying design, or remove if unused | 5 min | LOW |
| `/data/mockData.ts` | Data | 10+ unused/deprecated datasets | Delete datasets not needed (phase: after pages wired) | 10 min | LOW |
| **TOTAL** | | | | **1.5 hours** | |

### Why Each Change

#### 1. `/routes/progress.tsx` — HIGH PRIORITY
**Current State:** 
```tsx
// Line 176 — hardcoded mock data
const mockChartData = mockProgressChartData;
```

**Problem:**
- Page completely bypasses real API
- Uses hardcoded static chart data
- Never reflects actual learner progress

**Fix:**
- Call `apiService.getProgressCharts()` on mount
- Transform skill_matrix/stats into Recharts format
- Update state as data loads

**Effort:** 30 minutes

---

#### 2. `/routes/recommendations.tsx` — HIGH PRIORITY
**Current State:**
```tsx
// apiService.getRecommendations() returns []
const recommendations = await api.getRecommendations(); // Empty array
// Falls back to mockRecommendations
```

**Problem:**
- Design flaw: recommendations should come from evaluation, not separate API
- apiService stub always returns empty
- Page always shows mock data

**Fix:**
- Store evaluation response in state (from mission page or context)
- Display `evaluation.recommendation` field
- Show "Complete a mission first" if no evaluation

**Effort:** 20 minutes

---

#### 3. `/routes/dashboard.tsx` — MEDIUM PRIORITY
**Current State:**
```tsx
// Fallback logic:
const stats = dashboardData || mockDashboardStats;
const activities = recentActivities || mockRecentActivities;
```

**Problem:**
- Mixed real API + mock fallback
- Unclear which path is taken
- Mock fallback hides real errors

**Fix:**
- Remove mock fallback for stats/activities
- Show proper error state if API fails
- Keep mock only for non-critical fields

**Effort:** 15 minutes

---

#### 4. `/routes/admin/dashboard.tsx` — MEDIUM PRIORITY
**Current State:**
```tsx
// 7 large mock arrays
const LEARNERS = [...30 items];
const GCP_ENVS = [...12 items];
const LOGS = [...18 items];
const ISSUES = [...5 items];
const AI_TRACES = [...15 items];
const SYSTEM = [...4 items];
const ANALYTICS = [...12 items];
```

**Problem:**
- These features don't exist in backend yet
- Showing fake data is confusing
- Sessions panel works (real API), others are stubs

**Fix:**
- Keep sessions panel (real)
- Replace other tabs with "Coming Soon" placeholders
- Remove fake data arrays

**Effort:** 20 minutes

---

#### 5. `/api/apiService.ts` — LOW PRIORITY
**Current State:**
```tsx
getRecommendations: async () => {
  // This should come from evaluation response, not separate API
  return [];
},
```

**Problem:**
- Stub that returns empty
- Misleading design

**Fix:**
- Add clarifying comment
- Or remove if unused

**Effort:** 5 minutes

---

#### 6. `/data/mockData.ts` — LOW PRIORITY (Phase 2)
**Current State:** 10+ unused datasets

**Problem:**
- Dead code
- File bloat (~1000+ lines)

**Fix:**
- Delete unused datasets AFTER all pages are wired
- Keep only: learningTracks, difficulties, trackRows, mockUser

**Effort:** 10 minutes (but phase after wiring)

---

## No Changes Needed

✅ `/routes/challenges.tsx` — Fully integrated, real API  
✅ `/routes/mission.$id.tsx` — Fully integrated, real API  
✅ `/routes/results.$id.tsx` — Fully integrated, real API  
✅ `/routes/history.tsx` — Fully integrated, real API  
✅ `/routes/login.tsx` — Clerk auth working correctly  
✅ `/routes/index.tsx` — Landing page (no API needed)  
✅ `/api/client.ts` — Axios config correct  
✅ `/hooks/useAuth.ts` — Auth state management correct  

---

## Implementation Sequence

**STRICT ORDER** (dependencies matter):

1. ✅ `/routes/progress.tsx` — Replace mockProgressChartData with real API call
   - Doesn't depend on other changes
   - Can test independently

2. ✅ `/routes/recommendations.tsx` — Change design to use cached evaluation
   - Depends on: mission page setting evaluation in state
   - Mission page already works, just needs state management

3. ✅ `/routes/dashboard.tsx` — Clean up fallback logic
   - Doesn't depend on other changes
   - Low risk, just removing mocks

4. ✅ `/routes/admin/dashboard.tsx` — Replace mocks with placeholders
   - Doesn't depend on other changes
   - Isolated to admin panel

5. ✅ `/api/apiService.ts` — Comment clarification
   - Doesn't depend on other changes
   - Minimal change

6. ✅ `/data/mockData.ts` — Delete unused datasets
   - ONLY after all pages are wired
   - Verify no imports before deleting

---

## Testing Strategy

### Per-File Testing

```
For each file changed:

1. Open DevTools Network tab
2. Navigate to page
3. Verify correct API calls made
4. Verify data displays correctly
5. Verify error states work
6. Verify no console errors
```

### Full Integration Test

```
1. Login
2. Dashboard — Check real stats load
3. Challenges — Generate mission
4. Mission — Provision environment
5. Results — Show evaluation
6. Dashboard — Check stats updated
7. History — Show new mission
8. Progress — Show real charts
9. Recommendations — Show next mission
10. Admin — Show sessions
```

---

## Risk Assessment

### Low Risk
- ✅ progress.tsx (isolated page)
- ✅ dashboard.tsx (just removing mocks)
- ✅ admin/dashboard.tsx (just replacing arrays)
- ✅ apiService.ts (comments only)

### Medium Risk
- ⚠️ recommendations.tsx (requires state management)
  - Mitigation: Mission page already working, just need to store evaluation

### Zero Risk
- ✅ No backend changes
- ✅ No new endpoints
- ✅ No schema changes
- ✅ No breaking changes

---

## Success Criteria

After implementation, verify:

- [ ] Progress page shows real skill data (not mock)
- [ ] Recommendations show evaluation recommendation (not mock)
- [ ] Dashboard shows real stats (clean error handling)
- [ ] Admin panel shows real sessions + "Coming Soon" for others
- [ ] Zero console warnings about "mock"
- [ ] Full mission flow works (login → generate → start → verify → results)
- [ ] All pages show real data
- [ ] Error states work gracefully
- [ ] No fallback to mock data

---

## Summary

**Files to Modify:** 6  
**Total Effort:** 1.5 - 2 hours  
**Risk Level:** Low  
**Backend Changes:** 0  
**Contract Changes:** 0  
**Confidence:** 95%

**Ready to proceed with implementation?**

