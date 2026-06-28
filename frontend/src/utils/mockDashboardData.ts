export interface DashboardData {
  current_level: string;
  level_progress_pct: number;
  next_level: string;
  learning_streak: {
    current: number;
    longest: number;
    missions_this_week: number;
  };
  skill_matrix: Record<
    string,
    {
      proficiency: number;
      confidence?: number;
      missions_attempted?: number;
      success_rate?: number;
    }
  >;
  overall_proficiency: number;
  achievements: Array<{
    id: string;
    name: string;
    earned_at: string;
  }>;
  stats: {
    total_missions: number;
    completed_missions: number;
    completion_rate: number;
    average_score: number;
    total_attempts: number;
    current_streak: number;
  };
  recent_missions: Array<{
    mission_id: string;
    title: string;
    track: string;
    difficulty: string;
    score: number;
    explanation_score?: number;
    status: "PASSED" | "PARTIAL" | "FAILED";
    summary?: string;
    completed_at: string;
    evaluation_id: string;
  }>;
}

export const MOCK_DASHBOARD_DATA: DashboardData = {
  current_level: "Cloud Associate",
  level_progress_pct: 72,
  next_level: "Cloud Engineer",
  learning_streak: {
    current: 4,
    longest: 7,
    missions_this_week: 3,
  },
  skill_matrix: {
    compute: {
      proficiency: 88,
      confidence: 0.92,
      missions_attempted: 6,
      success_rate: 0.92,
    },
    storage: {
      proficiency: 85,
      confidence: 0.89,
      missions_attempted: 5,
      success_rate: 0.89,
    },
    networking: {
      proficiency: 82,
      confidence: 0.85,
      missions_attempted: 4,
      success_rate: 0.85,
    },
    iam: {
      proficiency: 79,
      confidence: 0.81,
      missions_attempted: 4,
      success_rate: 0.81,
    },
    devops: {
      proficiency: 65,
      confidence: 0.68,
      missions_attempted: 2,
      success_rate: 0.68,
    },
    security: {
      proficiency: 72,
      confidence: 0.75,
      missions_attempted: 3,
      success_rate: 0.75,
    },
    kubernetes: {
      proficiency: 58,
      confidence: 0.62,
      missions_attempted: 2,
      success_rate: 0.62,
    },
    monitoring: {
      proficiency: 68,
      confidence: 0.72,
      missions_attempted: 2,
      success_rate: 0.72,
    },
  },
  overall_proficiency: 75,
  achievements: [
    {
      id: "first_mission",
      name: "First Mission",
      earned_at: "2026-06-15T10:30:00Z",
    },
    {
      id: "five_missions",
      name: "Five Missions",
      earned_at: "2026-06-20T14:45:00Z",
    },
    {
      id: "five_passed",
      name: "Five Victories",
      earned_at: "2026-06-22T09:15:00Z",
    },
    {
      id: "perfect_score",
      name: "Perfect Infrastructure",
      earned_at: "2026-06-18T16:20:00Z",
    },
    {
      id: "excellent_explanation",
      name: "Clear Communicator",
      earned_at: "2026-06-21T11:00:00Z",
    },
    {
      id: "hot_streak",
      name: "🔥 Hot Streak",
      earned_at: "2026-06-25T13:30:00Z",
    },
    {
      id: "storage_specialist",
      name: "Storage Specialist",
      earned_at: "2026-06-19T10:45:00Z",
    },
    {
      id: "security_champion",
      name: "Security Champion",
      earned_at: "2026-06-23T15:20:00Z",
    },
  ],
  stats: {
    total_missions: 15,
    completed_missions: 12,
    completion_rate: 80,
    average_score: 84,
    total_attempts: 15,
    current_streak: 4,
  },
  recent_missions: [
    {
      mission_id: "mission-001",
      evaluation_id: "eval-001",
      title: "Deploy Multi-Region GCS Setup",
      track: "Storage",
      difficulty: "ADVANCED",
      score: 92,
      explanation_score: 89,
      status: "PASSED",
      summary: "Excellent work on geo-redundancy and lifecycle policies.",
      completed_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      mission_id: "mission-002",
      evaluation_id: "eval-002",
      title: "Incident Response: Fix the Crashed Metadata",
      track: "Compute",
      difficulty: "INTERMEDIATE",
      score: 78,
      explanation_score: 75,
      status: "PARTIAL",
      summary: "Good troubleshooting but could improve automated recovery steps.",
      completed_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    },
    {
      mission_id: "mission-003",
      evaluation_id: "eval-003",
      title: "Secure VPC with Advanced Firewall Rules",
      track: "Networking",
      difficulty: "INTERMEDIATE",
      score: 86,
      explanation_score: 84,
      status: "PASSED",
      summary: "Strong understanding of service accounts and network isolation.",
      completed_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      mission_id: "mission-004",
      evaluation_id: "eval-004",
      title: "Implement Custom IAM Roles",
      track: "IAM",
      difficulty: "INTERMEDIATE",
      score: 81,
      explanation_score: 79,
      status: "PASSED",
      summary: "Good role design with appropriate least privilege principle.",
      completed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      mission_id: "mission-005",
      evaluation_id: "eval-005",
      title: "Kubernetes Deployment on GKE",
      track: "Compute",
      difficulty: "ADVANCED",
      score: 88,
      explanation_score: 86,
      status: "PASSED",
      summary: "Excellent container orchestration. Ready for production workloads.",
      completed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      mission_id: "mission-006",
      evaluation_id: "eval-006",
      title: "Set Up Cloud Monitoring & Alerts",
      track: "Monitoring",
      difficulty: "BEGINNER",
      score: 95,
      explanation_score: 93,
      status: "PASSED",
      summary: "Perfect setup with proper thresholds and notification channels.",
      completed_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      mission_id: "mission-007",
      evaluation_id: "eval-007",
      title: "DevOps Pipeline with Cloud Build",
      track: "DevOps",
      difficulty: "INTERMEDIATE",
      score: 72,
      explanation_score: 70,
      status: "PARTIAL",
      summary: "Good pipeline structure but missing some security checks.",
      completed_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      mission_id: "mission-008",
      evaluation_id: "eval-008",
      title: "Cloud Security Best Practices",
      track: "Security",
      difficulty: "INTERMEDIATE",
      score: 84,
      explanation_score: 82,
      status: "PASSED",
      summary: "Strong grasp of encryption, CMEK, and VPC Service Controls.",
      completed_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
};

/**
 * Generate dashboard data with slight variations for demo purposes
 * In production, this would come from the /progress/me API endpoint
 */
export function generateMockDashboardData(): DashboardData {
  // Return base mock data (could add randomization here if needed for variety)
  return JSON.parse(JSON.stringify(MOCK_DASHBOARD_DATA));
}
