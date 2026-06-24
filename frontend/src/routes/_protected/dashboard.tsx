import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Zap } from "lucide-react";
import api from "../../api/apiService";
import { learningTracks, trackRows } from "../../data/mockData";
import useAuthStore from "../../hooks/useAuth";

export const Route = createFileRoute("/_protected/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — CloudFlight" }] }),
  component: Dashboard,
});

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-3xl border border-border bg-surface p-7">
      <div className="mono-label text-foreground">{label}</div>
      <div className="mt-4 font-display text-[clamp(2rem,4vw,3rem)] font-medium leading-none tracking-[-0.03em] text-ink">
        {value}
      </div>
      {sub && <div className="mt-2 text-[13px] text-foreground">{sub}</div>}
    </div>
  );
}

function TrackProgress({ name, completed, total, avg }: { name: string; completed: number; total: number; avg: number }) {
  const pct = Math.round((completed / total) * 100);
  return (
    <div className="border-t border-border py-5">
      <div className="flex items-baseline justify-between">
        <div className="font-display text-[16px] font-semibold text-ink">{name}</div>
        <div className="mono-label">{completed}/{total} · AVG {avg}</div>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Dashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = Route.useNavigate();

  useEffect(() => {
    Promise.all([api.getDashboardStats(), api.getRecentActivities()]).then(([s, a]) => {
      setStats(s);
      setActivities(a);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-3xl bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-3xl bg-ink p-10 text-white">
        <div className="absolute right-10 top-1/2 -translate-y-1/2 text-7xl opacity-20">🏗️</div>
        <div className="mono-label mb-4 !text-white/50">FEATURED MISSION</div>
        <h2 className="font-display text-[clamp(1.8rem,4vw,3rem)] font-medium leading-tight tracking-[-0.03em]">
          Cloud Architecture Mastery
        </h2>
        <p className="mt-3 max-w-lg text-[15px] text-white/70">
          Design and deploy scalable cloud infrastructure. Complete real-world scenarios and earn your architecture badge.
        </p>
        <button
          onClick={() => navigate({ to: "/challenges" })}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-[14px] font-medium text-white hover:opacity-90"
        >
          <Zap className="h-4 w-4" /> Start Mission
        </button>
      </div>

      {/* Welcome + progress */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-3xl border border-border bg-surface p-8">
          <h2 className="font-display text-[24px] font-medium text-ink">
            Welcome back{user ? `, ${user.name.split(" ")[0]}` : ""}
          </h2>
          <p className="mt-2 text-[15px] text-foreground">Continue your cloud learning journey. Your next mission awaits.</p>
        </div>
        <div className="rounded-3xl border border-border bg-surface p-7">
          <div className="mono-label mb-4">YOUR PROGRESS</div>
          <div className="space-y-3 text-[14px]">
            <div className="flex items-center justify-between">
              <span className="text-foreground">Missions completed</span>
              <span className="font-semibold text-ink">{stats?.totalChallengesCompleted}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-foreground">Success rate</span>
              <span className="font-semibold text-primary">{stats?.successRate?.toFixed(0)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-foreground">Current level</span>
              <span className="font-semibold text-ink">{stats?.currentSkillLevel}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="MISSIONS COMPLETED" value={String(stats?.totalChallengesCompleted)} sub="+2 this week" />
        <StatCard label="SUCCESS RATE" value={`${stats?.successRate?.toFixed(0)}%`} sub="↑ 5% this month" />
        <StatCard label="SKILL LEVEL" value={stats?.currentSkillLevel} sub="Intermediate Pilot" />
        <StatCard label="LEARNING STREAK" value="12" sub="days active 🔥" />
      </div>

      {/* Tracks grid + recent activity */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <div className="mono-label mb-2">PROGRESS BY TRACK</div>
          <h2 className="font-display text-[26px] font-medium leading-tight tracking-[-0.02em] text-ink">
            Six tracks, one rubric.
          </h2>
          <div className="mt-6">
            {trackRows.map((r) => (
              <TrackProgress key={r.key} name={r.name} completed={r.completed} total={r.total} avg={r.avg} />
            ))}
          </div>
        </div>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="mono-label mb-1">TRENDING MISSIONS</div>
              <h2 className="font-display text-[26px] font-medium leading-tight tracking-[-0.02em] text-ink">
                Popular challenges.
              </h2>
            </div>
            <button
              onClick={() => navigate({ to: "/challenges" })}
              className="mono-label inline-flex items-center gap-1 hover:text-primary"
            >
              VIEW ALL <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="space-y-3">
            {learningTracks.slice(0, 4).map((t) => (
              <button
                key={t.id}
                onClick={() => navigate({ to: "/challenges" })}
                className="group flex w-full items-center gap-4 rounded-2xl border border-border bg-surface p-5 text-left transition hover:border-primary/40 hover:bg-background"
              >
                <span className="text-2xl">{t.icon}</span>
                <div className="flex-1">
                  <div className="font-display text-[16px] font-semibold text-ink">{t.name}</div>
                  <div className="mt-0.5 text-[13px] text-foreground">{t.description}</div>
                </div>
                <ArrowRight className="h-4 w-4 text-foreground opacity-0 transition group-hover:opacity-100" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div>
        <div className="mono-label mb-6">RECENT ACTIVITY</div>
        <div className="overflow-hidden rounded-3xl border border-border bg-surface">
          {activities.map((a, i) => (
            <div
              key={a.id}
              className={`flex items-start gap-4 px-7 py-5 ${i < activities.length - 1 ? "border-b border-border" : ""}`}
            >
              <span className="mt-0.5 text-xl">{a.icon}</span>
              <div className="flex-1">
                <p className="text-[14px] font-medium text-ink">{a.title}</p>
                <p className="mt-0.5 text-[13px] text-foreground">{a.description}</p>
              </div>
              <span className="mono-label shrink-0">{a.timestamp}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
