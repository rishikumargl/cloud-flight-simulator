import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import api from "../../api/apiService";

export const Route = createFileRoute("/_protected/mission/$id")({
  head: () => ({ meta: [{ title: "Mission — CloudFlight" }] }),
  component: MissionPage,
});

function MissionPage() {
  const { id } = Route.useParams();
  const navigate = Route.useNavigate();
  const [mission, setMission] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMissionDetails(id).then((d) => { setMission(d); setLoading(false); });
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => <div key={i} className="h-40 animate-pulse rounded-3xl bg-muted" />)}
      </div>
    );
  }

  const trackLabel = mission?.track?.charAt(0).toUpperCase() + mission?.track?.slice(1);
  const diffLabel = mission?.difficulty?.charAt(0).toUpperCase() + mission?.difficulty?.slice(1);

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
            </div>
            <h1 className="font-display text-[clamp(1.8rem,4vw,3rem)] font-medium leading-tight tracking-[-0.03em]">
              {mission?.title}
            </h1>
          </div>
          <div className="shrink-0 text-right">
            <div className="mono-label !text-white/50">TIME LIMIT</div>
            <div className="font-display text-[2.5rem] font-medium leading-none text-white">{mission?.timeLimit}</div>
            <div className="mono-label !text-white/50">minutes</div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl border border-border bg-surface p-8">
            <div className="mono-label mb-4">BUSINESS SCENARIO</div>
            <p className="text-[15px] leading-relaxed text-foreground">{mission?.businessScenario}</p>
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
            <ul className="space-y-2">
              {mission?.successCriteria?.map((c: string, i: number) => (
                <li key={i} className="flex items-start gap-3 text-[14px] text-foreground">
                  <span className="mt-0.5 text-primary">✓</span>
                  {c}
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
              <div className="flex items-center justify-between">
                <span className="text-foreground">Time limit</span>
                <span className="font-medium text-ink">{mission?.timeLimit} min</span>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-surface p-7">
            <div className="mono-label mb-5">TASKS</div>
            <div className="space-y-3">
              {mission?.tasks?.map((t: any) => (
                <div key={t.id} className="flex items-start gap-3 text-[13px]">
                  <span className={`mt-0.5 ${t.completed ? "text-primary" : "text-muted-foreground"}`}>
                    {t.completed ? "✓" : "○"}
                  </span>
                  <span className={t.completed ? "text-ink" : "text-foreground"}>{t.title}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => navigate({ to: "/workspace/$id", params: { id } })}
              className="btn-primary w-full text-center"
            >
              Start Mission
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
