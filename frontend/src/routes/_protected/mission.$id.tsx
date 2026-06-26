import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import api from "../../api/apiService";

export const Route = createFileRoute("/_protected/mission/$id")({
  head: () => ({ meta: [{ title: "Mission — CloudFlight" }] }),
  component: MissionPage,
});

function MissionPage() {
  // $id is the session_id (returned by startChallenge)
  const { id: session_id } = Route.useParams();
  const navigate = Route.useNavigate();
  const [mission, setMission] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [environment, setEnvironment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stopping, setStopping] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);

  useEffect(() => {
    // Step 1: get challenge status → gives us mission_id + environment
    api.getChallengeStatus(session_id).then(async (statusData) => {
      setSession(statusData.session);
      setEnvironment(statusData.environment);
      const mission_id = statusData.session?.mission_id;
      if (mission_id) {
        // Step 2: get actual mission details
        const missionData = await api.getMissionDetails(mission_id);
        setMission(missionData);
      }
      setLoading(false);
    }).catch((err) => {
      console.error("Failed to load mission:", err);
      setLoading(false);
    });
  }, [session_id]);

  // Countdown timer
  useEffect(() => {
    if (!session?.expires_at) return;
    const tick = () => {
      const diff = Math.floor((new Date(session.expires_at).getTime() - Date.now()) / 1000);
      setTimeLeft(Math.max(0, diff));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [session?.expires_at]);

  const handleStop = async () => {
    setStopping(true);
    try {
      await api.stopChallenge(session_id);
      navigate({ to: "/challenges" });
    } catch (err) {
      console.error("Failed to stop challenge:", err);
      setStopping(false);
    }
  };

  const handleVerifyMission = async () => {
    setEvaluating(true);
    setEvaluationError(null);
    try {
      const result = await api.runEvaluation(session_id);
      setEvaluation(result);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error?.message ||
                       err?.message ||
                       "Failed to evaluate mission";
      setEvaluationError(errorMsg);
      console.error("Failed to verify mission:", err);
    } finally {
      setEvaluating(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-3xl bg-muted" />
        ))}
      </div>
    );
  }

  if (!mission) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-center">
          <p className="text-foreground">Could not load mission details.</p>
          <button onClick={() => navigate({ to: "/challenges" })} className="btn-ghost mt-4">
            Back to Challenges
          </button>
        </div>
      </div>
    );
  }

  const trackLabel = mission?.track?.charAt(0).toUpperCase() + mission?.track?.slice(1).toLowerCase();
  const diffLabel = mission?.difficulty?.charAt(0).toUpperCase() + mission?.difficulty?.slice(1).toLowerCase();
  const timeLimit = mission?.time_limit_minutes;
  const businessContext = mission?.business_context;
  const successCriteria = mission?.success_criteria ?? [];
  const envStatus = environment?.status;
  const gcpProjectId = environment?.gcp_project_id;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="overflow-hidden rounded-3xl bg-ink p-10 text-white">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <span className="mono-label rounded-full border border-white/20 bg-white/10 px-3 py-1 !text-white/70">
                {trackLabel}
              </span>
              <span className="mono-label rounded-full border border-white/20 bg-white/10 px-3 py-1 !text-white/70">
                {diffLabel}
              </span>
              {envStatus && (
                <span className={`mono-label rounded-full border px-3 py-1 ${
                  envStatus === "READY"
                    ? "border-green-500/30 bg-green-500/10 !text-green-300"
                    : envStatus === "PROVISIONING"
                    ? "border-yellow-500/30 bg-yellow-500/10 !text-yellow-300"
                    : "border-white/20 bg-white/10 !text-white/70"
                }`}>
                  {envStatus}
                </span>
              )}
            </div>
            <h1 className="font-display text-[clamp(1.8rem,4vw,3rem)] font-medium leading-tight tracking-[-0.03em]">
              {mission?.title}
            </h1>
          </div>
          <div className="shrink-0 text-right">
            <div className="mono-label !text-white/50">TIME REMAINING</div>
            <div className={`font-display text-[2.5rem] font-medium leading-none ${
              timeLeft !== null && timeLeft < 300 ? "text-red-400" : "text-white"
            }`}>
              {timeLeft !== null ? formatTime(timeLeft) : `${timeLimit} min`}
            </div>
            <div className="mono-label !text-white/50">
              {timeLeft !== null ? "remaining" : "time limit"}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl border border-border bg-surface p-8">
            <div className="mono-label mb-4">BUSINESS SCENARIO</div>
            <p className="text-[15px] leading-relaxed text-foreground">{businessContext}</p>
          </div>

          <div className="rounded-3xl border border-border bg-surface p-8">
            <div className="mono-label mb-5">MISSION OBJECTIVES</div>
            <ol className="space-y-3">
              {mission?.objectives?.map((obj: string, i: number) => (
                <li key={i} className="flex items-start gap-4">
                  <span className="mono-label mt-0.5 w-6 shrink-0 text-center text-primary">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[15px] text-foreground">{obj}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-3xl border border-border bg-surface p-8">
            <div className="mono-label mb-5">SUCCESS CRITERIA</div>
            <ul className="space-y-3">
              {successCriteria.map((c: any, i: number) => (
                <li key={i} className="flex items-start gap-3 text-[14px] text-foreground">
                  <span className="mt-0.5 text-primary">✓</span>
                  <div>
                    <span>{c.description ?? c}</span>
                    {c.weight && (
                      <span className="ml-2 mono-label text-[11px]">{c.weight}%</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-border bg-surface p-7">
            <div className="mono-label mb-5">CHALLENGE INFO</div>
            <div className="space-y-4 text-[14px]">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="text-foreground">Track</span>
                <span className="font-medium text-ink">{trackLabel}</span>
              </div>
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="text-foreground">Difficulty</span>
                <span className="font-medium text-ink">{diffLabel}</span>
              </div>
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="text-foreground">Time limit</span>
                <span className="font-medium text-ink">{timeLimit} min</span>
              </div>
              {gcpProjectId && (
                <div className="flex items-center justify-between">
                  <span className="text-foreground">GCP Project</span>
                  <span className="font-medium text-ink font-mono text-[12px]">{gcpProjectId}</span>
                </div>
              )}
            </div>
          </div>

          {/* GCP Console link */}
          {envStatus === "READY" && (
            <div className="rounded-3xl border border-border bg-surface p-7">
              <div className="mono-label mb-4">GCP LAB ENVIRONMENT</div>
              <p className="text-[13px] text-foreground mb-4">
                Your live GCP environment is ready. Open the Google Cloud Console to complete the mission objectives.
              </p>
              <a
                href={`https://console.cloud.google.com/?project=${gcpProjectId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-[14px] font-medium text-white hover:opacity-90 transition"
              >
                Open GCP Console ↗
              </a>
            </div>
          )}

          {envStatus === "PROVISIONING" && (
            <div className="rounded-3xl border border-yellow-200 bg-yellow-50 p-7">
              <div className="mono-label mb-3 text-yellow-700">PROVISIONING</div>
              <p className="text-[13px] text-yellow-800">Your GCP environment is being set up. This usually takes 1–2 minutes.</p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-yellow-200">
                <div className="h-full w-1/2 animate-pulse rounded-full bg-yellow-500" />
              </div>
            </div>
          )}

          {envStatus === "READY" && !evaluation && (
            <button
              onClick={handleVerifyMission}
              disabled={evaluating}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-green-600 px-5 py-3 text-[14px] font-medium text-white hover:bg-green-700 transition disabled:opacity-50"
            >
              {evaluating ? "Verifying..." : "Verify Mission"}
            </button>
          )}

          {evaluationError && (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-7">
              <div className="mono-label mb-3 text-red-700">EVALUATION ERROR</div>
              <p className="text-[13px] text-red-800">{evaluationError}</p>
              <button
                onClick={handleVerifyMission}
                disabled={evaluating}
                className="mt-4 w-full inline-flex items-center justify-center rounded-full bg-red-600 px-4 py-2 text-[13px] font-medium text-white hover:bg-red-700 transition disabled:opacity-50"
              >
                {evaluating ? "Retrying..." : "Retry Evaluation"}
              </button>
            </div>
          )}

          {evaluation && (
            <div className={`rounded-3xl border p-7 ${
              evaluation.status === "PASSED"
                ? "border-green-200 bg-green-50"
                : evaluation.status === "PARTIAL"
                ? "border-yellow-200 bg-yellow-50"
                : "border-red-200 bg-red-50"
            }`}>
              <div className={`mono-label mb-3 ${
                evaluation.status === "PASSED"
                  ? "text-green-700"
                  : evaluation.status === "PARTIAL"
                  ? "text-yellow-700"
                  : "text-red-700"
              }`}>
                EVALUATION RESULT
              </div>
              <div className={`text-3xl font-bold font-display mb-2 ${
                evaluation.status === "PASSED"
                  ? "text-green-600"
                  : evaluation.status === "PARTIAL"
                  ? "text-yellow-600"
                  : "text-red-600"
              }`}>
                {evaluation.status}
              </div>
              <div className={`text-2xl font-bold mb-4 ${
                evaluation.status === "PASSED"
                  ? "text-green-700"
                  : evaluation.status === "PARTIAL"
                  ? "text-yellow-700"
                  : "text-red-700"
              }`}>
                {evaluation.score}%
              </div>
              {evaluation.deterministic_checks && (
                <div className="text-[13px] space-y-2">
                  {evaluation.deterministic_checks.passed && evaluation.deterministic_checks.passed.length > 0 && (
                    <div>
                      <div className="font-medium text-green-700 mb-1">Passed ({evaluation.deterministic_checks.passed.length}):</div>
                      <ul className="space-y-1 ml-3">
                        {evaluation.deterministic_checks.passed.map((check: any, i: number) => (
                          <li key={i} className="text-green-700">✓ {check.details || `Criterion ${check.criterion_id}`}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {evaluation.deterministic_checks.failed && evaluation.deterministic_checks.failed.length > 0 && (
                    <div>
                      <div className="font-medium text-red-700 mb-1 mt-3">Failed ({evaluation.deterministic_checks.failed.length}):</div>
                      <ul className="space-y-1 ml-3">
                        {evaluation.deterministic_checks.failed.map((check: any, i: number) => (
                          <li key={i} className="text-red-700">✗ {check.details || `Criterion ${check.criterion_id}`}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              <p className="text-[12px] text-foreground mt-3">
                Evaluated: {new Date(evaluation.evaluated_at).toLocaleString()}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleStop}
              disabled={stopping}
              className="w-full inline-flex items-center justify-center rounded-full border border-red-200 bg-red-50 px-5 py-3 text-[14px] font-medium text-red-600 hover:bg-red-100 transition disabled:opacity-50"
            >
              {stopping ? "Stopping..." : "End Mission & Clean Up"}
            </button>
            <button
              onClick={() => navigate({ to: "/challenges" })}
              className="btn-ghost w-full text-center"
            >
              Back to Challenges
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
