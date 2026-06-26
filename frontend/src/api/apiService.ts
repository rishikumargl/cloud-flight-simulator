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
  startChallenge: async (mission_id: string) => {
    try {
      const response = await axiosClient.post("/challenges/start", {
        mission_id,
      });
      return response.data.data;
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

  // Evaluation: Run live evaluation
  runEvaluation: async (session_id: string) => {
    try {
      const response = await axiosClient.post(`/evaluate/${session_id}/run`);
      return response.data.data;
    } catch (error) {
      console.error("Failed to run evaluation:", error);
      throw error;
    }
  },

  // === PLACEHOLDER METHODS (Return Empty/Safe Defaults) ===
  // These routes are NOT YET IMPLEMENTED in the backend

  getDashboardStats: async () => {
    return {
      missionsCompleted: 0,
      successRate: 0,
      currentLevel: "Beginner",
    };
  },

  getMissionHistory: async () => {
    return [];
  },

  getRecentActivities: async () => {
    return [];
  },

  getProgressCharts: async () => {
    return {
      lineChart: [],
      barChart: [],
      pieChart: [],
    };
  },

  getRecommendations: async () => {
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
