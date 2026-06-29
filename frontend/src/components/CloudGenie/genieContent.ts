/**
 * Cloud Genie Content Library
 * All content for provisioning experience (no backend calls)
 */

export const PROVISION_STEPS = [
  { key: "scenario", label: "AI generated your mission" },
  { key: "reserve", label: "Allocating cloud resources" },
  { key: "compute", label: "Creating Compute Engine VM" },
  { key: "iam", label: "Configuring IAM permissions" },
  { key: "fault", label: "Injecting fault scenario" },
  { key: "startup", label: "Running startup script" },
  { key: "validate", label: "Validating environment" },
];

export const CLOUD_FACTS = [
  "Google runs millions of VMs every day across global data centers.",
  "The metadata server inside every VM lives at 169.254.169.254.",
  "A startup script executes automatically when a VM boots.",
  "Cloud Logging captures serial console output even if SSH fails.",
  "Compute Engine snapshots are incremental and highly efficient.",
  "Every Cloud Storage object is automatically replicated across zones.",
  "VMs can be paused and resumed to save compute costs.",
  "Preemptible VMs cost 60-90% less but can be interrupted.",
  "VM metadata is accessible without authentication.",
  "Custom machine types let you define exact CPU and memory.",
];

export const CLOUD_TIPS = [
  "Always check startup script logs in serial console.",
  "Use gcloud compute ssh for key management automation.",
  "Enable Cloud Monitoring before running production workloads.",
  "Custom metrics are cheaper than high-cardinality labels.",
  "Use --async for long-running operations.",
  "Snapshot frequently—incremental snapshots are fast.",
  "Tag resources by cost center for billing analysis.",
  "Use service accounts instead of user credentials in scripts.",
  "Preemptible VMs are perfect for fault-tolerant workloads.",
  "Cloud Assets API lets you track resource changes over time.",
];

export const INTERVIEW_QUESTIONS = [
  {
    q: "What's the difference between Preemptible and Standard VMs?",
    a: "Preemptible VMs cost 60-90% less but can be interrupted with 30s notice. Standard VMs are always available.",
  },
  {
    q: "Why do startup scripts sometimes fail?",
    a: "Common causes: missing dependencies, incorrect paths, or permissions. Check serial console for logs.",
  },
  {
    q: "How do you SSH into a VM without storing credentials?",
    a: "Use `gcloud compute ssh` which handles auth automatically via your cloud identity.",
  },
  {
    q: "What happens if you delete a snapshot?",
    a: "Later snapshots retain their incremental data. Deleting a snapshot just removes its delta.",
  },
  {
    q: "How can you make a VM more secure?",
    a: "Use service accounts, restrict IAM roles, enable OS Login, disable external IPs when possible.",
  },
  {
    q: "What's the maximum boot time for a VM?",
    a: "Usually 30-60 seconds depending on image size and startup scripts.",
  },
  {
    q: "How do you monitor a VM's performance?",
    a: "Use Cloud Monitoring, Agent for detailed metrics, or serial console for boot diagnostics.",
  },
  {
    q: "Can you change a VM's machine type?",
    a: "Yes, but only if the VM is stopped. Some machine types may not be available in your region.",
  },
];

export const QUIZ_QUESTIONS = [
  {
    question: "Which IP is reserved for the GCP Metadata Server?",
    options: ["8.8.8.8", "169.254.169.254", "10.0.0.1", "127.0.0.1"],
    answer: 1,
    explanation: "169.254.169.254 is the standard metadata server address in GCP.",
  },
  {
    question: "What percentage cheaper are Preemptible VMs?",
    options: ["20-30%", "40-50%", "60-90%", "More than 90%"],
    answer: 2,
    explanation: "Preemptible VMs cost 60-90% less but can be interrupted.",
  },
  {
    question: "How long does a startup script have to complete?",
    options: ["30 seconds", "2 minutes", "5 minutes", "Unlimited"],
    answer: 3,
    explanation: "Startup scripts can run indefinitely, but best practice is < 5 minutes.",
  },
  {
    question: "Which service auto-replicates data across zones?",
    options: ["Compute Engine", "Cloud Storage", "Cloud SQL", "Firestore"],
    answer: 1,
    explanation: "Cloud Storage automatically replicates objects across zones.",
  },
  {
    question: "What's the format of a startup script URL in metadata?",
    options: ["gs://bucket/script", "https://example.com/script", "file:///script", "All of the above"],
    answer: 3,
    explanation: "Startup scripts can be gs://, https://, or local paths.",
  },
];

export const BEHIND_THE_SCENES = [
  "I'm reserving a temporary sandbox in us-central1 just for you.",
  "I'm configuring IAM so only you can access this lab environment.",
  "I'm creating a Compute Engine instance with 2 vCPUs and 4GB RAM.",
  "I'm attaching a 20GB boot disk to your VM.",
  "I'm injecting today's challenge fault scenario.",
  "I'm configuring the startup script to initialize the environment.",
  "I'm setting up Cloud Logging to capture all activity.",
  "I'm validating health checks on the VM.",
  "I'm opening SSH access for you.",
  "I'm preparing your cloud environment for maximum learning.",
  "Everything is isolated from other learners' environments.",
  "I'm testing all infrastructure before handing it to you.",
];

export const DIFFICULTY_HINTS = {
  beginner: [
    "Read every objective carefully before opening SSH.",
    "Check startup script logs in the serial console.",
    "Use --help on any command you're unsure about.",
    "Take screenshots of errors before trying to fix them.",
    "Restart the VM if something seems stuck.",
  ],
  intermediate: [
    "Look for symptoms before jumping to solutions.",
    "Validate every assumption before changing config.",
    "Multiple errors often share one root cause.",
    "Check logs in chronological order.",
    "Use the metadata server to understand VM configuration.",
  ],
  advanced: [
    "Think like an SRE, not just a developer.",
    "Avoid making random changes—measure blast radius first.",
    "Use systematic troubleshooting: hypothesis → test → observe.",
    "Consider edge cases and failure modes.",
    "Optimize for operational simplicity, not just performance.",
  ],
};

export const ENCOURAGING_MESSAGES = [
  "Almost there...",
  "Your lab is nearly ready.",
  "Cloud resources are warming up.",
  "Building your playground...",
  "Preparing today's challenge...",
  "Just a few more seconds...",
  "Your environment is coming to life...",
  "Finalizing your cloud sandbox...",
  "Getting everything in place...",
  "Your mission awaits...",
];

export const MINI_CHALLENGES = [
  "Can you name three GCP services before your VM is ready?",
  "How many vCPUs does your VM have?",
  "Spot the odd one out: Cloud SQL, Cloud Storage, EC2, BigQuery",
  "Guess the boot time in seconds (usually 30-60)",
  "What's the metadata server IP? (Hint: starts with 169)",
];
