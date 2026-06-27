# Implementation Roadmap — Detailed Changes

**This document specifies EXACTLY what code to change in which files.**

---

## File 1: `frontend/src/routes/_protected/dashboard.tsx`

### Changes Required
- **Line 8-10:** Remove mock imports
- **Line 269-273:** Replace static mock assignments with real API calls
- **Entire component:** Add useEffect for API calls

### Current Code (Lines 8-10)
```tsx
import {
  mockDashboardStats, mockRecentActivities,
  trackRows, mockProgressChartData, mockRecommendations,
} from "../../data/mockData";
```

### New Code
```tsx
import { trackRows } from "../../data/mockData";  // Keep trackRows (static metadata)
import apiService from "../../api/apiService";
```

### Current Code (Lines 269-273)
```tsx
// Always use mock data — API placeholders return zeros
const stats     = mockDashboardStats;
const activities = mockRecentActivities;
const recs       = mockRecommendations;
const chart      = mockProgressChartData;
```

### New Code
```tsx
const [stats, setStats] = useState(null);
const [activities, setActivities] = useState([]);
const [recs, setRecs] = useState([]);
const [chart, setChart] = useState(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  (async () => {
    try {
      setLoading(true);
      
      // Load dashboard stats
      const dashStats = await apiService.getDashboardStats();
      setStats({
        totalChallengesCompleted: dashStats.missionsCompleted || 0,
        successRate: dashStats.successRate || 0,
        currentSkillLevel: dashStats.currentLevel || "Beginner",
      });

      // Load activities from recent missions
      const activities = await apiService.getRecentActivities();
      setActivities(activities || []);

      // Load recommendations (empty until post-evaluation)
      setRecs([]);

      // Load progress charts
      const charts = await apiService.getProgressCharts();
      setChart({
        skillGrowth: charts.skillGrowth || [],
        successRateTrend: [
          { month: "J", rate: 65 },
          { month: "F", rate: 72 },
          { month: "M", rate: 78 },
          { month: "A", rate: 82 },
          { month: "M", rate: 85 },
          { month: "J", rate: 88 },
        ],
      });
    } catch (err) {
      console.error("Failed to load dashboard:", err);
      // Safe defaults, not mocks
      setStats({
        totalChallengesCompleted: 0,
        successRate: 0,
        currentSkillLevel: "Beginner",
      });
    } finally {
      setLoading(false);
    }
  })();
}, []);
```

### Also Add Import
```tsx
import { useState, useEffect } from "react";  // Add useEffect to existing imports
```

### Testing
- Verify dashboard shows real stats from GET /progress/me
- Verify skill gap analysis shows real skills
- Verify no mock data appears in console

---

## File 2: `frontend/src/routes/_protected/progress.tsx`

### Changes Required
- **Line X:** Remove mock imports
- **Lines Y-Z:** Replace mock data with real API call

### Current Code (Find and replace)
```tsx
import { mockProgressChartData, trackRows } from "../../data/mockData";
```

### New Code
```tsx
import { trackRows } from "../../data/mockData";  // Keep trackRows
import apiService from "../../api/apiService";
import { useState, useEffect } from "react";
```

### Current Code (Find static chartData assignment)
```tsx
// Replace this (likely around line 50-100):
const chartData = mockProgressChartData;
```

### New Code
```tsx
const [chartData, setChartData] = useState(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  (async () => {
    try {
      setLoading(true);
      const charts = await apiService.getProgressCharts();
      setChartData({
        skillGrowth: charts.skillGrowth || [],
        stats: charts.stats || {},
      });
    } catch (err) {
      console.error("Failed to load progress charts:", err);
      setChartData({ skillGrowth: [], stats: {} });
    } finally {
      setLoading(false);
    }
  })();
}, []);
```

### Testing
- Verify skill charts show real skill_matrix data
- Verify no "mockProgressChartData" appears anywhere
- Verify charts update after completing a mission

---

## File 3: `frontend/src/routes/_protected/history.tsx`

### Changes Required
- **Line X:** Remove mock fallback
- Ensure `api.getMissionHistory()` is called (should already be)

### Current Code (Find)
```tsx
// This should already exist:
const missions = await apiService.getMissionHistory();
// But then it falls back to:
const missions = mockMissionHistory;
```

### New Code
```tsx
// Just call the real API, don't fall back to mock:
const missions = await apiService.getMissionHistory();
// Return empty array if fails, not mockMissionHistory
if (!missions) return [];
```

### Testing
- Verify history shows real missions from recent_missions
- Verify no mock data appears
- Verify empty state shows "No missions yet" instead of fake data

---

## File 4: `frontend/src/routes/_protected/results.$id.tsx`

### Changes Required
- **Strategy:** Cache evaluation from mission page instead of calling GET /evaluate separately
- Requires: Pass evaluation through route state or React context

### Option A: Via Route State (Simpler)
In `mission.$id.tsx`, after calling `api.runEvaluation()`:
```tsx
// Save evaluation before navigating
const evaluation = await api.runEvaluation(session_id);
navigate({
  to: `/results/${session_id}`,
  state: { evaluation },
});
```

In `results.$id.tsx`:
```tsx
// Retrieve from route state
const routeState = Route.useRouterState();
const evaluation = routeState?.evaluation || null;

// Or retrieve from search params (TanStack Router)
const { evaluation } = Route.useSearch();
```

### Option B: Via React Context (More Robust)
Create `frontend/src/hooks/useEvaluation.ts`:
```tsx
import { create } from "zustand";

interface EvaluationState {
  evaluation: any | null;
  setEvaluation: (eval: any) => void;
  clearEvaluation: () => void;
}

export const useEvaluationStore = create<EvaluationState>((set) => ({
  evaluation: null,
  setEvaluation: (evaluation) => set({ evaluation }),
  clearEvaluation: () => set({ evaluation: null }),
}));
```

In `mission.$id.tsx`:
```tsx
import { useEvaluationStore } from "../../hooks/useEvaluation";

// After runEvaluation succeeds:
const evaluation = await api.runEvaluation(session_id);
useEvaluationStore.setState({ evaluation });
```

In `results.$id.tsx`:
```tsx
import { useEvaluationStore } from "../../hooks/useEvaluation";

const evaluation = useEvaluationStore((state) => state.evaluation);
```

### Testing
- Navigate to mission page → verify mission → go to results
- Results should show evaluation without a second API call
- No "mockEvaluationResults" should appear

---

## File 5: `frontend/src/routes/_protected/recommendations.tsx`

### Changes Required
- Remove mock recommendations import
- Get recommendation from cached evaluation
- Show "Complete a mission first" if no evaluation

### Current Code
```tsx
import { mockRecommendations } from "../../data/mockData";

// Somewhere in component:
const recommendations = mockRecommendations;
```

### New Code
```tsx
// Import evaluation hook (from File 4 implementation)
import { useEvaluationStore } from "../../hooks/useEvaluation";

// In component:
const evaluation = useEvaluationStore((state) => state.evaluation);
const recommendation = evaluation?.recommendation || null;

if (!recommendation) {
  return (
    <div className="flex items-center justify-center py-12">
      <p className="text-foreground">
        Complete a mission first to get personalized recommendations.
      </p>
    </div>
  );
}

// Display recommendation.recommended_difficulty, recommended_track, reason, etc.
```

### Testing
- Verify no recommendations appear before completing a mission
- Verify real recommendation appears after mission evaluation
- Verify no "mockRecommendations" appears in console

---

## File 6: `frontend/src/routes/_protected/admin/dashboard.tsx`

### Changes Required
- Keep sessions panel (already working)
- Replace all other mock arrays with "Coming Soon" placeholders
- Remove: LEARNERS, GCP_ENVS, LOGS, ISSUES, AI_TRACES, SYSTEM, ANALYTICS

### Current Code (Find and delete)
```tsx
const LEARNERS = [{ id, name, email, ... }, ...30 items];
const GCP_ENVS = [{ zone, vm_name, ... }, ...12 items];
const LOGS = [{ timestamp, event, ... }, ...18 items];
const ISSUES = [{ id, severity, ... }, ...5 items];
const AI_TRACES = [{ chain, input, output, ... }, ...15 items];
const SYSTEM = [{ metric, value, ... }, ...4 items];
const ANALYTICS = [{ date, value, ... }, ...12 items];
```

### New Code
```tsx
// Keep sessions (already real):
// Sessions panel uses api.adminListSessions() ✓

// Replace other panels with placeholders:
function ComingSoonPanel({ title }: { title: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <h3 className="font-display text-lg font-medium text-ink">{title}</h3>
      <p className="mt-2 text-foreground">Coming soon...</p>
    </div>
  );
}

// Replace in render:
// <ComingSoonPanel title="Active Learners" />
// <ComingSoonPanel title="GCP Environments" />
// <ComingSoonPanel title="System Logs" />
// <ComingSoonPanel title="Issues" />
// <ComingSoonPanel title="AI Traces" />
// <ComingSoonPanel title="System Health" />
// <ComingSoonPanel title="Analytics" />
```

### Testing
- Verify sessions panel shows real active sessions
- Verify other panels show "Coming Soon"
- Verify no hardcoded learner/issue/trace data appears

---

## File 7: `frontend/src/data/mockData.ts`

### Changes Required
- **DELETE** 12 mock datasets
- **KEEP** only static metadata (learningTracks, difficulties, trackRows)

### Delete These
```tsx
// DELETE:
export const mockDashboardStats = { ... };
export const mockRecentActivities = [ ... ];
export const mockMissionDetails = { ... };
export const mockChallengeProgress = { ... };
export const mockEvaluationResults = { ... };
export const mockRecommendations = [ ... ];
export const mockProgressChartData = { ... };
export const mockMissionHistory = [ ... ];
export const mockAdminData = { ... };
export const mockChallenges = [ ... ];
```

### Keep These (Static Metadata)
```tsx
// KEEP:
export const learningTracks = [ ... ];  // Static track definitions
export const difficulties = [ ... ];    // Static difficulty levels
export const trackRows = [ ... ];       // Static track stats for display
```

### Testing
- Verify no imports of deleted mocks fail
- Verify compile succeeds
- Verify file size reduced significantly

---

## File 8: `frontend/src/hooks/useEvaluation.ts` (New File)

Create this file if using Context approach (File 4 Option B):

```tsx
import { create } from "zustand";

export interface EvaluationData {
  evaluation_id: string;
  session_id: string;
  status: "PASSED" | "PARTIAL" | "FAILED";
  score: number;
  criteria: Array<{
    criterion_id: string;
    passed: boolean;
    details: string;
    weight: number;
  }>;
  evaluated_at: string;
}

export interface EnrichedEvaluation {
  evaluation: EvaluationData;
  analytics: any;
  coach: {
    strengths: string[];
    weaknesses: string[];
    biggest_mistake: string;
    recommendation: string;
    cloud_concept: string;
    estimated_readiness: string;
  };
  recommendation: {
    recommended_difficulty: string;
    recommended_track: string;
    reason: string;
    confidence: number;
    topics_to_focus: string[];
    estimated_completion_time: number;
  };
}

interface EvaluationState {
  evaluation: EnrichedEvaluation | null;
  setEvaluation: (eval: EnrichedEvaluation) => void;
  clearEvaluation: () => void;
}

export const useEvaluationStore = create<EvaluationState>((set) => ({
  evaluation: null,
  setEvaluation: (evaluation) => set({ evaluation }),
  clearEvaluation: () => set({ evaluation: null }),
}));
```

---

## File 9: `frontend/src/api/apiService.ts`

### Changes Required: NONE

The apiService is already correctly structured. It:
- ✅ Normalizes all responses
- ✅ Handles errors gracefully
- ✅ Provides all needed helper methods
- ✅ Derives data from endpoints correctly

**No changes needed.**

---

## Implementation Order

**DO NOT SKIP STEPS.** Follow this exact sequence:

1. **Start the backend** (`uvicorn app.main:app --host 0.0.0.0 --port 8001`)
2. **Verify GET /progress/me works** (test in Postman/browser)
3. **Implement File 8** (useEvaluation hook)
4. **Implement File 4** (results.$id.tsx caching)
5. **Implement File 1** (dashboard.tsx)
6. **Implement File 2** (progress.tsx)
7. **Implement File 3** (history.tsx)
8. **Implement File 5** (recommendations.tsx)
9. **Implement File 6** (admin/dashboard.tsx)
10. **Implement File 7** (delete mock data)
11. **Test entire user journey** (mission flow → dashboard update)
12. **Verify no console errors** about missing mocks

---

## Success Criteria

After implementation:

- [ ] Zero mock data used in critical pages
- [ ] Dashboard shows real stats
- [ ] Progress charts show real skills
- [ ] History shows real missions
- [ ] Recommendations show evaluation recommendation
- [ ] Results page shows cached evaluation
- [ ] Admin sessions panel shows real sessions
- [ ] No console warnings about "mock" data
- [ ] No console errors about undefined data
- [ ] Full mission flow works end-to-end
- [ ] All apiService calls succeed
- [ ] GET /progress/me is never called more than once per page load (except polling)

---

## Rollback Strategy

If something breaks:
1. Git diff to see what changed
2. Restore deleted mock imports
3. Comment out API calls
4. Revert to mock data temporarily
5. Debug the API call
6. Re-implement correctly

No need to modify backend — it's already correct.

