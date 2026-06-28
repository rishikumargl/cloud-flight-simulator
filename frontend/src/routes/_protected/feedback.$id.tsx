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
  CriteriaDetailsCard,
  RecommendationCard,
} from "../../components/FeedbackReport";
import { calculateDuration, calculateEfficiency } from "../../utils/feedbackUtils";
import { generateMockFeedback } from "../../utils/mockFeedbackGenerator";

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
    technical_skills?: Record<string, { weight?: number; proficiency: number }>;
    recommendation?: {
      track?: string;
      difficulty?: string;
      reason?: string;
    };
    summary?: string;
    solution_description?: string;
    criteria?: Array<{ passed: boolean; description?: string }>;
    deterministic_checks?: {
      passed: Array<any>;
      failed: Array<{ criterion_id: string; passed: boolean; details: string; weight: number }>;
    };
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
  // Also support flat format (when evaluation data is at root level)
  evaluation_id?: string;
  status?: "PASSED" | "PARTIAL" | "FAILED";
  score?: number;
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
  criteria?: Array<{ passed: boolean; description?: string }>;
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

        // Second: Try to load from API using session_id (id is the session_id from URL)
        try {
          const result = await (api as any).getEvaluation(id);

          // Handle API response structure: {"success": true, "data": {...}}
          let evalResponse = result?.data || result;

          if (evalResponse?.evaluation) {
            // API returned nested structure with evaluation, mission, session
            setEvaluation({
              evaluation: evalResponse.evaluation,
              mission: evalResponse.mission,
              session: evalResponse.session,
              analytics: evalResponse.analytics || {},
            });
          } else if (evalResponse) {
            setEvaluation(evalResponse);
          } else {
            throw new Error("No evaluation data");
          }
        } catch (apiErr: any) {
          // Fallback: Generate realistic mock feedback for demo
          console.warn("API evaluation not found, using mock feedback for demo");
          const mockEval = generateMockFeedback("Compute", "BEGINNER");
          setEvaluation({
            evaluation: mockEval,
            mission: {
              mission_id: `mission-${id}`,
              title: "Configure Cloud Infrastructure",
              track: "Compute",
              difficulty: "BEGINNER",
              business_context: "Deploy and secure a basic cloud environment",
            },
            session: {
              session_id: id,
              started_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
              completed_at: new Date().toISOString(),
            },
            analytics: {},
          });
        }
      } catch (err: any) {
        console.error("Failed to load evaluation:", err);
        // Last resort: Use minimal mock data
        const mockEval = generateMockFeedback("Compute", "BEGINNER");
        setEvaluation({
          evaluation: mockEval,
          mission: {
            mission_id: `mission-${id}`,
            title: "Configure Cloud Infrastructure",
            track: "Compute",
            difficulty: "BEGINNER",
            business_context: "Deploy and secure a basic cloud environment",
          },
          session: {
            session_id: id,
            started_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
            completed_at: new Date().toISOString(),
          },
          analytics: {},
        });
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

  // Support both criteria and deterministic_checks formats
  let criteriaResults;
  if (evalData.criteria) {
    criteriaResults = {
      passed: evalData.criteria.filter((c: any) => c.passed).length,
      failed: evalData.criteria.filter((c: any) => !c.passed).length,
    };
  } else if (evalData.deterministic_checks) {
    criteriaResults = {
      passed: evalData.deterministic_checks.passed?.length || 0,
      failed: evalData.deterministic_checks.failed?.length || 0,
    };
  }

  // Ensure status is valid (fallback to PARTIAL if undefined)
  const status = evalData.status && ["PASSED", "PARTIAL", "FAILED"].includes(evalData.status)
    ? evalData.status
    : "PARTIAL";

  // Derive analytics from session times if not provided
  const derivedDuration = calculateDuration(
    evaluation?.session?.started_at,
    evaluation?.session?.completed_at
  );
  const completionTime = analyticsData.completion_time_minutes || derivedDuration;

  const derivedEfficiency = calculateEfficiency(
    completionTime,
    analyticsData.expected_time_minutes
  );
  const efficiency = derivedEfficiency ?? analyticsData.time_efficiency;

  const enrichedAnalytics: typeof analyticsData = {
    ...analyticsData,
    completion_time_minutes: completionTime ?? undefined,
    time_efficiency: efficiency ?? undefined,
  };

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
          status={status}
          score={evalData.score || 0}
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
          analytics={enrichedAnalytics}
          evaluationScore={evalData.score || 0}
          explanationScore={evalData.explanation_score}
          criteriaResults={criteriaResults}
        />

        {/* 6.5. Detailed Criteria Results */}
        {evalData.deterministic_checks && (
          evalData.deterministic_checks.passed.length > 0 ||
          evalData.deterministic_checks.failed.length > 0
        ) && (
          <CriteriaDetailsCard
            passed={evalData.deterministic_checks.passed || []}
            failed={evalData.deterministic_checks.failed || []}
          />
        )}

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
