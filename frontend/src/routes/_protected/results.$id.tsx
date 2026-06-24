import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle, AlertCircle, TrendingUp } from "lucide-react";
import api from "../../api/apiService";

export const Route = createFileRoute("/_protected/results/$id")({
  head: () => ({ meta: [{ title: "Mission Results — CloudFlight" }] }),
  component: ResultsPage,
});

function ResultsPage() {
  const { id } = Route.useParams();
  const navigate = Route.useNavigate();
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getEvaluationResults(id).then((d) => { setResults(d); setLoading(false); });
  }, [id]);

  if (loading) {
    return <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-32 animate-pulse rounded-3xl bg-muted" />)}</div>;
  }

  const isPass = results?.outcome === "Pass";
  const score = results?.overallScore ?? 0;

  return (
    <div className="space-y-8">
      {/* Result banner */}
      <div className={`rounded-3xl p-10 text-white text-center ${isPass ? "bg-[#1a7f3c]" : "bg-[#b42318]"}`}>
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-white/20">
          {isPass ? <CheckCircle className="h-12 w-12" /> : <AlertCircle className="h-12 w-12" />}
        </div>
        <h1 className="font-display text-[clamp(2rem,5vw,3.5rem)] font-medium tracking-[-0.03em]">
          {isPass ? "Mission Passed!" : "Mission Failed"}
        </h1>
        <p className="mt-2 text-[16px] opacity-80">{results?.missionTitle}</p>
      </div>

      {/* Score cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "OVERALL SCORE", value: `${score}`, sub: "out of 100" },
          { label: "COMPLETION TIME", value: results?.completionTime, sub: "" },
          { label: "RESOURCES CREATED", value: String(results?.resources?.created), sub: `${results?.resources?.issues} issue(s)` },
          { label: "TASKS COMPLETED", value: `${results?.tasksCompleted}/${results?.tasksTotal}`, sub: "" },
        ].map((c) => (
          <div key={c.label} className="rounded-3xl border border-border bg-surface p-7 text-center">
            <div className="mono-label mb-3">{c.label}</div>
            <div className="font-display text-[2.2rem] font-medium leading-none tracking-[-0.03em] text-ink">{c.value}</div>
            {c.sub && <div className="mt-2 text-[13px] text-foreground">{c.sub}</div>}
          </div>
        ))}
      </div>

      {/* Score bar */}
      <div className="rounded-3xl border border-border bg-surface p-8">
        <div className="mono-label mb-4">SCORE BREAKDOWN</div>
        <div className="mb-3 flex items-baseline justify-between">
          <span className="font-display text-[3rem] font-medium leading-none tracking-[-0.03em] text-ink">{score}</span>
          <span className="text-[18px] text-foreground">/ 100</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all ${score >= 90 ? "bg-primary" : score >= 70 ? "bg-[#946200]" : "bg-[#b42318]"}`}
            style={{ width: `${score}%` }}
          />
        </div>
        <p className="mt-5 text-[14px] leading-relaxed text-foreground">{results?.feedback}</p>
      </div>

      {/* Strengths + improvements */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-border bg-surface p-8">
          <div className="mono-label mb-5">STRENGTHS</div>
          <ul className="space-y-3">
            {results?.evaluation?.strengths?.map((s: string, i: number) => (
              <li key={i} className="flex items-start gap-3 text-[14px]">
                <span className="mt-0.5 text-primary">✓</span>
                <span className="text-foreground">{s}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl border border-border bg-surface p-8">
          <div className="mono-label mb-5">AREAS TO IMPROVE</div>
          <ul className="space-y-3">
            {results?.evaluation?.improvements?.map((s: string, i: number) => (
              <li key={i} className="flex items-start gap-3 text-[14px]">
                <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="text-foreground">{s}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button onClick={() => navigate({ to: "/challenges" })} className="btn-primary flex-1 text-center">
          Next Mission
        </button>
        <button onClick={() => navigate({ to: "/history" })} className="btn-ghost flex-1 text-center">
          View History
        </button>
      </div>
    </div>
  );
}
