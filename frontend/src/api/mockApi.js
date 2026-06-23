import * as mockData from '../data/mockData';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const api = {
  // Auth endpoints
  login: async (email, password) => {
    await delay(500);
    if (email && password) {
      return { success: true, user: mockData.mockUser };
    }
    throw new Error('Invalid credentials');
  },

  register: async (name, email, password) => {
    await delay(500);
    if (name && email && password) {
      return { success: true, user: { ...mockData.mockUser, name } };
    }
    throw new Error('Registration failed');
  },

  // Challenge endpoints
  getChallenges: async () => {
    await delay(300);
    return mockData.mockChallenges;
  },

  getChallengeById: async (id) => {
    await delay(200);
    return mockData.mockChallenges.find((c) => c.id === id);
  },

  startChallenge: async (id) => {
    await delay(800);
    return {
      success: true,
      missionDetails: mockData.mockMissionDetails,
      environmentId: `env-${Date.now()}`,
    };
  },

  // Dashboard endpoints
  getDashboardStats: async () => {
    await delay(300);
    return mockData.mockDashboardStats;
  },

  getRecentActivities: async () => {
    await delay(300);
    return mockData.mockRecentActivities;
  },

  // Mission endpoints
  getMissionDetails: async (id) => {
    await delay(200);
    return mockData.mockMissionDetails;
  },

  getMissionProgress: async (id) => {
    await delay(300);
    return mockData.mockChallengeProgress;
  },

  submitMissionResult: async (id, result) => {
    await delay(1000);
    return {
      success: true,
      evaluation: mockData.mockEvaluationResults,
    };
  },

  // Evaluation endpoints
  getEvaluationResults: async (id) => {
    await delay(300);
    return mockData.mockEvaluationResults;
  },

  // Recommendations endpoints
  getRecommendations: async () => {
    await delay(300);
    return mockData.mockRecommendations;
  },

  // Progress dashboard endpoints
  getProgressCharts: async () => {
    await delay(400);
    return mockData.mockProgressChartData;
  },

  // Mission history endpoints
  getMissionHistory: async () => {
    await delay(300);
    return mockData.mockMissionHistory;
  },

  // Admin endpoints
  getAdminData: async () => {
    await delay(400);
    return mockData.mockAdminData;
  },
};

export default api;
