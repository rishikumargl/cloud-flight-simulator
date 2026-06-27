import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, BarChart3, Clock } from "lucide-react";

export const Route = createFileRoute("/_protected/admin/missions")({
  head: () => ({ meta: [{ title: "Mission Quality — Admin" }] }),
  component: MissionQuality,
});

function MissionQuality() {
  return (
    <div className="space-y-8 pb-16">
      <div style={{ animation: "cfFadeSlideUp 0.5s ease both" }}>
        <h1 className="font-display text-[28px] font-medium tracking-[-0.025em] text-ink mb-2">
          Mission Quality Dashboard
        </h1>
        <p className="text-[14px] text-foreground">
          Analyze AI-generated mission performance, failure patterns, and health metrics.
        </p>
      </div>

      {/* Coming soon placeholder */}
      <div className="rounded-2xl border border-border bg-surface p-12 text-center">
        <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-50 text-blue-600 mx-auto mb-4">
          <BarChart3 className="h-8 w-8" />
        </div>
        <h3 className="font-display text-[18px] font-medium text-ink mb-2">Coming Soon</h3>
        <p className="text-foreground text-[14px] mb-4">
          This page will show comprehensive mission quality metrics including average scores, failure rates,
          and health classification for every AI-generated mission.
        </p>
        <p className="text-[12px] text-foreground/60">
          Data will be populated as learners complete missions and evaluations accumulate.
        </p>
      </div>

      {/* Feature preview */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {[
          {
            icon: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
            label: "Success Metrics",
            desc: "Average score, completion rate, success criteria analysis",
          },
          {
            icon: <AlertTriangle className="h-5 w-5 text-amber-600" />,
            label: "Failure Analysis",
            desc: "Most common failures, retry frequency, repair patterns",
          },
          {
            icon: <BarChart3 className="h-5 w-5 text-blue-600" />,
            label: "Mission Health",
            desc: "Classified as Healthy, Needs Review, Too Easy, or Too Difficult",
          },
          {
            icon: <Clock className="h-5 w-5 text-purple-600" />,
            label: "Performance Trends",
            desc: "Completion time trends, difficulty progression analysis",
          },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-border bg-surface p-5">
            <div className="flex items-start gap-3">
              {item.icon}
              <div>
                <div className="font-medium text-ink mb-1">{item.label}</div>
                <p className="text-[12px] text-foreground">{item.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`@keyframes cfFadeSlideUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}
