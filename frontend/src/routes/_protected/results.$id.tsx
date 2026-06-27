import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, XCircle, TrendingUp, AlertTriangle, ArrowRight, RotateCcw } from "lucide-react";
import { mockEvaluationResults } from "../../data/mockData";
import api from "../../api/apiService";

export const Route = createFileRoute("/_protected/results/$id")({
  head: () => ({ meta: [{ title: "Mission Results — PROPEL" }] }),
  component: ResultsPage,
});

function useFadeUp() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.1 });
    obs.observe(el); return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function ResultsPage() {
  const { id } = Route.useParams();
  const navigate = Route.useNavigate();
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // Try real evaluation endpoint first
        const data = await (api as any).getEvaluation?.(id);
        setResults(data ?? mockEvaluationResults);
      } catch {
        // Fallback to mock
        setResults(mockEvaluationResults);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const headerRef = useFadeUp();
  const cardsRef  = useFadeUp();
  const mainRef   = useFadeUp();

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(4)].map((_, i) => <div key={i} className="h-32 animate-pulse rounded-3xl bg-muted" />)}
      </div>
    );
  }

  const isPass  = results?.outcome === "Pass" || results?.passed === true;
  const score   = results?.overallScore ?? results?.overall_score ?? 0;
  const strengths    = results?.evaluation?.strengths ?? results?.strengths ?? [];
  const mistakes     = results?.evaluation?.mistakes ?? results?.mistakes ?? [];
  const improvements = results?.evaluation?.improvements ?? results?.improvements ?? [];
  const criteria     = results?.criteria ?? [];

  return (
    <div className="space-y-8 pb-16">

      {/* ── Result banner ── */}
      <div ref={headerRef.ref}
        className={`overflow-hidden rounded-3xl p-10 text-white text-center transition-all duration-700 ${headerRef.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"} ${isPass ? "bg-ink" : "bg-[#b42318]"}`}>
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-white/10">
          {isPass
            ? <CheckCircle2 className="h-12 w-12 text-emerald-400" />
            : <XCircle className="h-12 w-12 text-red-300" />}
        </div>
        <h1 className="font-display text-[clamp(2rem,5vw,3.5rem)] font-medium leading-[1] tracking-[-0.03em]">
          {isPass ? "Mission Passed!" : "Mission Failed"}
        </h1>
        {results?.missionTitle && (
          <p className="mt-3 text-[16px] opacity-70">{results.missionTitle}</p>
        )}
        {/* Score ring */}
        <div className="mx-auto mt-8 flex h-28 w-28 flex-col items-center justify-center rounded-full border-4 border-white/20 bg-white/10">
          <span className="font-display text-[2.2rem] font-medium leading-none">{score}</span>
          <span className="mono-label !text-white/50">/ 100</span>
        </div>
      </div>

      {/* ── 4 stat cards ── */}
      <div ref={cardsRef.ref} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "OVERALL SCORE", value: `${score}`, sub: "out of 100" },
          { label: "COMPLETION TIME", value: results?.completionTime ?? "—", sub: "" },
          { label: "RESOURCES CREATED", value: String(results?.resources?.created ?? "—"), sub: `${results?.resources?.issues ?? 0} issue(s)` },
          { label: "TASKS COMPLETED", value: `${results?.tasksCompleted ?? "—"}/${results?.tasksTotal ?? "—"}`, sub: "" },
        ].map((c, i) => (
          <div key={c.label}
            className={`rounded-2xl border border-border bg-surface p-6 text-center transition-all duration-700 ${cardsRef.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            style={{ transitionDelay: `${i * 80}ms` }}>
            <div className="mono-label mb-2">{c.label}</div>
            <div className="font-display text-[2.2rem] font-medium leading-none tracking-[-0.04em] text-ink">{c.value}</div>
            {c.sub && <div className="mt-2 text-[12px] text-foreground">{c.sub}</div>}
          </div>
        ))}
      </div>

      {/* ── Score bar ── */}
      <div className="rounded-2xl border border-border bg-surface p-7">
        <div className="mono-label mb-4">SCORE BREAKDOWN</div>
        <div className="mb-3 flex items-baseline justify-between">
          <span className="font-display text-[3rem] font-medium leading-none tracking-[-0.04em] text-ink">{score}</span>
          <span className="text-[18px] text-foreground">/ 100</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-muted">
          <div className={`h-full rounded-full transition-all duration-1000 ${score >= 90 ? "bg-primary" : score >= 70 ? "bg-amber-500" : "bg-red-500"}`}
            style={{ width: `${score}%` }} />
        </div>
        {results?.feedback && (
          <p className="mt-5 text-[14px] leading-relaxed text-foreground">{results.feedback}</p>
        )}
      </div>

      {/* ── Main content ── */}
      <div ref={mainRef.ref} className={`grid grid-cols-1 gap-6 lg:grid-cols-3 transition-all duration-700 ${mainRef.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
        <div className="space-y-6 lg:col-span-2">

          {/* Criteria list (from real eval) */}
          {criteria.length > 0 && (
            <div className="rounded-2xl border border-border bg-surface p-7">
              <div className="mono-label mb-5">EVALUATION CRITERIA</div>
              <div className="space-y-3">
                {criteria.map((c: any, i: number) => (
                  <div key={i} className="flex items-start gap-3">
                    {c.passed
                      ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />}
                    <span className={`text-[14px] ${c.passed ? "text-ink" : "text-foreground"}`}>{c.description}</span>
                    {c.weight && <span className="ml-auto mono-label shrink-0">{c.weight}%</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strengths + mistakes + improvements */}
          <div className="rounded-2xl border border-border bg-surface p-7">
            <div className="mono-label mb-5">EVALUATION SUMMARY</div>
            {strengths.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <h3 className="font-display text-[15px] font-semibold text-ink">Strengths</h3>
                </div>
                <ul className="space-y-2">
                  {strengths.map((s: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 text-[14px] text-foreground">
                      <span className="mt-0.5 text-emerald-500 shrink-0">✓</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {mistakes.length > 0 && (
              <div className="mb-6 rounded-xl bg-amber-50 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <h3 className="font-display text-[15px] font-semibold text-ink">Mistakes Identified</h3>
                </div>
                <ul className="space-y-2">
                  {mistakes.map((m: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 text-[14px] text-amber-800">
                      <span className="mt-0.5 shrink-0">⚠</span>
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {improvements.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <h3 className="font-display text-[15px] font-semibold text-ink">Areas for Improvement</h3>
                </div>
                <ul className="space-y-2">
                  {improvements.map((imp: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 rounded-lg bg-surface px-3 py-2 text-[14px] text-foreground">
                      <span className="text-primary shrink-0">💡</span>
                      <span>{imp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* AI Feedback */}
          {results?.feedback && (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
              <div className="mono-label mb-2 text-primary">AI FEEDBACK</div>
              <p className="text-[14px] leading-relaxed text-foreground">{results.feedback}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Resource breakdown */}
          {results?.resources && (
            <div className="rounded-2xl border border-border bg-surface p-6">
              <div className="mono-label mb-4">RESOURCE BREAKDOWN</div>
              {[
                { label: "Created", value: results.resources.created, color: "text-emerald-600" },
                { label: "Configured", value: results.resources.configured, color: "text-primary" },
                { label: "Issues Found", value: results.resources.issues, color: "text-red-500" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between border-b border-border py-2.5 last:border-0">
                  <span className="text-[13px] text-foreground">{label}</span>
                  <span className={`font-display text-[1.4rem] font-medium ${color}`}>{value ?? "—"}</span>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <button onClick={() => navigate({ to: "/challenges" })}
              className="btn-primary w-full inline-flex items-center justify-center gap-2">
              Next Mission <ArrowRight className="h-4 w-4" />
            </button>
            <Link to="/recommendations"
              className="btn-ghost w-full inline-flex items-center justify-center gap-2 text-[14px]">
              View Recommendations
            </Link>
            <Link to="/history"
              className="block w-full rounded-full border border-border py-2.5 text-center text-[13px] font-medium text-foreground hover:bg-background transition">
              <RotateCcw className="inline h-3.5 w-3.5 mr-1.5" />
              View History
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
