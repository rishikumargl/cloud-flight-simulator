import axiosClient from "./client";

/**
 * API Service Layer - MVP Flow Only
 * Wraps axios client with only implemented routes from frozen contract
 *
 * Implemented Routes:
 * - POST /scenarios/generate → generateScenario
 * - GET /scenarios/{mission_id} → getMissionDetails
 * - POST /challenges/start → startChallenge
 * - GET /challenges/{session_id}/status → getChallengeStatus
 * - POST /challenges/{session_id}/stop → stopChallenge
 */

const apiService = {
  // === MVP FLOW ONLY ===

  // Scenario Generation
  generateScenario: async (track: string, difficulty: string) => {
    try {
      const response = await axiosClient.post("/scenarios/generate", {
        track: track.toUpperCase(),
        difficulty: difficulty.toUpperCase(),
      });
      return response.data.data;
    } catch (error) {
      console.error("Failed to generate scenario:", error);
      throw error;
    }
  },

  // Mission Details
  getMissionDetails: async (mission_id: string) => {
    try {
      const response = await axiosClient.get(`/scenarios/${mission_id}`);
      return response.data.data;
    } catch (error) {
      console.error("Failed to get mission details:", error);
      throw error;
    }
  },

  // Challenge: Start
  // Normalizes nested backend response { session: {...}, environment: {...}, gcp_console_url }
  // into flat { session_id, environment, gcp_console_url, expires_at }
  startChallenge: async (mission_id: string) => {
    try {
      const response = await axiosClient.post("/challenges/start", {
        mission_id,
      });
      const data = response.data.data;
      return {
        session_id: data.session.session_id,
        user_id: data.session.user_id,
        mission_id: data.session.mission_id,
        status: data.session.status,
        started_at: data.session.started_at,
        expires_at: data.session.expires_at,
        environment: data.environment,
        gcp_console_url: data.gcp_console_url,
      };
    } catch (error) {
      console.error("Failed to start challenge:", error);
      throw error;
    }
  },

  // Challenge: Status
  getChallengeStatus: async (session_id: string) => {
    try {
      const response = await axiosClient.get(`/challenges/${session_id}/status`);
      return response.data.data;
    } catch (error) {
      console.error("Failed to get challenge status:", error);
      throw error;
    }
  },

  // Challenge: Stop
  stopChallenge: async (session_id: string) => {
    try {
      const response = await axiosClient.post(`/challenges/${session_id}/stop`);
      return response.data.data;
    } catch (error) {
      console.error("Failed to stop challenge:", error);
      throw error;
    }
  },

  // Evaluation: Get cached evaluation
  getEvaluation: async (session_id: string) => {
    try {
      const response = await axiosClient.get(`/evaluate/${session_id}`);
      return response.data.data;
    } catch (error) {
      console.error("Failed to get evaluation:", error);
      throw error;
    }
  },

  // Progress: Get current learner progress (skills, achievements, stats, recent missions)
  getProgress: async () => {
    try {
      const response = await axiosClient.get("/progress/me");
      return response.data.data;
    } catch (error) {
      console.error("Failed to get progress:", error);
      throw error;
    }
  },

  // Evaluation: Run live evaluation
  // Normalizes enriched response with evaluation + analytics + coach + recommendation
  // Flattens deterministic_checks { passed: [], failed: [] } into single criteria array
  runEvaluation: async (session_id: string, payload?: { solution_description: string }) => {
    try {
      const response = await axiosClient.post(`/evaluate/${session_id}/run`, payload || {});
      const data = response.data.data;

      // Flatten deterministic_checks into single ordered criteria array
      const criteria = [
        ...data.evaluation.deterministic_checks.passed,
        ...data.evaluation.deterministic_checks.failed,
      ];

      // Return complete evaluation response with mission metadata
      return {
        evaluation: {
          evaluation_id: data.evaluation.evaluation_id,
          session_id: data.evaluation.session_id,
          status: data.evaluation.status,
          score: data.evaluation.score,
          evaluated_at: data.evaluation.evaluated_at,
          explanation_score: data.evaluation.explanation_score,
          coach_feedback: data.evaluation.coach_feedback,
          technical_skills: data.evaluation.technical_skills,
          recommendation: data.evaluation.recommendation,
          summary: data.evaluation.summary,
          solution_description: data.evaluation.solution_description,
          criteria, // Flattened array for task checklist
        },
        mission: data.mission || {},
        session: data.session || {},
        analytics: data.analytics,
        coach: data.coach,
        recommendation: data.recommendation,
      };
    } catch (error) {
      console.error("Failed to run evaluation:", error);
      throw error;
    }
  },

  // === HELPER METHODS (Derive from real endpoints) ===

  // Dashboard stats derived from GET /progress/me
  getDashboardStats: async () => {
    try {
      const progress = await apiService.getProgress();
      return {
        missionsCompleted: progress.stats.total_missions,
        successRate: progress.stats.average_score,
        currentLevel: progress.overall_proficiency >= 80 ? "Advanced" : progress.overall_proficiency >= 60 ? "Intermediate" : "Beginner",
      };
    } catch {
      return {
        missionsCompleted: 0,
        successRate: 0,
        currentLevel: "Beginner",
      };
    }
  },

  // Mission history derived from GET /progress/me (recent_missions)
  getMissionHistory: async () => {
    try {
      const progress = await apiService.getProgress();
      return progress.recent_missions || [];
    } catch {
      return [];
    }
  },

  // Recent activities derived from GET /progress/me
  getRecentActivities: async () => {
    try {
      const progress = await apiService.getProgress();
      return (progress.recent_missions || []).slice(0, 5).map((m: any) => ({
        id: m.mission_id,
        icon: "✓",
        title: m.title,
        description: m.status === "PASSED" ? "Completed successfully" : "In progress",
        timestamp: new Date(m.completed_at).toLocaleDateString(),
      }));
    } catch {
      return [];
    }
  },

  // Progress charts derived from GET /progress/me
  getProgressCharts: async () => {
    try {
      const progress = await apiService.getProgress();
      const skills = (progress as any).skill_matrix || {};
      return {
        skillGrowth: Object.entries(skills).map(([skill, data]: [string, any]) => ({
          skill,
          proficiency: data.proficiency || 0,
        })),
        stats: (progress as any).stats,
      };
    } catch {
      return {
        skillGrowth: [],
        stats: {},
      };
    }
  },

  // Recommendations derived from last evaluation (should be in state, not API call)
  getRecommendations: async () => {
    // This should come from the evaluation response, not a separate API call
    // Returns empty by default - component should use cached evaluation
    return [];
  },

  getAdminData: async () => {
    return {
      activeLearners: 0,
      activeChallenges: 0,
      avgCompletionTime: "0h",
      systemHealth: "OK",
    };
  },

  // Admin: list active GCP sessions
  adminListSessions: async () => {
    try {
      const response = await axiosClient.get("/challenges/admin/sessions");
      return response.data.data;
    } catch (error) {
      console.error("Failed to list admin sessions:", error);
      throw error;
    }
  },

  // Admin: force-clear a session and its GCP resources
  adminClearSession: async (session_id: string) => {
    try {
      const response = await axiosClient.post(`/challenges/admin/sessions/${session_id}/clear`);
      return response.data.data;
    } catch (error) {
      console.error("Failed to clear session:", error);
      throw error;
    }
  },

  // Admin: get system-wide analytics for operations dashboard
  adminGetAnalytics: async () => {
    try {
      const response = await axiosClient.get("/admin/analytics");
      return response.data.data;
    } catch (error) {
      console.error("Failed to get admin analytics:", error);
      throw error;
    }
  },

  // Legacy/Deprecated (use specific methods above instead)
  getChallenges: async () => {
    return [];
  },

  getChallengeById: async (id: string) => {
    return await apiService.getChallengeStatus(id);
  },

  getMissionProgress: async (id: string) => {
    return await apiService.getChallengeStatus(id);
  },

  submitMissionResult: async (_id: string, _result: unknown) => {
    throw new Error("Route not yet implemented: POST /challenges/{id}/submit");
  },

  getEvaluationResults: async (_id: string) => {
    throw new Error("Route not yet implemented: GET /evaluate/{id}");
  },
};

export default apiService;
