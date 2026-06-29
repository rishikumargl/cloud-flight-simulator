import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertCircle, ArrowRight } from "lucide-react";
import api from "../../api/apiService";
import { HistoryTimelineItem } from "../../components/History";

export const Route = createFileRoute("/_protected/history")({
  head: () => ({ meta: [{ title: "Learning Journal — PROPEL" }] }),
  component: HistoryPage,
});

interface HistoryMission {
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
}

interface ProgressData {
  recent_missions: HistoryMission[];
  stats: {
    total_missions: number;
    average_score: number;
  };
}

// Mock data for demonstration (fallback when API not yet implemented)
const MOCK_HISTORY: ProgressData = {
  recent_missions: [
    {
      mission_id: "mission-001",
      evaluation_id: "eval-001",
      title: "Configure Cloud Storage Buckets",
      track: "Storage",
      difficulty: "BEGINNER",
      score: 95,
      explanation_score: 92,
      status: "PASSED",
      summary: "Successfully created and configured GCS bucket with proper access controls and lifecycle policies.",
      completed_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      mission_id: "mission-002",
      evaluation_id: "eval-002",
      title: "Set Up IAM Roles and Permissions",
      track: "IAM",
      difficulty: "INTERMEDIATE",
      score: 87,
      explanation_score: 85,
      status: "PASSED",
      summary: "Created custom IAM roles with appropriate permissions, applied principle of least privilege effectively.",
      completed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      mission_id: "mission-003",
      evaluation_id: "eval-003",
      title: "Deploy Compute Engine Instance",
      track: "Compute",
      difficulty: "BEGINNER",
      score: 78,
      explanation_score: 72,
      status: "PARTIAL",
      summary: "Deployed instance successfully but missed some optional security hardening steps.",
      completed_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      mission_id: "mission-004",
      evaluation_id: "eval-004",
      title: "Configure VPC Network and Subnets",
      track: "Networking",
      difficulty: "INTERMEDIATE",
      score: 92,
      explanation_score: 89,
      status: "PASSED",
      summary: "Created VPC with multiple subnets, configured routing and firewall rules correctly.",
      completed_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
  stats: {
    total_missions: 4,
    average_score: 88,
  },
};

function HistoryPage() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoading(true);
        const result = await api.getProgress();
        if (result?.recent_missions && result.recent_missions.length > 0) {
          setProgress(result);
        } else {
          // Fallback to mock data if API returns empty
          setProgress(MOCK_HISTORY);
        }
      } catch (err: any) {
        console.error("Failed to load history:", err);
        // Use mock data as fallback
        setProgress(MOCK_HISTORY);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary mx-auto" />
          <p className="text-foreground/60">Loading your learning journal...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 mx-auto">
            <AlertCircle className="h-6 w-6 text-red-500" />
          </div>
          <h1 className="font-display text-2xl font-medium text-ink mb-2">
            Unable to Load History
          </h1>
          <p className="text-foreground/60 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[14px] font-medium text-white hover:opacity-90 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const missions = progress?.recent_missions || [];
  const stats = progress?.stats || { total_missions: 0, average_score: 0 };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-surface px-6 py-8">
        <div className="mx-auto w-full max-w-4xl">
          <button
            onClick={() => navigate({ to: "/dashboard" })}
            className="mb-4 inline-flex items-center gap-2 text-[13px] font-medium text-primary hover:opacity-70 transition"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
            Back to Dashboard
          </button>

          <h1 className="font-display text-3xl font-bold text-ink mb-2">
            Learning Journal
          </h1>
          <p className="text-[14px] text-foreground/60">
            Your complete mission history and progress.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto w-full max-w-4xl px-6 py-10 pb-20">
        {/* Stats Bar */}
        {stats.total_missions > 0 && (
          <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-surface p-4">
              <p className="text-[11px] font-semibold text-foreground/60 uppercase tracking-wider">
                Total Missions
              </p>
              <p className="text-2xl font-bold text-ink mt-1">{stats.total_missions}</p>
            </div>

            <div className="rounded-lg border border-border bg-surface p-4">
              <p className="text-[11px] font-semibold text-foreground/60 uppercase tracking-wider">
                Average Score
              </p>
              <p className="text-2xl font-bold text-ink mt-1">{Math.round(stats.average_score)}%</p>
            </div>

            <div className="rounded-lg border border-border bg-surface p-4">
              <p className="text-[11px] font-semibold text-foreground/60 uppercase tracking-wider">
                Pass Rate
              </p>
              <p className="text-2xl font-bold text-ink mt-1">
                {missions.filter((m) => m.status === "PASSED").length}/{missions.length}
              </p>
            </div>
          </div>
        )}

        {/* Timeline */}
        {missions.length > 0 ? (
          <div className="space-y-4">
            <h2 className="mono-label text-primary mb-6">MISSION TIMELINE</h2>

            <div className="space-y-4 relative before:absolute before:left-2 before:top-8 before:bottom-0 before:w-0.5 before:bg-gradient-to-b before:from-primary/20 before:to-transparent">
              {missions.map((mission) => (
                <HistoryTimelineItem
                  key={mission.mission_id}
                  evaluation_id={mission.evaluation_id}
                  mission_id={mission.mission_id}
                  title={mission.title}
                  track={mission.track}
                  difficulty={mission.difficulty}
                  score={mission.score}
                  explanation_score={mission.explanation_score}
                  status={mission.status}
                  summary={mission.summary}
                  completed_at={mission.completed_at}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-surface p-12 text-center">
            <AlertCircle className="h-12 w-12 text-foreground/30 mx-auto mb-4" />
            <h2 className="font-display text-lg font-semibold text-ink mb-2">
              No Missions Yet
            </h2>
            <p className="text-[13px] text-foreground/60 mb-6">
              Your completed missions will appear here. Start your first mission to begin your learning journey.
            </p>
            <button
              onClick={() => navigate({ to: "/challenges" })}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-[14px] font-medium text-white hover:opacity-90 transition"
            >
              Start Your First Mission
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
