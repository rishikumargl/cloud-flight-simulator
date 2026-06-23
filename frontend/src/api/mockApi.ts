import * as mockData from "../data/mockData";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const api = {
  // Auth
  login: async (email: string, _password: string) => {
    await delay(500);
    if (email) return { success: true, user: mockData.mockUser };
    throw new Error("Invalid credentials");
  },

  // Challenges
  getChallenges: async () => {
    await delay(300);
    return mockData.mockChallenges;
  },
  getChallengeById: async (id: string) => {
    await delay(200);
    return mockData.mockChallenges.find((c) => c.id === id);
  },
  startChallenge: async (_id: string | number) => {
    await delay(800);
    return {
      success: true,
      missionDetails: mockData.mockMissionDetails,
      environmentId: `env-${Date.now()}`,
    };
  },

  // Dashboard
  getDashboardStats: async () => {
    await delay(300);
    return mockData.mockDashboardStats;
  },
  getRecentActivities: async () => {
    await delay(300);
    return mockData.mockRecentActivities;
  },

  // Mission
  getMissionDetails: async (_id: string) => {
    await delay(200);
    return mockData.mockMissionDetails;
  },
  getMissionProgress: async (_id: string) => {
    await delay(300);
    return mockData.mockChallengeProgress;
  },
  submitMissionResult: async (_id: string, _result: unknown) => {
    await delay(1000);
    return { success: true, evaluation: mockData.mockEvaluationResults };
  },

  // Evaluation
  getEvaluationResults: async (_id: string) => {
    await delay(300);
    return mockData.mockEvaluationResults;
  },

  // Recommendations
  getRecommendations: async () => {
    await delay(300);
    return mockData.mockRecommendations;
  },

  // Progress
  getProgressCharts: async () => {
    await delay(400);
    return mockData.mockProgressChartData;
  },

  // History
  getMissionHistory: async () => {
    await delay(300);
    return mockData.mockMissionHistory;
  },

  // Admin
  getAdminData: async () => {
    await delay(400);
    return mockData.mockAdminData;
  },
};

export default api;
