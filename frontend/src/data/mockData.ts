export const mockUser = {
  id: "1",
  name: "Alex Johnson",
  email: "alex@example.com",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
  joinDate: "2024-01-15",
  skillLevel: "Intermediate",
};

export const learningTracks = [
  { id: "compute", name: "Compute", description: "GCE, GKE, Cloud Run — provisioning to scale-out.", icon: "⚙️" },
  { id: "storage", name: "Storage", description: "Cloud SQL, Spanner, BigQuery, GCS data lakes.", icon: "💾" },
  { id: "networking", name: "Networking", description: "VPC design, load balancing, hybrid connectivity.", icon: "🌐" },
  { id: "security", name: "Security", description: "IAM, KMS, VPC-SC, posture management.", icon: "🔒" },
  { id: "devops", name: "DevOps", description: "Cloud Build, Deploy, GitOps pipelines.", icon: "🚀" },
  { id: "architecture", name: "Architecture", description: "Multi-region, event-driven, well-architected.", icon: "🏗️" },
];

export const difficulties = [
  { id: "beginner", name: "Beginner", level: 1 },
  { id: "intermediate", name: "Intermediate", level: 2 },
  { id: "advanced", name: "Advanced", level: 3 },
];

export const mockChallenges = [
  {
    id: "1",
    title: "Deploy a Multi-Tier Application",
    track: "compute",
    difficulty: "intermediate",
    description: "Deploy a three-tier application using Compute Engine instances",
    status: "completed",
    score: 92,
    completionDate: "2024-06-15",
    timeSpent: "45 minutes",
    businessContext: "A startup needs to deploy their e-commerce platform on GCP",
    objectives: [
      "Create VPC and subnets",
      "Deploy frontend, backend, and database servers",
      "Configure load balancing",
      "Set up monitoring",
    ],
    successCriteria: "All servers running, load balancer functional, monitoring active",
    timeLimit: 120,
  },
  {
    id: "2",
    title: "Implement Cloud Storage Solution",
    track: "storage",
    difficulty: "beginner",
    description: "Create and configure Cloud Storage buckets with proper permissions",
    status: "completed",
    score: 87,
    completionDate: "2024-06-10",
    timeSpent: "30 minutes",
    businessContext: "An organization needs secure file storage for their documents",
    objectives: [
      "Create Cloud Storage bucket",
      "Configure access controls",
      "Set up lifecycle policies",
      "Enable versioning",
    ],
    successCriteria: "Bucket created, permissions configured, policies applied",
    timeLimit: 60,
  },
  {
    id: "3",
    title: "Secure Network Architecture",
    track: "networking",
    difficulty: "advanced",
    description: "Design and implement a secure VPC with multiple security layers",
    status: "in_progress",
    score: null,
    completionDate: null,
    timeSpent: "15 minutes",
    businessContext: "Enterprise needs a highly secure network infrastructure",
    objectives: [
      "Create VPC with private subnets",
      "Implement Cloud NAT",
      "Configure firewall rules",
      "Set up bastion host",
      "Enable VPC Flow Logs",
    ],
    successCriteria: "Secure network operational, all traffic logged",
    timeLimit: 180,
  },
  {
    id: "4",
    title: "Implement IAM Security",
    track: "security",
    difficulty: "intermediate",
    description: "Configure IAM roles and policies following least privilege principle",
    status: "available",
    score: null,
    completionDate: null,
    businessContext: "Organization needs to establish proper access control",
    objectives: [
      "Create custom IAM roles",
      "Assign roles to team members",
      "Implement service accounts",
      "Enable audit logging",
    ],
    successCriteria: "Proper RBAC implementation, audit trails enabled",
    timeLimit: 90,
  },
  {
    id: "5",
    title: "CI/CD Pipeline with Cloud Build",
    track: "devops",
    difficulty: "intermediate",
    description: "Set up automated CI/CD pipeline using Cloud Build and Artifact Registry",
    status: "available",
    score: null,
    completionDate: null,
    businessContext: "Team needs automated deployment workflow",
    objectives: [
      "Create Cloud Build pipeline",
      "Configure artifact registry",
      "Implement automated testing",
      "Set up deployment triggers",
    ],
    successCriteria: "Automated pipeline operational, successful builds deployed",
    timeLimit: 120,
  },
  {
    id: "6",
    title: "Design Scalable Architecture",
    track: "architecture",
    difficulty: "advanced",
    description: "Design a globally distributed, scalable application architecture",
    status: "available",
    score: null,
    completionDate: null,
    businessContext: "Company expanding globally needs scalable infrastructure",
    objectives: [
      "Design multi-region setup",
      "Implement global load balancing",
      "Configure auto-scaling",
      "Set up disaster recovery",
    ],
    successCriteria: "Scalable architecture design completed and validated",
    timeLimit: 150,
  },
];

export const mockDashboardStats = {
  totalChallengesCompleted: 2,
  successRate: 89.5,
  currentSkillLevel: "Intermediate",
  learningTrack: "Multi-track",
  hoursLearned: 12.5,
  nextRecommendedChallenge: "CI/CD Pipeline with Cloud Build",
};

export const mockRecentActivities = [
  {
    id: "1",
    type: "challenge_completed",
    title: "Completed: Deploy a Multi-Tier Application",
    description: "Scored 92/100",
    timestamp: "2 hours ago",
    icon: "✅",
  },
  {
    id: "2",
    type: "challenge_started",
    title: "Started: Secure Network Architecture",
    description: "Advanced level challenge",
    timestamp: "5 hours ago",
    icon: "🚀",
  },
  {
    id: "3",
    type: "achievement",
    title: "Achieved: Compute Expert",
    description: "Completed 3 compute challenges",
    timestamp: "1 day ago",
    icon: "🏆",
  },
];

export const mockMissionDetails = {
  id: "3",
  title: "Secure Network Architecture",
  track: "networking",
  difficulty: "advanced",
  businessScenario:
    "TechCorp, a rapidly growing fintech company, needs to establish a highly secure cloud infrastructure. They handle sensitive financial data and must comply with strict regulatory requirements. Your mission is to design and implement a secure VPC with multiple security layers.",
  objectives: [
    "Create a VPC with private subnets",
    "Implement Cloud NAT for secure outbound traffic",
    "Configure firewall rules with least privilege principle",
    "Set up a bastion host for secure administration",
    "Enable VPC Flow Logs for monitoring and compliance",
  ],
  successCriteria: [
    "VPC created with properly segmented subnets",
    "All inbound traffic restricted to required ports only",
    "Cloud NAT successfully routing outbound traffic",
    "Bastion host accessible only from specific IPs",
    "VPC Flow Logs capturing all network traffic",
    "No instances have public IPs directly assigned",
  ],
  timeLimit: 180,
  estimatedTime: "3 hours",
  tasks: [
    { id: 1, title: "Create VPC network", completed: true, description: 'Create a new VPC named "secure-vpc"' },
    { id: 2, title: "Create private subnets", completed: true, description: "Create 2 private subnets in different zones" },
    { id: 3, title: "Configure Cloud NAT", completed: false, description: "Set up Cloud NAT for outbound traffic" },
    { id: 4, title: "Configure firewall rules", completed: false, description: "Create firewall rules with least privilege" },
    { id: 5, title: "Deploy bastion host", completed: false, description: "Deploy a bastion host for secure access" },
    { id: 6, title: "Enable VPC Flow Logs", completed: false, description: "Configure VPC Flow Logs" },
  ],
};

export const mockChallengeProgress = {
  taskCompletion: 33,
  timeRemaining: 165,
  resourcesCreated: [
    { type: "VPC", name: "secure-vpc", status: "active" },
    { type: "Subnet", name: "secure-subnet-1", status: "active" },
    { type: "Subnet", name: "secure-subnet-2", status: "active" },
  ],
  currentStep: "Configure Cloud NAT",
  activityLog: [
    { time: "14:30:00", action: "VPC created: secure-vpc", status: "success" },
    { time: "14:32:15", action: "Subnet created: secure-subnet-1", status: "success" },
    { time: "14:35:42", action: "Subnet created: secure-subnet-2", status: "success" },
  ],
};

export const mockEvaluationResults = {
  missionId: "3",
  missionTitle: "Secure Network Architecture",
  overallScore: 92,
  outcome: "Pass",
  completionTime: "2 hours 45 minutes",
  resources: { created: 8, configured: 7, issues: 1 },
  tasksCompleted: 6,
  tasksTotal: 6,
  evaluation: {
    strengths: [
      "Properly segmented VPC architecture",
      "Correct implementation of least privilege firewall rules",
      "Excellent use of Cloud NAT for security",
    ],
    mistakes: ["Initial bastion host configuration was overly permissive — corrected"],
    improvements: [
      "Consider implementing Cloud Armor for DDoS protection",
      "Add Cloud KMS for encryption key management",
      "Implement resource tagging for better management",
    ],
  },
  feedback:
    "Excellent work on implementing a secure network architecture. Your understanding of security principles and GCP services is impressive. The only minor issue was the initial bastion host configuration, which you quickly identified and corrected.",
};

export const mockRecommendations = {
  currentLevel: "Intermediate",
  suggestedPath: [
    {
      id: "5",
      title: "CI/CD Pipeline with Cloud Build",
      track: "devops",
      difficulty: "intermediate",
      reason: "Complements your networking knowledge with DevOps skills",
    },
    {
      id: "6",
      title: "Design Scalable Architecture",
      track: "architecture",
      difficulty: "advanced",
      reason: "Ready for advanced architecture design after mastering networking",
    },
  ],
  skillGaps: [
    { skill: "Kubernetes", gap: "High", suggestion: "Take GKE Fundamentals challenge" },
    { skill: "Infrastructure as Code", gap: "Medium", suggestion: "Try Terraform challenges" },
  ],
  insights: [
    "You excel at security-focused challenges. Consider specializing in Cloud Security track.",
    "Your learning pace is 20% faster than average. You can handle more complex challenges.",
  ],
};

export const mockProgressChartData = {
  progressTrend: [
    { month: "Jan", completed: 2, inProgress: 0, failed: 0 },
    { month: "Feb", completed: 3, inProgress: 1, failed: 0 },
    { month: "Mar", completed: 4, inProgress: 0, failed: 1 },
    { month: "Apr", completed: 5, inProgress: 2, failed: 0 },
    { month: "May", completed: 6, inProgress: 1, failed: 0 },
    { month: "Jun", completed: 8, inProgress: 1, failed: 0 },
  ],
  successRateTrend: [
    { month: "Jan", rate: 75 },
    { month: "Feb", rate: 80 },
    { month: "Mar", rate: 85 },
    { month: "Apr", rate: 87 },
    { month: "May", rate: 89 },
    { month: "Jun", rate: 92 },
  ],
  trackDistribution: [
    { track: "Compute", value: 20 },
    { track: "Storage", value: 15 },
    { track: "Networking", value: 25 },
    { track: "Security", value: 18 },
    { track: "DevOps", value: 12 },
    { track: "Architecture", value: 10 },
  ],
  skillGrowth: [
    { skill: "GCP Fundamentals", current: 85, previous: 60 },
    { skill: "Cloud Networking", current: 90, previous: 65 },
    { skill: "Security", current: 88, previous: 70 },
    { skill: "DevOps", current: 72, previous: 50 },
    { skill: "Architecture", current: 80, previous: 60 },
  ],
};

export const mockMissionHistory = [
  { id: "1", title: "Deploy a Multi-Tier Application", track: "compute", difficulty: "intermediate", completionDate: "2024-06-15", score: 92, status: "completed" },
  { id: "2", title: "Implement Cloud Storage Solution", track: "storage", difficulty: "beginner", completionDate: "2024-06-10", score: 87, status: "completed" },
  { id: "3", title: "Secure Network Architecture", track: "networking", difficulty: "advanced", completionDate: "2024-06-05", score: 95, status: "completed" },
  { id: "4", title: "Database Migration Strategy", track: "storage", difficulty: "advanced", completionDate: "2024-05-30", score: 88, status: "completed" },
  { id: "5", title: "Implement IAM Security", track: "security", difficulty: "intermediate", completionDate: "2024-05-25", score: 91, status: "completed" },
];

export const mockAdminData = {
  activeLearners: 156,
  activeChallenges: 43,
  avgCompletionTime: "2.5 hours",
  systemHealth: "Optimal",
  scenarioGenerationLogs: [
    { id: 1, timestamp: "14:30:00", scenario: "Secure Network", status: "success" },
    { id: 2, timestamp: "14:25:30", scenario: "CI/CD Pipeline", status: "success" },
    { id: 3, timestamp: "14:20:15", scenario: "Storage Optimization", status: "success" },
  ],
  evaluationLogs: [
    { id: 1, timestamp: "14:15:00", challenge: "Network Architecture", result: "Pass" },
    { id: 2, timestamp: "14:10:30", challenge: "Deploy Application", result: "Pass" },
  ],
  auditEvents: [
    { id: 1, timestamp: "14:05:00", user: "user123", action: "Challenge Started", resource: "Networking-101" },
    { id: 2, timestamp: "14:00:00", user: "user456", action: "Challenge Completed", resource: "Security-202" },
  ],
};

export const trackRows = [
  { key: "compute", name: "Compute", completed: 8, total: 22, avg: 89 },
  { key: "storage", name: "Storage", completed: 4, total: 18, avg: 71 },
  { key: "networking", name: "Networking", completed: 6, total: 20, avg: 86 },
  { key: "security", name: "Security", completed: 5, total: 24, avg: 93 },
  { key: "devops", name: "DevOps", completed: 3, total: 26, avg: 78 },
  { key: "architecture", name: "Architecture", completed: 2, total: 30, avg: 84 },
];
