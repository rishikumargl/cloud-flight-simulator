import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, AlertCircle } from "lucide-react";
import api from "../../api/apiService";
import {
  MissionReportHeader,
  MissionSummaryCard,
  YourSolutionCard,
  ExplanationReviewCard,
  SkillBreakdownCard,
  MissionAnalyticsCard,
  RecommendationCard,
} from "../../components/FeedbackReport";

export const Route = createFileRoute("/_protected/feedback/$id")({
  head: () => ({ meta: [{ title: "Mission Report — PROPEL" }] }),
  component: FeedbackPage,
});

interface EvaluationData {
  evaluation?: {
    evaluation_id: string;
    session_id: string;
    status: "PASSED" | "PARTIAL" | "FAILED";
    score: number;
    explanation_score?: number;
    coach_feedback?: {
      strengths?: string[];
      improvements?: string[];
      next_focus?: string;
    };
    technical_skills?: Record<string, { proficiency: number }>;
    recommendation?: {
      track?: string;
      difficulty?: string;
      reason?: string;
    };
    summary?: string;
    solution_description?: string;
  };
  mission?: {
    mission_id: string;
    title: string;
    track: string;
    difficulty: string;
    business_context?: string;
  };
  session?: {
    session_id: string;
    started_at?: string;
    completed_at?: string;
  };
  analytics?: {
    completion_time_minutes?: number;
    expected_time_minutes?: number;
    time_efficiency?: number;
  };
}

function FeedbackPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();

  const [evaluation, setEvaluation] = useState<EvaluationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  // Load evaluation data
  useEffect(() => {
    const loadEvaluation = async () => {
      try {
        // First, try to load from sessionStorage (fresh evaluation from mission page)
        const cached = sessionStorage.getItem("cf_current_evaluation");
        if (cached) {
          const parsedData = JSON.parse(cached);
          setEvaluation(parsedData);
          sessionStorage.removeItem("cf_current_evaluation");
          setLoading(false);
          return;
        }

        // Fallback: Try to load from API using session_id (id is the session_id from URL)
        const result = await (api as any).getEvaluation(id);
        if (result?.evaluation) {
          // Normalize the response to match our expected format
          setEvaluation({
            evaluation: result,
            analytics: {},
          });
        } else if (result) {
          setEvaluation(result);
        } else {
          setError("Evaluation not found");
        }
      } catch (err: any) {
        setError(
          err?.response?.data?.detail ?? err?.message ?? "Failed to load evaluation"
        );
      } finally {
        setLoading(false);
      }
    };

    loadEvaluation();
  }, [id]);

  const handleStartRecommended = async () => {
    if (!evaluation?.recommendation?.track) return;

    setStarting(true);
    try {
      const scenario = await api.generateScenario(
        evaluation.recommendation.track,
        evaluation.recommendation.difficulty || "BEGINNER"
      );

      if (scenario?.mission_id) {
        // Navigate to challenges page with auto-start
        navigate({
          to: "/challenges",
          search: { autoStart: scenario.mission_id },
        });
      }
    } catch (err) {
      console.error("Failed to start recommended mission:", err);
    } finally {
      setStarting(false);
    }
  };

  const handleReturnDashboard = () => {
    navigate({ to: "/dashboard" });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary mx-auto" />
          <p className="text-foreground/60">Loading your mission report...</p>
        </div>
      </div>
    );
  }

  if (error || !evaluation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 mx-auto">
            <AlertCircle className="h-6 w-6 text-red-500" />
          </div>
          <h1 className="font-display text-2xl font-medium text-ink mb-2">
            Report Not Found
          </h1>
          <p className="text-foreground/60 mb-6">{error}</p>
          <button
            onClick={() => navigate({ to: "/dashboard" })}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[14px] font-medium text-white hover:opacity-90 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Extract data from evaluation response (handle both nested and flat formats)
  const evalData = evaluation.evaluation || evaluation;
  const analyticsData = evaluation.analytics || {};
  const criteriaResults = evalData.criteria
    ? {
        passed: evalData.criteria.filter((c: any) => c.passed).length,
        failed: evalData.criteria.filter((c: any) => !c.passed).length,
      }
    : undefined;

  return (
    <div className="min-h-screen bg-background">
      {/* Header with back button */}
      <div className="border-b border-border bg-surface px-6 py-4">
        <div className="mx-auto w-full max-w-4xl">
          <button
            onClick={() => navigate({ to: "/dashboard" })}
            className="mb-4 inline-flex items-center gap-2 text-[13px] font-medium text-primary hover:opacity-70 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto w-full max-w-4xl space-y-8 px-6 py-10 pb-20">
        {/* 1. Mission Result */}
        <MissionReportHeader
          status={evalData.status}
          score={evalData.score}
          title={evaluation?.mission?.title || "Mission"}
          difficulty={evaluation?.mission?.difficulty || "Challenge"}
          track={evaluation?.mission?.track || "General"}
          completionTimeMinutes={analyticsData.completion_time_minutes}
          completedAt={evaluation?.session?.completed_at || new Date().toISOString()}
        />

        {/* 2. Mission Debrief */}
        {evalData.summary && (
          <MissionSummaryCard summary={evalData.summary} />
        )}

        {/* 3. Your Solution */}
        {evalData.solution_description && (
          <YourSolutionCard solution={evalData.solution_description} />
        )}

        {/* 4. AI Review */}
        {evalData.coach_feedback && (
          <ExplanationReviewCard
            score={evalData.explanation_score || 0}
            feedback={evalData.coach_feedback}
          />
        )}

        {/* 5. Technical Skills */}
        {evalData.technical_skills && Object.keys(evalData.technical_skills).length > 0 && (
          <SkillBreakdownCard skills={evalData.technical_skills} />
        )}

        {/* 6. Mission Analytics */}
        <MissionAnalyticsCard
          analytics={analyticsData}
          evaluationScore={evalData.score}
          explanationScore={evalData.explanation_score}
          criteriaResults={criteriaResults}
        />

        {/* 7. Recommended Next Mission */}
        {evalData.recommendation && (
          <RecommendationCard
            recommendation={evalData.recommendation}
            onStartRecommended={handleStartRecommended}
            onReturnDashboard={handleReturnDashboard}
            isLoading={starting}
          />
        )}

        {/* Fallback: No recommendation */}
        {!evalData.recommendation && (
          <div className="rounded-2xl border border-border bg-surface p-8 text-center">
            <p className="text-foreground/60 mb-4">Ready for your next challenge?</p>
            <button
              onClick={handleReturnDashboard}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-[14px] font-medium text-white hover:opacity-90 transition"
            >
              Return to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
