import { createFileRoute } from "@tanstack/react-router";
import { TrendingUp, Users, Target, Zap } from "lucide-react";

export const Route = createFileRoute("/_protected/admin/learners")({
  head: () => ({ meta: [{ title: "Learner Intelligence — Admin" }] }),
  component: LearnerIntelligence,
});

function LearnerIntelligence() {
  return (
    <div className="space-y-8 pb-16">
      <div style={{ animation: "cfFadeSlideUp 0.5s ease both" }}>
        <h1 className="font-display text-[28px] font-medium tracking-[-0.025em] text-ink mb-2">
          Learner Intelligence
        </h1>
        <p className="text-[14px] text-foreground">
          Track learner progress, identify struggling learners, and monitor skill development.
        </p>
      </div>

      {/* Coming soon placeholder */}
      <div className="rounded-2xl border border-border bg-surface p-12 text-center">
        <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-50 text-blue-600 mx-auto mb-4">
          <Users className="h-8 w-8" />
        </div>
        <h3 className="font-display text-[18px] font-medium text-ink mb-2">Coming Soon</h3>
        <p className="text-foreground text-[14px] mb-4">
          This page will display detailed learner profiles including skill levels, learning velocity,
          completion rates, and personalized improvement recommendations.
        </p>
        <p className="text-[12px] text-foreground/60">
          Data will be aggregated from learner evaluation histories and progress endpoints.
        </p>
      </div>

      {/* Feature preview */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {[
          {
            icon: <Target className="h-5 w-5 text-primary" />,
            label: "Skill Proficiency",
            desc: "Current level, progress trend, recommended difficulty",
          },
          {
            icon: <TrendingUp className="h-5 w-5 text-emerald-600" />,
            label: "Learning Velocity",
            desc: "Improvement rate, completion frequency, engagement metrics",
          },
          {
            icon: <Zap className="h-5 w-5 text-amber-600" />,
            label: "Strongest Skills",
            desc: "Top performing areas, expert domains, mastery indicators",
          },
          {
            icon: <Users className="h-5 w-5 text-blue-600" />,
            label: "Peer Comparison",
            desc: "Performance benchmarks, learning cohorts, achievement badges",
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
