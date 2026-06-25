import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight, Zap, TrendingUp, AlertTriangle,
  Target, Clock, ChevronRight, CheckCircle2,
} from "lucide-react";
import {
  mockDashboardStats, mockRecentActivities,
  trackRows, mockProgressChartData, mockRecommendations,
} from "../../data/mockData";
import useAuthStore from "../../hooks/useAuth";

export const Route = createFileRoute("/_protected/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — CloudFlight" }] }),
  component: Dashboard,
});

/* ─── animation helpers ────────────────────────────────────────────────────── */
function useCountUp(target: number, duration = 900, delay = 0) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf: number;
    const t = setTimeout(() => {
      let start: number | null = null;
      function tick(ts: number) {
        if (!start) start = ts;
        const p = Math.min((ts - start) / duration, 1);
        setV(Math.round((1 - Math.pow(1 - p, 3)) * target));
        if (p < 1) raf = requestAnimationFrame(tick);
      }
      raf = requestAnimationFrame(tick);
    }, delay);
    return () => { clearTimeout(t); cancelAnimationFrame(raf); };
  }, [target, duration, delay]);
  return v;
}

function useFadeUp(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

/* ─── Sparkline ────────────────────────────────────────────────────────────── */
function Sparkline({ data, color = "var(--primary)" }: { data: number[]; color?: string }) {
  const max = Math.max(...data), min = Math.min(...data), rng = max - min || 1;
  const W = 72, H = 28;
  const pts = data.map((v, i) =>
    `${(i / (data.length - 1)) * W},${H - ((v - min) / rng) * (H - 6) - 3}`
  ).join(" ");
  const lx = W, ly = H - ((data[data.length - 1] - min) / rng) * (H - 6) - 3;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none">
      <polyline points={pts} stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lx} cy={ly} r="3" fill={color} />
    </svg>
  );
}

/* ─── Skill ring (animated on mount) ──────────────────────────────────────── */
function SkillRing({ pct, label, color, delay = 0, visible }: {
  pct: number; label: string; color: string; delay?: number; visible: boolean;
}) {
  const r = 20, circ = 2 * Math.PI * r;
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => setDrawn(true), delay);
    return () => clearTimeout(t);
  }, [visible, delay]);
  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg width="50" height="50" viewBox="0 0 50 50">
        <circle cx="25" cy="25" r={r} stroke="var(--muted)" strokeWidth="3.5" fill="none" />
        <circle cx="25" cy="25" r={r} stroke={color} strokeWidth="3.5" fill="none"
          strokeDasharray={`${drawn ? (pct / 100) * circ : 0} ${circ}`}
          strokeLinecap="round" transform="rotate(-90 25 25)"
          style={{ transition: `stroke-dasharray 1s cubic-bezier(0.34,1.56,0.64,1) ${delay}ms` }}
        />
        <text x="25" y="29" textAnchor="middle" fontSize="10" fontWeight="600"
          fill="var(--ink)" fontFamily="var(--font-display)">{pct}</text>
      </svg>
      <span style={{
        fontFamily: "var(--font-mono)", fontSize: "0.48rem", letterSpacing: "0.05em",
        textTransform: "uppercase", color: "var(--muted-foreground)", textAlign: "center", lineHeight: 1.2,
      }}>{label}</span>
    </div>
  );
}

/* ─── Metric action card ───────────────────────────────────────────────────── */
function ActionCard({ icon, label, value, delta, deltaPositive, action, actionHref, urgency, delay = 0, visible }: {
  icon: React.ReactNode; label: string; value: string; delta?: string;
  deltaPositive?: boolean; action: string; actionHref: string;
  urgency?: "high" | "medium"; delay?: number; visible: boolean;
}) {
  const border = urgency === "high"
    ? "border-l-[3px] border-l-red-400 border-y border-r border-border"
    : urgency === "medium"
    ? "border-l-[3px] border-l-amber-400 border-y border-r border-border"
    : "border border-border";
  return (
    <div className={`flex flex-col justify-between rounded-2xl bg-surface p-5 transition-all duration-600 ${border} ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      style={{ transitionDelay: `${delay}ms`, minHeight: 148 }}>
      <div className="flex items-start justify-between">
        <div className="rounded-xl bg-background p-2 text-primary">{icon}</div>
        {delta && (
          <span className={`rounded-full px-2 py-0.5 font-mono text-[0.58rem] ${deltaPositive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
            {delta}
          </span>
        )}
      </div>
      <div className="mt-3">
        <div className="mono-label mb-0.5">{label}</div>
        <div className="font-display text-[1.85rem] font-medium leading-none tracking-[-0.03em] text-ink">{value}</div>
      </div>
      <Link to={actionHref as any}
        className="mt-4 inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:opacity-70 transition-opacity">
        {action} <ChevronRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

/* ─── Animated gap bar ─────────────────────────────────────────────────────── */
function GapBar({ skill, current, previous, target = 90, delay = 0, visible }: {
  skill: string; current: number; previous: number; target?: number; delay?: number; visible: boolean;
}) {
  const [filled, setFilled] = useState(false);
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => setFilled(true), delay + 200);
    return () => clearTimeout(t);
  }, [visible, delay]);
  const gained = current - previous;
  const remaining = Math.max(target - current, 0);
  const barColor = current >= target ? "var(--primary)" : current >= 80 ? "#f59e0b" : "#ef4444";
  return (
    <div className="border-t border-border py-3.5 first:border-t-0">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-[13px] font-medium text-ink">{skill}</span>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[0.58rem] text-emerald-600 uppercase">+{gained} pts</span>
          <span className="mono-label">{current}%</span>
        </div>
      </div>
      <div className="relative h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="absolute left-0 top-0 h-full rounded-full bg-muted-foreground/20 transition-all duration-700"
          style={{ width: filled ? `${previous}%` : "0%", transitionDelay: `${delay}ms` }} />
        <div className="absolute left-0 top-0 h-full rounded-full transition-all duration-1000"
          style={{ width: filled ? `${current}%` : "0%", background: barColor, transitionDelay: `${delay + 100}ms` }} />
        <div className="absolute top-[-2px] h-[10px] w-[1.5px] bg-ink/25" style={{ left: `${target}%` }} />
      </div>
      {remaining > 0 && (
        <div className="mt-1.5 flex items-center gap-1 text-[10px] text-foreground">
          <Target className="h-2.5 w-2.5" /> {remaining}% to proficiency target
        </div>
      )}
    </div>
  );
}

/* ─── Track completion row ─────────────────────────────────────────────────── */
function TrackRow({ name, completed, total, avg, delay = 0, visible }: {
  name: string; completed: number; total: number; avg: number; delay?: number; visible: boolean;
}) {
  const [filled, setFilled] = useState(false);
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => setFilled(true), delay + 150);
    return () => clearTimeout(t);
  }, [visible, delay]);
  const pct = Math.round((completed / total) * 100);
  const barColor = avg >= 88 ? "var(--primary)" : avg >= 80 ? "#f59e0b" : "#ef4444";
  const avgColor = avg >= 88 ? "text-emerald-600" : avg >= 80 ? "text-amber-500" : "text-red-500";
  return (
    <div className="flex items-center gap-3 border-t border-border py-3 first:border-t-0">
      <div className="w-[88px] shrink-0 text-[12px] font-medium text-ink">{name}</div>
      <div className="flex-1">
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full transition-all duration-1000"
            style={{ width: filled ? `${pct}%` : "0%", background: barColor, transitionDelay: `${delay}ms` }} />
        </div>
      </div>
      <div className="mono-label w-[52px] shrink-0 text-right">{completed}/{total}</div>
      <div className={`mono-label w-[44px] shrink-0 text-right ${avgColor}`}>{avg}%</div>
      <div className="w-3 shrink-0 text-center text-[10px]">
        {avg >= 88 ? <span className="text-emerald-500">↑</span> : avg >= 80 ? <span className="text-amber-500">→</span> : <span className="text-red-500">↓</span>}
      </div>
    </div>
  );
}

/* ─── Momentum bar chart ───────────────────────────────────────────────────── */
function MomentumBars({ data, visible }: { data: { month: string; rate: number }[]; visible: boolean }) {
  const [grown, setGrown] = useState(false);
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => setGrown(true), 300);
    return () => clearTimeout(t);
  }, [visible]);
  const max = Math.max(...data.map((d) => d.rate));
  return (
    <div className="mt-3 flex h-14 items-end gap-1.5">
      {data.map((d, i) => {
        const isLast = i === data.length - 1;
        const h = grown ? Math.round((d.rate / max) * 48) : 0;
        return (
          <div key={d.month} className="flex flex-1 flex-col items-center gap-1">
            <div className="w-full rounded-t-sm transition-all duration-700"
              style={{ height: `${h}px`, background: isLast ? "var(--primary)" : "var(--muted)", transitionDelay: `${i * 60}ms` }} />
            <span style={{
              fontFamily: "var(--font-mono)", fontSize: "0.45rem",
              color: isLast ? "var(--primary)" : "var(--muted-foreground)",
              fontWeight: isLast ? 600 : 400,
            }}>{d.month[0]}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── AI recommendation card ───────────────────────────────────────────────── */
function RecommendCard({ mission, reason, idx, delay = 0, visible }: {
  mission: any; reason: string; idx: number; delay?: number; visible: boolean;
}) {
  const diffStyle = mission.difficulty === "advanced"
    ? "bg-red-50 text-red-600"
    : mission.difficulty === "intermediate"
    ? "bg-amber-50 text-amber-600"
    : "bg-emerald-50 text-emerald-700";
  return (
    <Link to="/challenges"
      className={`group flex items-start gap-3 rounded-xl border border-border bg-surface p-4 transition-all duration-500 hover:border-primary/40 hover:bg-background ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
      style={{ transitionDelay: `${delay}ms` }}>
      <div style={{
        fontFamily: "var(--font-mono)", fontSize: "0.9rem", color: "var(--primary)",
        width: 20, flexShrink: 0, paddingTop: 1, fontWeight: 600,
      }}>{idx + 1}</div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] font-semibold text-ink">{mission.title}</span>
          <span className={`rounded-full px-2 py-0.5 font-mono text-[0.52rem] uppercase ${diffStyle}`}>
            {mission.difficulty}
          </span>
        </div>
        <p className="mt-0.5 text-[11px] leading-snug text-foreground">{reason}</p>
      </div>
      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-foreground opacity-0 transition group-hover:opacity-100" />
    </Link>
  );
}

/* ─── Main Dashboard component ─────────────────────────────────────────────── */
function Dashboard() {
  const { user } = useAuthStore();
  const navigate = Route.useNavigate();

  // Always use mock data — API placeholders return zeros
  const stats     = mockDashboardStats;
  const activities = mockRecentActivities;
  const recs       = mockRecommendations;
  const chart      = mockProgressChartData;

  const firstName   = user?.name?.split(" ")[0] ?? "there";
  const weakTracks  = trackRows.filter((t) => t.avg < 82);

  // Animated counters
  const countCompleted    = useCountUp(stats.totalChallengesCompleted, 800, 350);
  const countSuccessRate  = useCountUp(Math.round(stats.successRate),  900, 450);

  // Scroll-triggered sections
  const cardsRef   = useFadeUp();
  const gapRef     = useFadeUp();
  const momentRef  = useFadeUp();
  const ringsRef   = useFadeUp();
  const trackRef   = useFadeUp();
  const recRef     = useFadeUp();
  const actRef     = useFadeUp();

  return (
    <div className="space-y-8 pb-16">

      {/* ── Greeting ──────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
        style={{ animation: "cfFadeSlideUp 0.55s ease both" }}>
        <div>
          <h1 className="font-display text-[28px] font-medium tracking-[-0.025em] text-ink">
            Morning, {firstName} 👋
          </h1>
          <p className="mt-1 text-[14px] text-foreground">
            You have{" "}
            <span className="font-semibold text-red-600">
              {weakTracks.length} skill{weakTracks.length !== 1 ? "s" : ""} below proficiency target.
            </span>{" "}
            Here's where to focus.
          </p>
        </div>
        <button
          onClick={() => navigate({ to: "/challenges" })}
          className="inline-flex items-center gap-2 self-start rounded-full bg-primary px-5 py-2.5 text-[13px] font-medium text-white transition-all hover:-translate-y-0.5 hover:opacity-90"
          style={{ animation: "cfFadeSlideUp 0.55s 0.1s ease both" }}
        >
          <Zap className="h-3.5 w-3.5" /> Start next mission
        </button>
      </div>

      {/* ── 4 action metric cards ──────────────────────────────── */}
      <div ref={cardsRef.ref} className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ActionCard icon={<TrendingUp className="h-4 w-4" />}    label="SUCCESS RATE"      value={`${countSuccessRate}%`} delta="↑ 5% vs last month" deltaPositive  action="See score trend"   actionHref="/progress"        delay={0}   visible={cardsRef.visible} />
        <ActionCard icon={<AlertTriangle className="h-4 w-4" />} label="WEAKEST TRACK"     value="Storage"                delta="71% avg"            deltaPositive={false} action="Close this gap" actionHref="/challenges" urgency="high" delay={80}  visible={cardsRef.visible} />
        <ActionCard icon={<Clock className="h-4 w-4" />}         label="MISSIONS DONE"     value={String(countCompleted)} delta="+2 this week"       deltaPositive  action="View history"      actionHref="/history"         delay={160} visible={cardsRef.visible} />
        <ActionCard icon={<Target className="h-4 w-4" />}        label="TO NEXT LEVEL"     value="4 missions"                                                        action="See path"          actionHref="/progress"        delay={240} visible={cardsRef.visible} />
      </div>

      {/* ── Middle row: gap analysis + momentum / rings ────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.45fr_1fr]">

        {/* Skill gap panel */}
        <div ref={gapRef.ref}
          className={`rounded-2xl border border-border bg-surface p-6 transition-all duration-700 ${gapRef.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <div className="mb-1 flex items-start justify-between">
            <div>
              <div className="mono-label mb-1">SKILL GAP ANALYSIS</div>
              <h2 className="font-display text-[17px] font-medium text-ink">
                Where to focus to level up fastest
              </h2>
            </div>
            <Link to="/progress" className="mono-label flex items-center gap-0.5 whitespace-nowrap text-primary hover:opacity-70">
              Full report <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <p className="mb-2 text-[11px] text-foreground">
            Progress from last month → today. Target marker at 90%.
          </p>
          {chart.skillGrowth.map((s, i) => (
            <GapBar key={s.skill} skill={s.skill} current={s.current} previous={s.previous}
              delay={i * 80} visible={gapRef.visible} />
          ))}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">

          {/* Score momentum */}
          <div ref={momentRef.ref}
            className={`flex-1 rounded-2xl border border-border bg-surface p-5 transition-all duration-700 ${momentRef.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="mono-label mb-1">SCORE MOMENTUM</div>
                <div className="font-display text-[22px] font-medium leading-none text-ink">
                  {chart.successRateTrend[chart.successRateTrend.length - 1].rate}%
                  <span className="ml-2 text-[12px] font-normal text-emerald-600">↑ rising</span>
                </div>
              </div>
              <Sparkline data={chart.successRateTrend.map((d) => d.rate)} />
            </div>
            <MomentumBars data={chart.successRateTrend} visible={momentRef.visible} />
            <p className="mt-2 text-[10px] text-foreground">Top 18% of learners this month</p>
          </div>

          {/* Track health rings */}
          <div ref={ringsRef.ref}
            className={`rounded-2xl border border-border bg-surface p-5 transition-all duration-700 ${ringsRef.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
            style={{ transitionDelay: "100ms" }}>
            <div className="mono-label mb-3">TRACK HEALTH</div>
            <div className="flex items-center justify-around">
              {trackRows.map((t, i) => {
                const colors = ["#4a6cf7","#34A853","#f59e0b","#ef4444","#9b59b6","#1abc9c"];
                return (
                  <SkillRing key={t.key} pct={Math.round((t.completed / t.total) * 100)}
                    label={t.name} color={colors[i]} delay={i * 100} visible={ringsRef.visible} />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom row: track table + recommendations ───────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Track completion table */}
        <div ref={trackRef.ref}
          className={`rounded-2xl border border-border bg-surface p-6 transition-all duration-700 ${trackRef.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <div className="mb-3 flex items-center justify-between">
            <div className="mono-label">COMPLETION BY TRACK</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.48rem", letterSpacing: "0.04em", textTransform: "uppercase" }}
              className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-emerald-600">
                <span className="inline-block h-1.5 w-3 rounded bg-emerald-400" /> ≥88%
              </span>
              <span className="flex items-center gap-1 text-amber-500">
                <span className="inline-block h-1.5 w-3 rounded bg-amber-400" /> 80–87%
              </span>
              <span className="flex items-center gap-1 text-red-500">
                <span className="inline-block h-1.5 w-3 rounded bg-red-400" /> &lt;80%
              </span>
            </div>
          </div>
          {/* column header */}
          <div className="flex items-center gap-3 pb-1.5"
            style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>
            <div style={{ width: 88, flexShrink: 0 }}>Track</div>
            <div style={{ flex: 1 }}>Progress</div>
            <div style={{ width: 52, flexShrink: 0, textAlign: "right" }}>Done</div>
            <div style={{ width: 44, flexShrink: 0, textAlign: "right" }}>Avg</div>
            <div style={{ width: 12, flexShrink: 0 }} />
          </div>
          {trackRows.map((r, i) => (
            <TrackRow key={r.key} {...r} delay={i * 60} visible={trackRef.visible} />
          ))}
          {weakTracks.length > 0 && (
            <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
              <p className="text-[11px] text-red-700">
                <strong>{weakTracks.map((t) => t.name).join(", ")}</strong>{" "}
                {weakTracks.length === 1 ? "is" : "are"} below 80% — prioritise to stay on track for certification.
              </p>
            </div>
          )}
        </div>

        {/* AI Recommendations */}
        <div ref={recRef.ref} className="rounded-2xl border border-border bg-surface p-6">
          <div className="mono-label mb-1">AI RECOMMENDATIONS</div>
          <h2 className={`mb-1 font-display text-[17px] font-medium text-ink transition-all duration-700 ${recRef.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            Your next best missions
          </h2>
          <p className={`mb-4 text-[11px] text-foreground transition-all duration-700 ${recRef.visible ? "opacity-100" : "opacity-0"}`}
            style={{ transitionDelay: "80ms" }}>
            Ranked by impact on your weakest skills.
          </p>
          <div className="space-y-2.5">
            {recs.suggestedPath.map((m, i) => (
              <RecommendCard key={m.id} mission={m} reason={m.reason} idx={i}
                delay={i * 100} visible={recRef.visible} />
            ))}
          </div>
          <div className="mt-4 space-y-2">
            {recs.insights.map((insight, i) => (
              <div key={i}
                className={`flex items-start gap-2 rounded-xl px-3 py-2.5 transition-all duration-500 ${recRef.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
                style={{ background: "oklch(0.55 0.22 260 / 0.06)", transitionDelay: `${200 + i * 80}ms` }}>
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <p className="text-[11px] leading-snug text-foreground">{insight}</p>
              </div>
            ))}
          </div>
          <Link to="/recommendations"
            className={`mt-4 flex items-center justify-center gap-1.5 rounded-xl border border-border py-2.5 text-[12px] font-medium text-foreground transition-all duration-500 hover:bg-background ${recRef.visible ? "opacity-100" : "opacity-0"}`}
            style={{ transitionDelay: "380ms" }}>
            View full learning plan <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* ── Recent activity ──────────────────────────────────────── */}
      <div ref={actRef.ref}
        className={`overflow-hidden rounded-2xl border border-border bg-surface transition-all duration-700 ${actRef.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="mono-label">RECENT ACTIVITY</div>
          <Link to="/history" className="mono-label flex items-center gap-0.5 text-primary hover:opacity-70">
            Full history <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        {activities.map((a, i) => (
          <div key={a.id}
            className={`flex items-center gap-4 px-6 py-4 transition-all duration-500 hover:bg-background ${actRef.visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"} ${i < activities.length - 1 ? "border-b border-border" : ""}`}
            style={{ transitionDelay: `${i * 80}ms` }}>
            <span className="text-lg">{a.icon}</span>
            <div className="flex-1">
              <p className="text-[13px] font-medium text-ink">{a.title}</p>
              <p className="text-[11px] text-foreground">{a.description}</p>
            </div>
            <span className="mono-label shrink-0">{a.timestamp}</span>
          </div>
        ))}
      </div>

      {/* ── Global keyframe injected once ────────────────────────── */}
      <style>{`
        @keyframes cfFadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
