# Expected API Flows — Network Trace Reference

Use this to verify your implementation by checking the Network tab in DevTools.

---

## Flow 1: Complete Mission Flow (End-to-End)

### Step 1: User Lands on Dashboard
```
→ GET /auth/me (auto on app load)
  ← 200 OK { user: {...} }

→ GET /progress/me (dashboard page mounts)
  ← 200 OK { skill_matrix, stats, recent_missions, achievements }
```

**Dashboard shows:**
- Real stats (totalChallengesCompleted, successRate)
- Real skill gap analysis
- Real recent activities
- Real score momentum
- Real track health

### Step 2: User Goes to Challenges
```
(No API calls, just navigation)
```

**Challenges page shows:**
- Static track definitions
- Static difficulty levels

### Step 3: User Generates Mission
```
→ POST /scenarios/generate { track: "COMPUTE", difficulty: "BEGINNER" }
  ← 200 OK { mission_id, title, objectives, success_criteria, business_context, ... }
```

**Mission is displayed:**
- Real title, objectives, context
- Real success criteria (weight 100 total)
- Time limit

### Step 4: User Starts Challenge
```
→ POST /challenges/start { mission_id }
  ← 200 OK { session_id, environment, gcp_console_url, expires_at }
```

**User sees:**
- GCP console URL
- Environment details (zone, vm_name)
- Countdown timer (expires_at)

### Step 5: User Navigates to Mission Page
```
→ GET /scenarios/{mission_id} (if mission details weren't loaded yet)
  ← 200 OK { mission_id, title, objectives, success_criteria, ... }

→ GET /challenges/{session_id}/status (polls every 3 seconds)
  ← 200 OK { session: {..., status: READY}, environment: {...} }
  
→ GET /challenges/{session_id}/status (polling continues)
  ← 200 OK { session: {..., status: READY}, environment: {...} }
  
(User works in GCP console...)

→ GET /challenges/{session_id}/status (polling continues)
  ← 200 OK { session: {..., status: READY}, environment: {...} }
```

**Mission page shows:**
- Real mission details (business context, objectives, criteria)
- Real environment status
- "Checking..." animation during polling
- "Ready!" when environment.status == READY

### Step 6: User Verifies Mission (Runs Evaluation)
```
→ POST /evaluate/{session_id}/run
  ← 200 OK {
      evaluation: { status, score, criteria },
      analytics: { completion_time, efficiency },
      coach: { strengths, weaknesses, recommendation, ... },
      recommendation: { difficulty, track, reason, ... }
    }
```

**Mission page shows:**
- Evaluation result (PASSED/PARTIAL/FAILED)
- Score (0-100)
- Criteria breakdown (passed vs failed)
- Coach insights (strengths, biggest_mistake)
- Next recommended mission (difficulty, track, reason)

### Step 7: User Navigates to Results
```
(No new API calls — uses cached evaluation from Step 6)
```

**Results page shows:**
- Cached evaluation (same data as Step 6)
- Score, status, time taken
- Criteria breakdown
- Coach feedback
- Recommendation for next mission

### Step 8: User Goes to Dashboard
```
→ GET /progress/me (dashboard re-mounts or polls)
  ← 200 OK { 
      skill_matrix: { ... with updated scores ... },
      stats: { total_missions: N+1, average_score: ..., ... },
      recent_missions: [ { new_mission, ... }, ... ]
    }
```

**Dashboard shows:**
- Updated stats (missions_completed now N+1)
- Updated skill ratings (based on mission performance)
- New mission in recent activities
- Updated success rate trend
- Updated track health rings

### Step 9: User Goes to Progress
```
→ GET /progress/me (if not cached)
  ← 200 OK { skill_matrix: {...}, stats: {...}, ... }
```

**Progress page shows:**
- Real skill growth chart (from skill_matrix)
- Real success rate trend (from stats)
- Real completion by track
- Real skill proficiency ratings

### Step 10: User Goes to History
```
→ GET /progress/me (if not cached)
  ← 200 OK { recent_missions: [...] }
```

**History page shows:**
- Real mission list from recent_missions
- Real completion dates, scores, statuses
- No "No missions" message (because one exists)

### Step 11: User Goes to Recommendations
```
(No API calls — uses cached evaluation.recommendation from Step 6)
```

**Recommendations page shows:**
- Real recommendation (difficulty, track, reason)
- Can click "Start Mission" to begin next challenge

---

## Flow 2: Admin Session Management

### Step 1: Admin Opens Admin Dashboard
```
→ GET /challenges/admin/sessions
  ← 200 OK [ 
      { session_id, user_id, mission_id, status, started_at, expires_at },
      { ... },
      ...
    ]
```

**Admin page shows:**
- Real list of active sessions
- User IDs, mission IDs, statuses
- Started/expires timestamps

### Step 2: Admin Clicks "Clear Session"
```
→ POST /challenges/admin/sessions/{session_id}/clear
  ← 200 OK { success: true }

→ GET /challenges/admin/sessions (refresh list)
  ← 200 OK [ (updated list without cleared session) ]
```

**Admin page shows:**
- Session removed from list
- Confirmation feedback

### Step 3: Admin Views Other Panels
```
(No API calls)
```

**Other admin panels show:**
- "Coming Soon" placeholder
- No fake data, no console errors

---

## Flow 3: New User First Time

### Step 1: User Completes First Mission
```
(Follows Flow 1, Steps 1-6)
```

### Step 2: User Views Dashboard
```
→ GET /progress/me
  ← 200 OK {
      achievements: [
        { id: "first-mission", name: "First Mission", ... },
        ...
      ],
      stats: {
        total_missions: 1,
        completed_missions: 1,
        ...
      }
    }
```

**Dashboard shows:**
- "First Mission" achievement badge
- Stats show 1 mission completed
- No "zero" or "-" values anywhere

---

## Flow 4: Error Scenarios (Should NOT Happen)

### Scenario 1: GET /progress/me Fails
```
→ GET /progress/me
  ← 500 Error { error: "..." }
```

**Expected Frontend Behavior:**
- Show error message "Failed to load progress"
- Display safe default (0 missions, 0 score, etc.)
- Do NOT show partial/stale data
- Do NOT crash

### Scenario 2: POST /evaluate/{session_id}/run Fails
```
→ POST /evaluate/{session_id}/run
  ← 500 Error { error: "..." }
```

**Expected Frontend Behavior:**
- Show error message "Evaluation failed"
- Provide "Retry" button
- Do NOT navigate to results
- Do NOT show partial evaluation

### Scenario 3: Missing JWT Token
```
→ POST /scenarios/generate
  ← 401 Unauthorized { error: "Missing authorization" }
```

**Expected Frontend Behavior:**
- Redirect to login
- Clear JWT from storage
- Show "Session expired, please login again"

---

## Expected Network Profile

### Dashboard Page Load
```
GET /auth/me              ~50ms
GET /progress/me          ~150ms
Total: ~200ms
```

### Mission Page Load
```
GET /scenarios/{id}       ~50ms
GET /challenges/{id}/status (start of polling) ~50ms
```

### After "Verify Mission"
```
POST /evaluate/{id}/run   ~1000ms (calls LLM for feedback)
Total: ~1 second
```

### Generate Mission
```
POST /scenarios/generate  ~3000-5000ms (calls LLM for generation)
Total: ~3-5 seconds
```

---

## Console Output Expected

### Successful Flows
```
✓ No console errors
✓ No "undefined" warnings
✓ No "mock" messages
✓ GET /progress/me called ✓
✓ POST /scenarios/generate called ✓
✓ POST /challenges/start called ✓
✓ POST /evaluate/*/run called ✓
```

### After Implementation Complete
```
Dashboard Network Tab:
  GET /progress/me ← 200 OK
  (No mockDashboardStats calls)
  
Progress Network Tab:
  GET /progress/me ← 200 OK
  (No mockProgressChartData loads)
  
History Network Tab:
  GET /progress/me ← 200 OK
  (No mockMissionHistory loads)
  
Results Network Tab:
  (No GET /evaluate calls if cached correctly)
  (Uses data from POST /evaluate from mission page)
  
Recommendations Network Tab:
  (No GET /recommendations calls)
  (Uses cached evaluation.recommendation)
  
Admin Network Tab:
  GET /challenges/admin/sessions ← 200 OK
  (No LEARNERS, LOGS, ISSUES arrays loaded)
```

---

## Debugging Checklist

If something isn't working, check:

### Dashboard Not Showing Real Data
```
□ GET /progress/me is called? (Network tab)
□ GET /progress/me returns 200? (Status)
□ Response contains skill_matrix? (Response body)
□ No 401 error (JWT valid)?
□ Component is reading response correctly?
```

### Progress Charts Empty
```
□ GET /progress/me is called?
□ skill_matrix is being transformed to Recharts format?
□ Check browser console for transform errors
```

### History Shows "No missions"
```
□ GET /progress/me called?
□ recent_missions array has items?
□ recent_missions is being rendered?
```

### Results Page Blank
```
□ evaluation state is set?
□ Props are being passed from mission page?
□ Check React DevTools for state
```

### Recommendations Shows "Complete a mission first"
```
□ Correct behavior! (Should only show after evaluation)
```

### Admin Sessions Panel Empty
```
□ GET /challenges/admin/sessions called?
□ Backend has active sessions?
□ Response is empty array [] (also correct)
```

---

## Success Indicators

You'll know integration is complete when:

✅ Every page shows real data (no mock values)  
✅ Network tab shows correct API calls  
✅ Console has zero warnings about "mock"  
✅ Dashboard updates after mission completion  
✅ No broken component states  
✅ Full mission flow works without errors  
✅ All pages load within 1 second  
✅ Evaluation caching works (no duplicate /evaluate calls)  
✅ Admin sessions show real data  
✅ No fallback to mock data anywhere  

