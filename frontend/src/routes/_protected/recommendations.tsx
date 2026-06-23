import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Zap } from "lucide-react";
import api from "../../api/mockApi";

export const Route = createFileRoute("/_protected/recommendations")({
  head: () => ({ meta: [{ title: "Recommendations — CloudFlight" }] }),
  component: RecommendationsPage,
});

const DIFF_COLORS: Record<string, string> = {
  beginner: "text-[#1a7f3c] border-[#c3e6cb]",
  intermediate: "text-[#946200] border-[#ffc107]/40",
  advanced: "text-[#b42318] border-[#f5c6cb]",
};

const TRACK_ICONS: Record<string, string> = {
  compute: "⚙️", storage: "💾", networking: "🌐",
  security: "🔒", devops: "🚀", architecture: "🏗️",
};

const GAP_COLORS: Record<string, string> = {
  High: "text-[#b42318] bg-[#fde8e8]",
  Medium: "text-[#946200] bg-[#fff3cd]",
  Low: "text-[#1a7f3c] bg-[#e8f5ee]",
};

function RecommendationsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = Route.useNavigate();

  useEffect(() => {
    api.getRecommendations().then((d) => { setData(d); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-40 animate-pulse rounded-3xl bg-muted" />)}
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="overflow-hidden rounded-3xl bg-ink p-10 text-white">
        <div className="mono-label mb-4 !text-white/50">AI-POWERED</div>
        <h1 className="font-display text-[clamp(2rem,5vw,3.5rem)] font-medium leading-[1] tracking-[-0.03em]">
          Your personalised path.
        </h1>
        <p className="mt-3 max-w-xl text-[15px] text-white/70">
          Recommendations built from your mission history, speed, pass rate, and detected skill gaps.
        </p>
        <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[13px]">
          <span>Current level:</span>
          <span className="font-semibold">{data?.currentLevel}</span>
        </div>
      </div>

      {/* Suggested path */}
      <div>
        <div className="mono-label mb-2">SUGGESTED NEXT MISSIONS</div>
        <h2 className="font-display text-[26px] font-medium leading-tight tracking-[-0.02em] text-ink mb-6">
          What to tackle next.
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {data?.suggestedPath?.map((m: any, i: number) => (
            <div key={m.id} className="rounded-3xl border border-border bg-surface p-7">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-3xl">{TRACK_ICONS[m.track] || "📋"}</span>
                <div className="flex items-center gap-2">
                  <span className="mono-label text-primary">#{i + 1}</span>
                  <span className={`mono-label rounded-full border px-2.5 py-0.5 !text-[10px] ${DIFF_COLORS[m.difficulty] || ""}`}>
                    {m.difficulty.toUpperCase()}
                  </span>
                </div>
              </div>
              <h3 className="font-display text-[20px] font-semibold text-ink">{m.title}</h3>
              <p className="mt-3 text-[13px] leading-relaxed text-foreground">{m.reason}</p>
              <button
                onClick={() => navigate({ to: "/mission/$id", params: { id: m.id } })}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[13px] font-medium text-white hover:opacity-90"
              >
                <Zap className="h-3.5 w-3.5" /> Start Mission
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Skill gaps */}
      <div className="rounded-3xl border border-border bg-surface p-8">
        <div className="mono-label mb-5">SKILL GAP ANALYSIS</div>
        <div className="space-y-4">
          {data?.skillGaps?.map((g: any) => (
            <div key={g.skill} className="flex flex-col justify-between gap-3 border-b border-border pb-5 last:border-0 last:pb-0 md:flex-row md:items-center">
              <div>
                <div className="font-display text-[18px] font-semibold text-ink">{g.skill}</div>
                <div className="mt-1 text-[13px] text-foreground">{g.suggestion}</div>
              </div>
              <span className={`self-start rounded-full px-3 py-1 text-[11px] font-semibold md:self-auto ${GAP_COLORS[g.gap] || ""}`}>
                {g.gap} gap
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* AI insights */}
      <div>
        <div className="mono-label mb-5">AI INSIGHTS</div>
        <div className="space-y-4">
          {data?.insights?.map((insight: string, i: number) => (
            <div key={i} className="flex items-start gap-5 rounded-3xl border border-border bg-surface p-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <p className="text-[15px] leading-relaxed text-foreground">{insight}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
