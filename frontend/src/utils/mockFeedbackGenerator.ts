export type Track = "Compute" | "Storage" | "Networking" | "IAM" | "Monitoring" | "Security" | "DevOps";
export type Difficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

interface MockEvaluation {
  evaluation_id: string;
  session_id: string;
  status: "PASSED" | "PARTIAL" | "FAILED";
  score: number;
  explanation_score: number;
  coach_feedback: {
    strengths: string[];
    improvements: string[];
    next_focus: string;
  };
  technical_skills: Record<string, { proficiency: number }>;
  recommendation: {
    track: string;
    difficulty: string;
    reason: string;
  };
  summary: string;
  solution_description: string;
}

const trackFeedback = {
  Compute: {
    BEGINNER: {
      strengths: [
        "Correctly created VM instance with appropriate machine type",
        "Applied basic security best practices (firewall rules)",
      ],
      improvements: [
        "Consider using startup scripts for automated configuration",
        "Could improve boot disk configuration for better performance",
      ],
      nextFocus: "Custom machine types and performance tuning",
      skills: { compute: 85, linux: 72, devops: 65 },
      summary:
        "You successfully deployed a Compute Engine instance with proper firewall configuration. The instance is secure and meets the requirements. Next, explore custom machine types and automated deployment with startup scripts.",
      solutionExample:
        "gcloud compute instances create my-instance \\\n  --zone=us-central1-a \\\n  --machine-type=e2-medium \\\n  --image-family=debian-11 \\\n  --image-project=debian-cloud\n\ngcloud compute firewall-rules create allow-http \\\n  --allow=tcp:80,tcp:443 \\\n  --source-ranges=0.0.0.0/0",
    },
    INTERMEDIATE: {
      strengths: [
        "Excellent use of custom machine types for cost optimization",
        "Implemented comprehensive monitoring with Cloud Monitoring",
        "Applied advanced security configurations (IAM, VPC peering)",
      ],
      improvements: [
        "Could optimize startup scripts for faster boot time",
        "Consider implementing auto-healing and auto-scaling policies",
      ],
      nextFocus: "Instance templates and managed instance groups",
      skills: { compute: 92, linux: 88, devops: 85, security: 78 },
      summary:
        "Excellent work deploying and configuring a production-ready Compute instance. You demonstrated strong understanding of performance tuning, security hardening, and monitoring. Next level: managed instance groups and load balancing.",
      solutionExample:
        "gcloud compute instance-templates create my-template \\\n  --machine-type=custom-4-16384 \\\n  --boot-disk-type=pd-ssd \\\n  --image-family=debian-11 \\\n  --scopes=cloud-platform\n\ngcloud compute instance-groups managed create my-ig \\\n  --template=my-template \\\n  --size=3 \\\n  --zone=us-central1-a",
    },
  },
  Storage: {
    BEGINNER: {
      strengths: [
        "Successfully created and configured GCS bucket",
        "Applied basic access controls appropriately",
        "Configured lifecycle policies correctly",
      ],
      improvements: [
        "Consider versioning for data protection",
        "Could optimize storage class selection for cost",
      ],
      nextFocus: "Advanced access control and data protection",
      skills: { storage: 88, security: 72, devops: 68 },
      summary:
        "Good work creating and configuring your Cloud Storage bucket. The basic setup is solid with proper access controls. Explore versioning and different storage classes to optimize for your use case.",
      solutionExample:
        "gsutil mb -c STANDARD -l US-CENTRAL1 gs://my-bucket\n\ngsutil lifecycle set - gs://my-bucket <<EOF\n{\"lifecycle\": {\"rule\": [{\"action\": {\"type\": \"Delete\"}, \"condition\": {\"age\": 90}}]}}\nEOF\n\ngsutil acl ch -u [SERVICE_ACCOUNT]:R gs://my-bucket",
    },
    INTERMEDIATE: {
      strengths: [
        "Implemented robust versioning and retention policies",
        "Applied least-privilege access controls with fine-grained IAM",
        "Optimized storage costs with intelligent tiering",
      ],
      improvements: [
        "Could add additional encryption with customer-managed keys",
        "Consider implementing cross-region replication for disaster recovery",
      ],
      nextFocus: "Customer-managed encryption and multi-region strategies",
      skills: { storage: 94, security: 89, devops: 85 },
      summary:
        "Excellent storage configuration with strong security and cost optimization. You demonstrated mastery of versioning, lifecycle policies, and IAM. Next: explore CMEK and cross-region replication for enterprise scenarios.",
      solutionExample:
        "gsutil mb -b on -c NEARLINE -l US-CENTRAL1 gs://my-bucket\n\ngsutil encryption set gs://my-bucket\n\ngsutil -m acl ch -r -u [EMAIL]:R gs://my-bucket\n\ngsutil replication set on gs://my-bucket",
    },
  },
  Networking: {
    BEGINNER: {
      strengths: [
        "Created VPC with appropriate subnet configuration",
        "Configured firewall rules effectively",
        "Applied basic routing correctly",
      ],
      improvements: [
        "Consider more granular firewall rules (e.g., by service account)",
        "Could optimize routing with Cloud Routes",
      ],
      nextFocus: "Advanced firewall rules and Cloud NAT",
      skills: { networking: 82, security: 75, devops: 70 },
      summary:
        "Good VPC setup with functional subnets and firewall configuration. The network is properly isolated. Next explore more advanced features like Cloud NAT, VPN, and custom routes.",
      solutionExample:
        "gcloud compute networks create my-vpc --subnet-mode=custom\n\ngcloud compute networks subnets create my-subnet \\\n  --network=my-vpc \\\n  --range=10.0.0.0/24 \\\n  --region=us-central1\n\ngcloud compute firewall-rules create allow-internal \\\n  --network=my-vpc \\\n  --allow=tcp,udp \\\n  --source-ranges=10.0.0.0/24",
    },
    INTERMEDIATE: {
      strengths: [
        "Masterful VPC design with multiple subnets and routing tiers",
        "Implemented Cloud NAT for secure outbound connectivity",
        "Applied advanced firewall rules with service accounts and tags",
      ],
      improvements: [
        "Could implement VPC Flow Logs for enhanced monitoring",
        "Consider VPC Service Controls for additional security boundaries",
      ],
      nextFocus: "VPC peering and Shared VPC for multi-project architectures",
      skills: { networking: 93, security: 90, devops: 87 },
      summary:
        "Outstanding network architecture with excellent security posture. You implemented production-grade VPC design with NAT, advanced routing, and fine-grained access controls. Next: VPC peering and Shared VPC.",
      solutionExample:
        "gcloud compute networks create my-vpc --subnet-mode=custom --enable-flow-logs\n\ngcloud compute routers create my-router \\\n  --network=my-vpc \\\n  --asn=64514\n\ngcloud compute routers nats create my-nat \\\n  --router=my-router \\\n  --auto-allocate-nat-external-ips",
    },
  },
  IAM: {
    BEGINNER: {
      strengths: [
        "Created appropriate roles for service accounts",
        "Applied least-privilege principle correctly",
        "Properly bound roles to principals",
      ],
      improvements: [
        "Could use more specific predefined roles instead of custom roles",
        "Consider implementing resource-level access controls",
      ],
      nextFocus: "Custom roles and condition-based access",
      skills: { iam: 85, security: 82, devops: 75 },
      summary:
        "Solid IAM configuration with appropriate role assignments. You demonstrated understanding of least privilege. Explore custom roles and conditional access for more advanced scenarios.",
      solutionExample:
        "gcloud iam service-accounts create my-sa \\\n  --display-name='My Service Account'\n\ngcloud projects add-iam-policy-binding my-project \\\n  --member=serviceAccount:my-sa@my-project.iam.gserviceaccount.com \\\n  --role=roles/compute.admin",
    },
    INTERMEDIATE: {
      strengths: [
        "Expert implementation of custom roles with granular permissions",
        "Applied conditional IAM policies for time-based access",
        "Implemented service account impersonation for secure delegation",
      ],
      improvements: [
        "Could leverage Workload Identity for Kubernetes integration",
        "Consider additional audit logging with Cloud Audit Logs",
      ],
      nextFocus: "Workload Identity and OAuth 2.0 delegation",
      skills: { iam: 94, security: 92, devops: 88 },
      summary:
        "Exceptional IAM design with custom roles, conditional access, and service account delegation. You showed mastery of access control patterns. Next: Workload Identity and advanced delegation scenarios.",
      solutionExample:
        "gcloud iam roles create myRole \\\n  --project=my-project \\\n  --title='My Custom Role' \\\n  --permissions=compute.instances.get,compute.instances.list\n\ngcloud iam service-accounts add-iam-policy-binding my-sa@my-project.iam.gserviceaccount.com \\\n  --member=user:user@example.com \\\n  --role=roles/iam.serviceAccountTokenCreator",
    },
  },
};

export function generateMockFeedback(
  track: string = "Compute",
  difficulty: string = "BEGINNER"
): MockEvaluation {
  const trackKey = (track || "Compute") as Track;
  const diffKey = (difficulty || "BEGINNER") as Difficulty;

  // Get track data with proper type checking
  const trackDataMap = trackFeedback as Record<string, Record<string, any>>;
  const trackData =
    (trackKey in trackFeedback && trackDataMap[trackKey]?.[diffKey]) ||
    trackFeedback.Compute.BEGINNER;

  // Generate realistic score based on difficulty
  const baseScore =
    diffKey === "BEGINNER"
      ? Math.floor(Math.random() * 20 + 80)
      : diffKey === "INTERMEDIATE"
        ? Math.floor(Math.random() * 15 + 85)
        : Math.floor(Math.random() * 10 + 90);

  const status = baseScore >= 80 ? "PASSED" : baseScore >= 50 ? "PARTIAL" : "FAILED";
  const explanationScore = Math.max(baseScore - Math.random() * 15, 50);

  return {
    evaluation_id: `eval-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    session_id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    status,
    score: baseScore,
    explanation_score: Math.round(explanationScore),
    coach_feedback: {
      strengths: trackData.strengths,
      improvements: trackData.improvements,
      next_focus: trackData.nextFocus,
    },
    technical_skills: trackData.skills,
    recommendation: {
      track:
        diffKey === "BEGINNER"
          ? trackKey
          : diffKey === "INTERMEDIATE"
            ? "Advanced " + trackKey
            : "Expert " + trackKey,
      difficulty:
        diffKey === "BEGINNER"
          ? "INTERMEDIATE"
          : diffKey === "INTERMEDIATE"
            ? "ADVANCED"
            : "ADVANCED",
      reason:
        diffKey === "BEGINNER"
          ? `You've mastered basic ${trackKey.toLowerCase()} concepts. Ready for intermediate challenges to deepen your skills.`
          : diffKey === "INTERMEDIATE"
            ? `Excellent progress! You're ready for advanced ${trackKey.toLowerCase()} scenarios with complex multi-component architectures.`
            : `You're an expert! Consider exploring ${trackKey.toLowerCase()} at enterprise scale with advanced DevOps practices.`,
    },
    summary: trackData.summary,
    solution_description: trackData.solutionExample,
  };
}
