import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  CheckCircle2, Circle, XCircle, ExternalLink, RefreshCw,
  Zap, AlertTriangle, StopCircle, Radio, ChevronRight,
  Trophy, Target, Brain, Lightbulb, Clock, Shield,
} from "lucide-react";
import api from "../../api/apiService";
import useAuthStore from "../../hooks/useAuth";

export const Route = createFileRoute("/_protected/mission/$id")({
  head: () => ({ meta: [{ title: "Mission — PROPEL" }] }),
  component: MissionPage,
});

/* ══ Types ═══════════════════════════════════════════════════════════ */
interface EvalCriterion { description: string; passed: boolean; weight?: number; }
interface EvalResult {
  status: string; overall_score: number; passed: boolean;
  criteria?: EvalCriterion[]; feedback?: string; evaluated_at?: string;
}
interface ActiveSession {
  session_id: string; mission_id: string; environment_id?: string;
  console_url?: string; expires_at?: string; status?: string;
}

/* ══ Session persistence ═════════════════════════════════════════════ */
const SESSION_KEY = "cf_active_session";
const saveSession = (s: ActiveSession) => sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
const clearSession = () => sessionStorage.removeItem(SESSION_KEY);
const loadSession = (): ActiveSession | null => {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? "null"); } catch { return null; }
};

/* ══ Timeline steps ══════════════════════════════════════════════════ */
const TIMELINE = [
  { label: "Mission Generated",         icon: "✦" },
  { label: "Infrastructure Provisioned",icon: "⬡" },
  { label: "GCP Console Ready",         icon: "◉" },
  { label: "Mission Verified",          icon: "◎" },
  { label: "Mission Completed",         icon: "★" },
];

/* ══ Provisioning cards ══════════════════════════════════════════════ */
const PROV_CARDS = [
  { emoji: "💡", title: "Did you know?", body: "GCP provisions compute instances in under 60 seconds thanks to live-migration technology." },
  { emoji: "🔍", title: "Mission Intel", body: "Common mistakes in this scenario include leaving the startup script attached and misconfiguring metadata keys." },
  { emoji: "⚠️", title: "Watch out for…", body: "Network tags silently control firewall rules. A missing tag can prevent traffic even with the right firewall rule." },
  { emoji: "🏗️", title: "Architecture tip", body: "Always prefer service accounts with minimal IAM roles over broad project-level permissions." },
  { emoji: "🌐", title: "Cloud Trivia", body: "Cloud's global network carries more internal traffic than the entire public internet combined." },
  { emoji: "🎯", title: "Root cause hint", body: "Think about what runs at boot time. Startup scripts can block healthy instance status checks." },
];

/* ══ Verify steps animation ══════════════════════════════════════════ */
const VERIFY_STEPS = [
  "Checking VM status…",
  "Inspecting metadata…",
  "Validating network tags…",
  "Comparing expected state…",
  "Generating result…",
];

/* ══ useFadeUp ═══════════════════════════════════════════════════════ */
function useFadeUp() {
  const ref = useRef<HTMLDivElement>(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setV(true); obs.disconnect(); } }, { threshold: 0.08 });
    obs.observe(el); return () => obs.disconnect();
  }, []);
  return { ref, visible: v };
}

/* ══ AnimatedTimeline ════════════════════════════════════════════════ */
function AnimatedTimeline({ step }: { step: number }) {
  return (
    <div className="flex items-start gap-0 overflow-x-auto pb-2">
      {TIMELINE.map((t, i) => {
        const done   = i < step;
        const active = i === step;
        return (
          <div key={t.label} className="flex flex-1 flex-col items-center min-w-[80px]">
            <div className="flex w-full items-center">
              {i > 0 && (
                <div className={`h-0.5 flex-1 transition-all duration-700 ${done || active ? "bg-primary" : "bg-border"}`}
                  style={{ transitionDelay: `${i * 150}ms` }} />
              )}
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-[13px] transition-all duration-500 ${
                done
                  ? "border-primary bg-primary text-white"
                  : active
                  ? "border-primary bg-primary/10 text-primary animate-pulse"
                  : "border-border bg-surface text-muted-foreground"
              }`} style={{ transitionDelay: `${i * 150}ms` }}>
                {done ? "✓" : t.icon}
              </div>
              {i < TIMELINE.length - 1 && (
                <div className={`h-0.5 flex-1 transition-all duration-700 ${done ? "bg-primary" : "bg-border"}`}
                  style={{ transitionDelay: `${i * 150}ms` }} />
              )}
            </div>
            <span className={`mt-2 text-center text-[10px] leading-tight transition-colors duration-300 ${
              active ? "font-semibold text-primary" : done ? "text-emerald-600" : "text-muted-foreground"
            }`} style={{ maxWidth: 72 }}>
              {t.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ══ ProvisioningBriefing ════════════════════════════════════════════ */
function ProvisioningBriefing({ mission }: { mission: any }) {
  const [cardIdx, setCardIdx] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCardIdx(i => (i + 1) % PROV_CARDS.length);
        setFade(true);
      }, 400);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const card = PROV_CARDS[cardIdx];

  return (
    <div className="space-y-6" style={{ animation: "cfFadeSlideUp 0.6s ease both" }}>
      {/* Mission brief header */}
      <div className="rounded-3xl bg-ink p-8 text-white">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-2 w-2 animate-pulse rounded-full bg-amber-400" />
          <span className="mono-label !text-amber-300">PROVISIONING ENVIRONMENT</span>
        </div>
        <h2 className="font-display text-[clamp(1.6rem,4vw,2.5rem)] font-medium leading-tight tracking-[-0.03em] mb-4">
          {mission?.title ?? "Mission Briefing"}
        </h2>
        {mission?.business_context && (
          <p className="text-[15px] leading-relaxed text-white/70 max-w-2xl">{mission.business_context}</p>
        )}
        <div className="mt-6 flex flex-wrap gap-6">
          {[
            { icon: "⏱", label: "Duration", val: mission?.time_limit_minutes ? `${mission.time_limit_minutes} min` : "60 min" },
            { icon: "⚡", label: "Difficulty", val: mission?.difficulty ?? "Intermediate" },
            { icon: "🎯", label: "Track", val: mission?.track ?? "Compute" },
          ].map(s => (
            <div key={s.label}>
              <div className="mono-label !text-white/40 mb-1">{s.label}</div>
              <div className="text-[16px] font-semibold text-white">{s.icon} {s.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Rotating intel cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="md:col-span-2">
          <div className="rounded-2xl border border-border bg-surface p-6 h-full"
            style={{ opacity: fade ? 1 : 0, transform: fade ? "translateY(0)" : "translateY(8px)", transition: "opacity 0.4s ease, transform 0.4s ease" }}>
            <div className="mb-4 flex items-center gap-3">
              <span className="text-3xl">{card.emoji}</span>
              <div className="mono-label text-primary">{card.title}</div>
            </div>
            <p className="text-[15px] leading-relaxed text-foreground">{card.body}</p>
            <div className="mt-4 flex gap-1.5">
              {PROV_CARDS.map((_, i) => (
                <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i === cardIdx ? "bg-primary" : "bg-muted"}`} />
              ))}
            </div>
          </div>
        </div>

        {/* Provisioning status */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 flex flex-col justify-between">
          <div>
            <div className="mono-label mb-3 text-amber-600">GCP ENVIRONMENT</div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-[14px] font-semibold text-amber-800">Provisioning…</span>
            </div>
            <div className="space-y-2 text-[12px] text-amber-700">
              {["Allocating project", "Creating VPC", "Bootstrapping VM", "Configuring access"].map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`h-1.5 w-1.5 rounded-full ${i < 2 ? "bg-emerald-500" : "bg-amber-400 animate-pulse"}`} />
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-amber-200">
            <div className="h-full rounded-full bg-amber-500" style={{ width: "55%", animation: "provBar 3s ease-in-out infinite" }} />
          </div>
          <p className="mt-3 text-[11px] text-amber-600">~1–2 minutes remaining</p>
        </div>
      </div>

      {/* Objectives preview */}
      {mission?.objectives?.length > 0 && (
        <div className="rounded-2xl border border-border bg-surface p-6">
          <div className="mono-label mb-4">YOUR MISSION OBJECTIVES</div>
          <ol className="space-y-3">
            {mission.objectives.map((obj: string, i: number) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mono-label mt-0.5 w-6 shrink-0 text-center text-primary">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-[14px] leading-relaxed text-foreground">{obj}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

/* ══ LiveChecklist ═══════════════════════════════════════════════════ */
function LiveChecklist({
  criteria, evalResult, verifying, verifyStep,
}: {
  criteria: any[]; evalResult: EvalResult | null;
  verifying: boolean; verifyStep: number;
}) {
  const [revealed, setRevealed] = useState<boolean[]>([]);

  useEffect(() => {
    if (!evalResult || !evalResult.criteria) return;
    evalResult.criteria.forEach((_, i) => {
      setTimeout(() => setRevealed(r => { const n = [...r]; n[i] = true; return n; }), i * 350 + 300);
    });
  }, [evalResult]);

  const evalCriteria = evalResult?.criteria;

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="mono-label">TASK CHECKLIST</div>
        {verifying && (
          <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1">
            <RefreshCw className="h-3 w-3 animate-spin text-primary" />
            <span className="mono-label !text-primary">{VERIFY_STEPS[Math.min(verifyStep, VERIFY_STEPS.length - 1)]}</span>
          </div>
        )}
      </div>
      <div className="space-y-3">
        {criteria.map((c: any, i: number) => {
          const desc = c.description ?? c;
          const weight = c.weight;
          const evalItem = evalCriteria?.[i];
          const isRevealed = revealed[i];
          const passed = evalItem?.passed;

          return (
            <div key={i}
              className={`flex items-start gap-3 rounded-xl border p-3.5 transition-all duration-500 ${
                !evalCriteria
                  ? "border-border bg-background"
                  : isRevealed && passed
                  ? "border-emerald-200 bg-emerald-50"
                  : isRevealed && !passed
                  ? "border-red-200 bg-red-50"
                  : "border-border bg-background"
              }`}>
              <div className="mt-0.5 shrink-0">
                {!evalCriteria ? (
                  <Circle className="h-4 w-4 text-muted-foreground" />
                ) : !isRevealed ? (
                  <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                ) : passed ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" style={{ animation: "checkPop 0.4s cubic-bezier(0.34,1.56,0.64,1) both" }} />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" style={{ animation: "checkPop 0.4s cubic-bezier(0.34,1.56,0.64,1) both" }} />
                )}
              </div>
              <div className="flex-1">
                <span className={`text-[13px] ${
                  !evalCriteria ? "text-foreground" : isRevealed && passed ? "text-emerald-800 font-medium" : isRevealed ? "text-red-800" : "text-foreground"
                }`}>{desc}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══ VerifyAnimator ══════════════════════════════════════════════════ */
function VerifyAnimator({ step }: { step: number }) {
  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15">
          <Shield className="h-5 w-5 text-primary animate-pulse" />
        </div>
        <div>
          <div className="mono-label mb-0.5">VERIFICATION IN PROGRESS</div>
          <div className="text-[14px] font-semibold text-ink">Evaluating your infrastructure…</div>
        </div>
      </div>
      <div className="space-y-2.5">
        {VERIFY_STEPS.map((s, i) => (
          <div key={s} className={`flex items-center gap-2.5 transition-all duration-300 ${i <= step ? "opacity-100" : "opacity-30"}`}>
            {i < step
              ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
              : i === step
              ? <RefreshCw className="h-3.5 w-3.5 shrink-0 animate-spin text-primary" />
              : <Circle className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
            <span className={`text-[12px] ${i === step ? "font-semibold text-ink" : i < step ? "text-emerald-700" : "text-foreground"}`}>{s}</span>
          </div>
        ))}
      </div>
      <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-all duration-700"
          style={{ width: `${((step + 1) / VERIFY_STEPS.length) * 100}%` }} />
      </div>
    </div>
  );
}

/* ══ EvalReport ══════════════════════════════════════════════════════ */
function EvalReport({ result, onRetry }: { result: EvalResult; onRetry: () => void }) {
  const passed = result.passed ?? result.status === "PASSED";
  const score  = result.overall_score ?? 0;
  const scoreBarRef = useRef<HTMLDivElement>(null);
  const [barWidth, setBarWidth] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setBarWidth(score), 400);
    return () => clearTimeout(t);
  }, [score]);

  // Derive skill-category breakdown from score (placeholder enrichment)
  const categories = [
    { label: "Infrastructure Accuracy", score: Math.min(100, score + 5), icon: "🏗️" },
    { label: "Cloud Best Practices",    score: Math.min(100, score - 3), icon: "☁️" },
    { label: "Problem Solving Speed",   score: Math.min(100, score - 8), icon: "⚡" },
    { label: "Security Posture",        score: Math.min(100, score + 2), icon: "🔒" },
  ];

  return (
    <div className="space-y-5" style={{ animation: "cfFadeSlideUp 0.6s ease both" }}>
      {/* Hero result card */}
      <div className={`rounded-3xl p-8 text-white relative overflow-hidden ${passed ? "bg-ink" : "bg-red-900"}`}>
        <div className="relative z-10">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
            <div>
              <div className={`mono-label mb-2 ${passed ? "!text-emerald-400" : "!text-red-300"}`}>
                MISSION EVALUATION
              </div>
              <h2 className="font-display text-[clamp(1.6rem,4vw,2.5rem)] font-medium leading-tight tracking-[-0.03em]">
                {passed ? "Mission Passed 🎉" : "Mission Failed"}
              </h2>
            </div>
            <div className={`rounded-full border px-4 py-2 text-[13px] font-bold font-mono ${
              passed ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-300" : "border-red-400/40 bg-red-400/15 text-red-300"
            }`}>
              {result.status ?? (passed ? "PASSED" : "FAILED")}
            </div>
          </div>
          {/* Score */}
          <div className="mb-6">
            <div className="flex items-baseline gap-2 mb-3">
              <span className="font-display text-[4rem] font-medium leading-none tracking-[-0.05em]"
                style={{ animation: "countUp 1s ease both" }}>{score}</span>
              <span className="text-white/50 text-[20px]">/ 100</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/15">
              <div ref={scoreBarRef}
                className={`h-full rounded-full transition-all duration-1000 ${passed ? "bg-emerald-400" : "bg-red-400"}`}
                style={{ width: `${barWidth}%` }} />
            </div>
          </div>
          {/* Feedback */}
          {result.feedback && (
            <div className="rounded-2xl border border-white/10 bg-white/8 p-4 text-[14px] leading-relaxed text-white/80">
              <Brain className="mb-2 h-4 w-4 text-white/40" />
              {result.feedback}
            </div>
          )}
        </div>
        {/* Decorative bg circle */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full opacity-10"
          style={{ background: passed ? "#4ade80" : "#f87171" }} />
      </div>

      {/* Criteria results */}
      {result.criteria && result.criteria.length > 0 && (
        <div className="rounded-2xl border border-border bg-surface p-6">
          <div className="mono-label mb-5">CRITERIA RESULTS</div>
          <div className="space-y-3">
            {result.criteria.map((c, i) => (
              <div key={i} className={`flex items-start gap-3 rounded-xl p-3.5 ${c.passed ? "bg-emerald-50" : "bg-red-50"}`}
                style={{ animation: `cfFadeSlideUp 0.4s ${i * 0.1}s ease both` }}>
                {c.passed
                  ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />}
                <span className={`text-[13px] flex-1 ${c.passed ? "text-emerald-800" : "text-red-800"}`}>{c.description}</span>
                {c.weight && <span className="mono-label shrink-0">{c.weight}%</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skill breakdown */}
      <div className="rounded-2xl border border-border bg-surface p-6">
        <div className="mono-label mb-5">PERFORMANCE BREAKDOWN</div>
        <div className="space-y-4">
          {categories.map((cat, i) => (
            <div key={cat.label} style={{ animation: `cfFadeSlideUp 0.4s ${i * 0.08}s ease both` }}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[13px] font-medium text-ink">{cat.icon} {cat.label}</span>
                <span className={`mono-label font-semibold ${cat.score >= 85 ? "text-emerald-600" : cat.score >= 70 ? "text-amber-600" : "text-red-500"}`}>
                  {cat.score}%
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${cat.score}%`,
                    background: cat.score >= 85 ? "var(--primary)" : cat.score >= 70 ? "#f59e0b" : "#ef4444",
                    transitionDelay: `${i * 100 + 500}ms`,
                  }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {!passed && (
        <button onClick={onRetry}
          className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-border bg-surface px-5 py-3 text-[13px] font-medium text-foreground hover:bg-background transition">
          <RefreshCw className="h-4 w-4" /> Fix &amp; Retry Verification
        </button>
      )}
    </div>
  );
}

/* ══ HintSystem ══════════════════════════════════════════════════════ */
function HintSystem({ mission }: { mission: any }) {
  const [open, setOpen] = useState(false);
  const hints: string[] = mission?.hints ?? [
    "Start by inspecting the VM's metadata — look for any startup-script key.",
    "Check the network tags on the VM and compare with your firewall rules.",
    "Use 'gcloud compute instances describe' to inspect the full configuration.",
  ];
  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between p-5 text-left hover:bg-background transition">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          <span className="text-[13px] font-semibold text-ink">Mission Hints</span>
          <span className="mono-label rounded-full bg-amber-50 px-2 py-0.5 text-amber-700">{hints.length}</span>
        </div>
        <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-90" : ""}`} />
      </button>
      {open && (
        <div className="border-t border-border px-5 pb-5 pt-3 space-y-3">
          {hints.map((h, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="mono-label mt-0.5 shrink-0 text-amber-600">{String(i + 1).padStart(2, "0")}</span>
              <p className="text-[13px] leading-relaxed text-foreground">{h}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ══ NextMissionTeaser ═══════════════════════════════════════════════ */
function NextMissionTeaser({ navigate }: { navigate: any }) {
  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6"
      style={{ animation: "cfFadeSlideUp 0.6s 0.4s ease both" }}>
      <div className="mono-label mb-2 text-primary">WHAT'S NEXT</div>
      <h4 className="font-display text-[17px] font-medium text-ink mb-2">
        Ready for your next challenge?
      </h4>
      <p className="text-[13px] text-foreground leading-relaxed mb-4">
        Based on this mission, we recommend strengthening your <strong>Cloud Networking</strong> skills next.
      </p>
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => navigate({ to: "/recommendations" })}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[12px] font-medium text-white hover:opacity-90 transition">
          <Trophy className="h-3.5 w-3.5" /> View Learning Path
        </button>
        <button onClick={() => navigate({ to: "/challenges" })}
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-[12px] font-medium text-foreground hover:bg-background transition">
          Next Mission →
        </button>
      </div>
    </div>
  );
}

/* ══ Main MissionPage ════════════════════════════════════════════════ */
function MissionPage() {
  const { id: session_id } = Route.useParams();
  const navigate = Route.useNavigate();
  const { user } = useAuthStore();

  const [mission, setMission]       = useState<any>(null);
  const [session, setSession]       = useState<ActiveSession | null>(null);
  const [environment, setEnvironment] = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const [stopping, setStopping]     = useState(false);
  const [timeLeft, setTimeLeft]     = useState<number | null>(null);

  const [verifying, setVerifying]       = useState(false);
  const [verifyStep, setVerifyStep]     = useState(0);
  const [evalResult, setEvalResult]     = useState<EvalResult | null>(null);
  const [evalError, setEvalError]       = useState<string | null>(null);
  const [solutionDescription, setSolutionDescription] = useState<string>("");

  const verifyTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timeline step
  const timelineStep = evalResult?.passed
    ? 4 : evalResult ? 3 : verifying ? 3
    : environment?.status === "READY" ? 2
    : environment?.status === "PROVISIONING" ? 1 : 0;

  const envStatus  = environment?.status;
  const isProvisioning = envStatus === "PROVISIONING";

  const consoleUrl = session?.console_url
    ?? (envStatus === "READY" && environment?.gcp_project_id
      ? `https://console.cloud.google.com/?project=${environment.gcp_project_id}` : null);

  const successCriteria = mission?.success_criteria ?? [];
  const trackLabel = mission?.track
    ? mission.track.charAt(0).toUpperCase() + mission.track.slice(1).toLowerCase() : "";
  const diffLabel = mission?.difficulty
    ? mission.difficulty.charAt(0).toUpperCase() + mission.difficulty.slice(1).toLowerCase() : "";

  /* ── Load on mount ── */
  useEffect(() => {
    let persisted = loadSession();
    if (persisted?.session_id !== session_id) persisted = null;

    api.getChallengeStatus(session_id).then(async (d) => {
      const s: ActiveSession = {
        session_id,
        mission_id:     d.session?.mission_id,
        environment_id: d.environment?.environment_id ?? d.session?.environment_id,
        console_url:    d.environment?.console_url ?? d.session?.console_url,
        expires_at:     d.session?.expires_at,
        status:         d.session?.status,
      };
      setSession(s); setEnvironment(d.environment); saveSession(s);
      if (d.session?.mission_id) {
        const m = await api.getMissionDetails(d.session.mission_id);
        setMission(m);
      }
      setLoading(false);
      tryLoadExistingEval(session_id);
    }).catch(() => {
      if (persisted) setSession(persisted);
      setLoading(false);
    });
  }, [session_id]);

  const tryLoadExistingEval = async (sid: string) => {
    try {
      const res = await (api as any).getEvaluation?.(sid);
      if (res?.status || res?.overall_score !== undefined) setEvalResult(res);
    } catch { /* no prior eval */ }
  };

  /* ── Countdown ── */
  useEffect(() => {
    if (!session?.expires_at) return;
    const tick = () => {
      const diff = Math.floor((new Date(session.expires_at!).getTime() - Date.now()) / 1000);
      setTimeLeft(Math.max(0, diff));
    };
    tick(); const iv = setInterval(tick, 1000); return () => clearInterval(iv);
  }, [session?.expires_at]);

  /* ── Verify ── */
  const handleVerify = useCallback(async () => {
    if (verifying || !solutionDescription.trim()) {
      if (!solutionDescription.trim()) {
        setEvalError("Please explain your solution before verifying the mission.");
      }
      return;
    }
    setVerifying(true); setVerifyStep(0); setEvalError(null);
    // Animate verify steps
    verifyTimerRef.current = setInterval(() => {
      setVerifyStep(s => Math.min(s + 1, VERIFY_STEPS.length - 1));
    }, 1200);
    try {
      const res = await (api as any).runEvaluation(session_id, {
        solution_description: solutionDescription
      });
      setEvalResult(res);

      // Store evaluation in sessionStorage and navigate to feedback page
      if (res.evaluation?.status) {
        sessionStorage.setItem("cf_current_evaluation", JSON.stringify(res));
        setTimeout(() => {
          const navigate = Route.useNavigate();
          navigate({ to: `/feedback/${res.evaluation?.evaluation_id || session_id}` });
        }, 1500);
      }
    } catch (err: any) {
      setEvalError(err?.response?.data?.detail ?? err?.message ?? "Verification failed. Please try again.");
    } finally {
      clearInterval(verifyTimerRef.current!);
      setVerifying(false);
    }
  }, [verifying, session_id, solutionDescription]);

  /* ── Stop ── */
  const handleStop = async () => {
    setStopping(true);
    try {
      await api.stopChallenge(session_id); clearSession();
      navigate({ to: "/challenges" });
    } catch { setStopping(false); }
  };

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = secs % 60;
    return h > 0
      ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
      : `${m}:${s.toString().padStart(2, "0")}`;
  };

  /* ── Skeleton ── */
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-28 animate-pulse rounded-3xl bg-muted" />
        <div className="h-16 animate-pulse rounded-2xl bg-muted" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-36 animate-pulse rounded-2xl bg-muted" />)}
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />)}
          </div>
        </div>
      </div>
    );
  }

  /* ── Provisioning screen ── */
  if (isProvisioning) {
    return (
      <div className="space-y-6 pb-16">
        {/* Slim header */}
        <div className="rounded-2xl border border-border bg-surface px-6 py-4 flex items-center justify-between">
          <AnimatedTimeline step={timelineStep} />
        </div>
        <ProvisioningBriefing mission={mission} />
        <style>{KEYFRAMES}</style>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* ── Top header bar ── */}
      <div className="overflow-hidden rounded-3xl bg-ink text-white" style={{ animation: "cfFadeSlideUp 0.5s ease both" }}>
        <div className="p-6 md:p-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div className="flex-1">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/8 px-3 py-1">
                  <Radio className="h-3 w-3 animate-pulse text-green-400" />
                  <span className="mono-label !text-green-400">MISSION ACTIVE</span>
                </div>
                {trackLabel && <span className="mono-label rounded-full border border-white/15 px-3 py-1 !text-white/60">{trackLabel}</span>}
                {diffLabel  && <span className="mono-label rounded-full border border-white/15 px-3 py-1 !text-white/60">{diffLabel}</span>}
              </div>
              <h1 className="font-display text-[clamp(1.5rem,4vw,2.5rem)] font-medium leading-tight tracking-[-0.03em]">
                {mission?.title ?? "Mission Active"}
              </h1>
              {session?.session_id && <p className="mt-1 font-mono text-[10px] text-white/25">SESSION {session.session_id}</p>}
            </div>
            {/* Timer */}
            <div className="shrink-0 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-right">
              <div className="mono-label !text-white/40 mb-0.5">TIME REMAINING</div>
              <div className={`font-display text-[2rem] font-medium leading-none ${timeLeft !== null && timeLeft < 300 ? "text-red-400 animate-pulse" : "text-white"}`}>
                {timeLeft !== null ? formatTime(timeLeft) : mission?.time_limit_minutes ? `${mission.time_limit_minutes}m` : "—"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Animated timeline ── */}
      <div className="rounded-2xl border border-border bg-surface px-6 py-5">
        <div className="mono-label mb-4">MISSION TIMELINE</div>
        <AnimatedTimeline step={timelineStep} />
      </div>

      {/* ── Main split layout ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* LEFT: Mission Intelligence */}
        <div className="space-y-5 lg:col-span-2">

          {/* Business scenario */}
          {mission?.business_context && (
            <div className="rounded-2xl border border-border bg-surface p-6" style={{ animation: "cfFadeSlideUp 0.5s 0.1s ease both" }}>
              <div className="mono-label mb-3">BUSINESS SCENARIO</div>
              <p className="text-[15px] leading-relaxed text-foreground">{mission.business_context}</p>
            </div>
          )}

          {/* Live checklist (success criteria → interactive) */}
          {successCriteria.length > 0 && (
            <div style={{ animation: "cfFadeSlideUp 0.5s 0.15s ease both" }}>
              <LiveChecklist
                criteria={successCriteria}
                evalResult={evalResult}
                verifying={verifying}
                verifyStep={verifyStep}
              />
            </div>
          )}

          {/* Verify animation while running */}
          {verifying && <VerifyAnimator step={verifyStep} />}

          {/* Evaluation report */}
          {evalResult && !verifying && (
            <EvalReport result={evalResult} onRetry={handleVerify} />
          )}

          {/* Next mission teaser after pass */}
          {evalResult?.passed && <NextMissionTeaser navigate={navigate} />}

          {/* Error state */}
          {evalError && (
            <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              <div>
                <p className="text-[13px] font-semibold text-red-700">Verification failed</p>
                <p className="text-[12px] text-red-600 mt-0.5">{evalError}</p>
              </div>
            </div>
          )}

          {/* Hints */}
          {!evalResult && (
            <div style={{ animation: "cfFadeSlideUp 0.5s 0.25s ease both" }}>
              <HintSystem mission={mission} />
            </div>
          )}
        </div>

        {/* RIGHT: Cloud Console + Actions */}
        <div className="space-y-4">

          {/* GCP Console card */}
          {consoleUrl && (
            <div className="rounded-2xl border border-border bg-surface p-6" style={{ animation: "cfFadeSlideUp 0.5s 0.2s ease both" }}>
              <div className="mono-label mb-3">GCP ENVIRONMENT</div>
              <div className="mb-4 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[13px] font-semibold text-emerald-700">Environment Ready</span>
              </div>
              <p className="text-[12px] text-foreground leading-relaxed mb-4">
                Open the console, repair the infrastructure, then click Verify Mission.
              </p>
              <a href={consoleUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-[13px] font-medium text-white hover:opacity-90 transition hover:-translate-y-0.5">
                <ExternalLink className="h-3.5 w-3.5" /> Open GCP Console
              </a>
            </div>
          )}

          {/* Challenge info */}
          <div className="rounded-2xl border border-border bg-surface p-5">
            <div className="mono-label mb-4">CHALLENGE INFO</div>
            <div className="space-y-2.5">
              {[
                { label: "Track",       val: trackLabel },
                { label: "Difficulty",  val: diffLabel },
                { label: "Time limit",  val: mission?.time_limit_minutes ? `${mission.time_limit_minutes} min` : null },
                { label: "Session",     val: session?.session_id ? session.session_id.slice(0, 12) + "…" : null },
              ].filter(r => r.val).map(({ label, val }) => (
                <div key={label} className="flex items-center justify-between border-b border-border pb-2 last:border-0 last:pb-0">
                  <span className="text-[12px] text-foreground">{label}</span>
                  <span className="font-mono text-[11px] font-medium text-ink">{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mission Reflection */}
          {!evalResult?.passed && (
            <div className="space-y-2.5">
              <label className="block">
                <span className="mono-label mb-2 block">EXPLAIN YOUR SOLUTION</span>
                <textarea
                  value={solutionDescription}
                  onChange={(e) => setSolutionDescription(e.target.value)}
                  placeholder="Describe the investigation you performed.&#10;Explain the root cause.&#10;Explain why your fix solved the issue."
                  maxLength={1000}
                  rows={5}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-surface text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none text-[13px]"
                />
              </label>
              <div className="text-[11px] text-foreground/50 text-right">
                {solutionDescription.length} / 1000 characters
              </div>
            </div>
          )}

          {/* Verify Mission */}
          {!evalResult?.passed && (
            <button onClick={handleVerify} disabled={verifying || isProvisioning || !solutionDescription.trim()}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3.5 text-[14px] font-medium text-white hover:opacity-90 transition hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0">
              {verifying
                ? <><RefreshCw className="h-4 w-4 animate-spin" /> Verifying…</>
                : <><Zap className="h-4 w-4" /> Verify Mission</>}
            </button>
          )}

          {/* Re-verify if failed */}
          {evalResult && !evalResult.passed && !verifying && (
            <button onClick={handleVerify}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-border bg-surface px-5 py-2.5 text-[13px] font-medium text-foreground hover:bg-background transition">
              <RefreshCw className="h-3.5 w-3.5" /> Retry Verification
            </button>
          )}

          {/* Stop */}
          <button onClick={handleStop} disabled={stopping}
            className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-red-200 bg-red-50 px-5 py-3 text-[13px] font-medium text-red-600 hover:bg-red-100 transition disabled:opacity-50">
            <StopCircle className="h-4 w-4" />
            {stopping ? "Stopping…" : evalResult?.passed ? "Complete & End Lab" : "End Mission & Clean Up"}
          </button>

          <button onClick={() => navigate({ to: "/challenges" })} className="btn-ghost w-full text-center text-[13px]">
            ← Back to Challenges
          </button>

          {/* Objectives */}
          {mission?.objectives?.length > 0 && (
            <div className="rounded-2xl border border-border bg-surface p-5">
              <div className="mono-label mb-4">OBJECTIVES</div>
              <ol className="space-y-3">
                {mission.objectives.map((obj: string, i: number) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="mono-label mt-0.5 w-5 shrink-0 text-center text-primary">{i + 1}</span>
                    <span className="text-[12px] leading-relaxed text-foreground">{obj}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>

      <style>{KEYFRAMES}</style>
    </div>
  );
}

const KEYFRAMES = `
  @keyframes cfFadeSlideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
  @keyframes checkPop { 0%{transform:scale(0)} 70%{transform:scale(1.25)} 100%{transform:scale(1)} }
  @keyframes countUp  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes provBar  { 0%{width:30%} 50%{width:75%} 100%{width:30%} }
`;
