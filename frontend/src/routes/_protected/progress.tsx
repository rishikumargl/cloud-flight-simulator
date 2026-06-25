import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { TrendingUp, Target, Zap, ChevronRight, AlertTriangle } from "lucide-react";
import { mockProgressChartData, trackRows } from "../../data/mockData";

export const Route = createFileRoute("/_protected/progress")({
  head: () => ({ meta: [{ title: "Progress — CloudFlight" }] }),
  component: ProgressPage,
});

const TRACK_COLORS = ["#4a6cf7","#34A853","#f59e0b","#ef4444","#9b59b6","#1abc9c"];

/* ─── fade-up hook ─────────────────────────────────────────────────────────── */
function useFadeUp(threshold = 0.1) {
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

/* ─── count-up hook ────────────────────────────────────────────────────────── */
function useCountUp(target: number, duration = 900, delay = 0, active = true) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf: number;
    const t = setTimeout(() => {
      let start: number | null = null;
      const tick = (ts: number) => {
        if (!start) start = ts;
        const p = Math.min((ts - start) / duration, 1);
        setV(Math.round((1 - Math.pow(1 - p, 3)) * target));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, delay);
    return () => { clearTimeout(t); cancelAnimationFrame(raf); };
  }, [target, duration, delay, active]);
  return v;
}

/* ─── Custom tooltip for recharts ──────────────────────────────────────────── */
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-background px-3 py-2.5 shadow-lg">
      {label && <div className="mb-1.5 font-mono text-[10px] uppercase text-foreground">{label}</div>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-[12px]">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-foreground">{p.name}:</span>
          <span className="font-semibold text-ink">{p.value}{p.name === "Pass rate" ? "%" : ""}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Animated skill growth bar ────────────────────────────────────────────── */
function SkillGrowthBar({ skill, current, previous, delay = 0, visible }: {
  skill: string; current: number; previous: number; delay?: number; visible: boolean;
}) {
  const [filled, setFilled] = useState(false);
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => setFilled(true), delay + 300);
    return () => clearTimeout(t);
  }, [visible, delay]);

  const gained = current - previous;
  const TARGET = 90;
  const remaining = Math.max(TARGET - current, 0);
  const barColor = current >= TARGET ? "#4a6cf7" : current >= 80 ? "#f59e0b" : "#ef4444";

  return (
    <div className={`rounded-2xl border border-border bg-background p-5 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      style={{ transitionDelay: `${delay}ms` }}>
      <div className="mb-3 flex items-start justify-between">
        <span className="text-[14px] font-semibold text-ink">{skill}</span>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-mono text-[0.58rem] text-emerald-700 uppercase">
            +{gained} pts
          </span>
          <div className="text-right">
            <span className="font-mono text-[10px] text-foreground line-through mr-1">{previous}</span>
            <span className="font-display text-[18px] font-medium text-ink">{current}</span>
          </div>
        </div>
      </div>
      <div className="relative h-2 overflow-hidden rounded-full bg-muted">
        {/* ghost: previous */}
        <div className="absolute left-0 top-0 h-full rounded-full bg-muted-foreground/20 transition-all duration-700"
          style={{ width: filled ? `${previous}%` : "0%", transitionDelay: `${delay}ms` }} />
        {/* current */}
        <div className="absolute left-0 top-0 h-full rounded-full transition-all duration-1000"
          style={{ width: filled ? `${current}%` : "0%", background: barColor, transitionDelay: `${delay + 120}ms` }} />
        {/* target marker */}
        <div className="absolute top-[-3px] h-[14px] w-[2px] rounded bg-ink/30" style={{ left: `${TARGET}%` }} />
      </div>
      <div className="mt-2 flex items-center justify-between text-[10px] text-foreground">
        <span className="flex items-center gap-1">
          <Target className="h-2.5 w-2.5" />
          {remaining > 0 ? `${remaining}% to proficiency target` : "Proficiency reached ✓"}
        </span>
        <span className="font-mono">{current}%</span>
      </div>
    </div>
  );
}

/* ─── Stat hero card ───────────────────────────────────────────────────────── */
function StatCard({ label, value, unit, delta, deltaPositive, delay = 0, visible }: {
  label: string; value: number; unit?: string; delta?: string;
  deltaPositive?: boolean; delay?: number; visible: boolean;
}) {
  const count = useCountUp(value, 900, delay + 200, visible);
  return (
    <div className={`rounded-2xl border border-border bg-surface p-6 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      style={{ transitionDelay: `${delay}ms` }}>
      <div className="mono-label mb-3">{label}</div>
      <div className="font-display text-[3rem] font-medium leading-none tracking-[-0.04em] text-ink">
        {count}{unit}
      </div>
      {delta && (
        <div className={`mt-3 font-mono text-[11px] ${deltaPositive ? "text-emerald-600" : "text-red-500"}`}>{delta}</div>
      )}
    </div>
  );
}

/* ─── Track distribution legend ────────────────────────────────────────────── */
function PieLegend({ data }: { data: { track: string; value: number }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="mt-4 space-y-2">
      {data.map((d, i) => (
        <div key={d.track} className="flex items-center gap-3">
          <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: TRACK_COLORS[i] }} />
          <span className="flex-1 text-[12px] text-ink">{d.track}</span>
          <span className="mono-label">{Math.round((d.value / total) * 100)}%</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Insight row ──────────────────────────────────────────────────────────── */
function InsightRow({ icon, text, color, delay = 0, visible }: {
  icon: React.ReactNode; text: string; color: string; delay?: number; visible: boolean;
}) {
  return (
    <div className={`flex items-start gap-3 transition-all duration-500 ${visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`}
      style={{ transitionDelay: `${delay}ms` }}>
      <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${color}`}>
        {icon}
      </div>
      <p className="text-[13px] leading-relaxed text-foreground">{text}</p>
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────────────────────────── */
function ProgressPage() {
  const data = mockProgressChartData;

  const heroRef   = useFadeUp();
  const statsRef  = useFadeUp();
  const barRef    = useFadeUp();
  const lineRef   = useFadeUp();
  const pieRef    = useFadeUp();
  const growthRef = useFadeUp();
  const trackRef  = useFadeUp();
  const insRef    = useFadeUp();

  const avgScore = Math.round(
    data.successRateTrend.reduce((s, d) => s + d.rate, 0) / data.successRateTrend.length
  );
  const best = Math.max(...data.successRateTrend.map((d) => d.rate));
  const totalMissions = data.progressTrend.reduce((s, d) => s + d.completed, 0);
  const weakTracks = trackRows.filter((t) => t.avg < 82);

  return (
    <div className="space-y-8 pb-16">

      {/* ── Page header ──────────────────────────────────────────── */}
      <div ref={heroRef.ref}
        className={`transition-all duration-700 ${heroRef.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
        <div className="mono-label mb-2">LEARNING ANALYTICS</div>
        <h1 className="font-display text-[clamp(2rem,5vw,3.2rem)] font-medium leading-[1] tracking-[-0.03em] text-ink">
          Your progress at a glance.
        </h1>
        <p className="mt-3 text-[15px] text-foreground">
          Real-time insight into your cloud skill trajectory across all six tracks.
        </p>
      </div>

      {/* ── 3 stat cards ─────────────────────────────────────────── */}
      <div ref={statsRef.ref} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="TOTAL MISSIONS"   value={totalMissions} delta="+8 this month"    deltaPositive delay={0}   visible={statsRef.visible} />
        <StatCard label="AVG PASS RATE"    value={avgScore}      unit="%" delta="↑ improving" deltaPositive delay={80}  visible={statsRef.visible} />
        <StatCard label="PERSONAL BEST"    value={best}          unit="%" delta="GCP Networking" delay={160} visible={statsRef.visible} />
      </div>

      {/* ── Mission completion trend (bar chart) ─────────────────── */}
      <div ref={barRef.ref}
        className={`rounded-2xl border border-border bg-surface p-7 transition-all duration-700 ${barRef.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
        <div className="mb-1 flex items-start justify-between">
          <div>
            <div className="mono-label mb-1">MISSION COMPLETION TREND</div>
            <h2 className="font-display text-[20px] font-medium tracking-[-0.02em] text-ink">
              Missions over time
            </h2>
          </div>
          <Link to="/history" className="mono-label flex items-center gap-0.5 text-primary hover:opacity-70">
            View history <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        <p className="mb-6 text-[12px] text-foreground">
          Monthly breakdown of completed, in-progress, and failed missions.
        </p>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data.progressTrend} barCategoryGap="32%">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.4 }} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, fontFamily: "var(--font-mono)", paddingTop: 16 }} />
            <Bar dataKey="completed"  name="Completed"   fill="#4a6cf7" radius={[4, 4, 0, 0]} animationBegin={barRef.visible ? 0 : 99999} animationDuration={800} />
            <Bar dataKey="inProgress" name="In Progress" fill="#9b59b6" radius={[4, 4, 0, 0]} animationBegin={barRef.visible ? 100 : 99999} animationDuration={800} />
            <Bar dataKey="failed"     name="Failed"      fill="#ef4444" radius={[4, 4, 0, 0]} animationBegin={barRef.visible ? 200 : 99999} animationDuration={800} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Pass rate line + track distribution pie ───────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Pass rate line chart */}
        <div ref={lineRef.ref}
          className={`rounded-2xl border border-border bg-surface p-7 transition-all duration-700 ${lineRef.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <div className="mono-label mb-1">SUCCESS RATE TREND</div>
          <h2 className="mb-1 font-display text-[20px] font-medium tracking-[-0.02em] text-ink">
            Pass rate over time
          </h2>
          <p className="mb-6 text-[12px] text-foreground">
            Consistent upward trend — you're on track for 95% by next quarter.
          </p>
          <ResponsiveContainer width="100%" height={210}>
            <LineChart data={data.successRateTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
              <YAxis domain={[60, 100]} tick={{ fontSize: 11, fill: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="rate" name="Pass rate" stroke="#4a6cf7" strokeWidth={2.5}
                dot={{ r: 4, fill: "#4a6cf7", strokeWidth: 0 }}
                activeDot={{ r: 6, fill: "#4a6cf7" }}
                animationBegin={lineRef.visible ? 0 : 99999} animationDuration={1200} />
            </LineChart>
          </ResponsiveContainer>
          {/* delta callout */}
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            <p className="text-[12px] text-emerald-700">
              +17 percentage points since January — top 18% of all learners this month.
            </p>
          </div>
        </div>

        {/* Track distribution */}
        <div ref={pieRef.ref}
          className={`rounded-2xl border border-border bg-surface p-7 transition-all duration-700 ${pieRef.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
          style={{ transitionDelay: "80ms" }}>
          <div className="mono-label mb-1">TRACK DISTRIBUTION</div>
          <h2 className="mb-1 font-display text-[20px] font-medium tracking-[-0.02em] text-ink">
            Where you've focused
          </h2>
          <p className="mb-4 text-[12px] text-foreground">
            Networking leads your focus — consider balancing with DevOps.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie data={data.trackDistribution} dataKey="value" nameKey="track"
                  cx="50%" cy="50%" outerRadius={78} innerRadius={40}
                  animationBegin={pieRef.visible ? 0 : 99999} animationDuration={1000}>
                  {data.trackDistribution.map((_, i) => (
                    <Cell key={i} fill={TRACK_COLORS[i % TRACK_COLORS.length]} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1">
              <PieLegend data={data.trackDistribution} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Skill growth bars ─────────────────────────────────────── */}
      <div ref={growthRef.ref}>
        <div className={`mb-4 transition-all duration-700 ${growthRef.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <div className="mono-label mb-1">SKILL GROWTH</div>
          <h2 className="font-display text-[20px] font-medium tracking-[-0.02em] text-ink">
            Before vs. after — your improvement this month
          </h2>
          <p className="mt-1 text-[12px] text-foreground">
            Ghost bar = last month · Solid bar = today · Target marker at 90%.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.skillGrowth.map((s, i) => (
            <SkillGrowthBar key={s.skill} skill={s.skill} current={s.current} previous={s.previous}
              delay={i * 80} visible={growthRef.visible} />
          ))}
        </div>
      </div>

      {/* ── Per-track avg score table ─────────────────────────────── */}
      <div ref={trackRef.ref}
        className={`overflow-hidden rounded-2xl border border-border bg-surface transition-all duration-700 ${trackRef.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
        <div className="border-b border-border px-7 py-5">
          <div className="mono-label mb-1">TRACK-LEVEL PERFORMANCE</div>
          <h2 className="font-display text-[20px] font-medium tracking-[-0.02em] text-ink">
            Score breakdown by track
          </h2>
        </div>
        {/* header */}
        <div className="flex items-center gap-4 border-b border-border px-7 py-3"
          style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>
          <div style={{ width: 100, flexShrink: 0 }}>Track</div>
          <div style={{ flex: 1 }}>Completion</div>
          <div style={{ width: 70, flexShrink: 0, textAlign: "right" }}>Done / Total</div>
          <div style={{ width: 55, flexShrink: 0, textAlign: "right" }}>Avg score</div>
          <div style={{ width: 14, flexShrink: 0 }} />
        </div>
        {trackRows.map((r, i) => {
          const pct = Math.round((r.completed / r.total) * 100);
          const avgColor = r.avg >= 88 ? "text-emerald-600" : r.avg >= 80 ? "text-amber-500" : "text-red-500";
          const barColor = r.avg >= 88 ? "#4a6cf7" : r.avg >= 80 ? "#f59e0b" : "#ef4444";
          return (
            <div key={r.key}
              className={`flex items-center gap-4 border-t border-border px-7 py-4 hover:bg-background transition-colors ${trackRef.visible ? "opacity-100" : "opacity-0"}`}
              style={{ transitionDelay: `${i * 60}ms`, transition: "opacity 0.5s ease" }}>
              <div style={{ width: 100, flexShrink: 0 }} className="text-[13px] font-medium text-ink">{r.name}</div>
              <div style={{ flex: 1 }}>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full transition-all duration-1000"
                    style={{ width: trackRef.visible ? `${pct}%` : "0%", background: barColor, transitionDelay: `${i * 80 + 300}ms` }} />
                </div>
              </div>
              <div style={{ width: 70, textAlign: "right" }} className="mono-label">{r.completed}/{r.total}</div>
              <div style={{ width: 55, textAlign: "right" }} className={`mono-label ${avgColor}`}>{r.avg}%</div>
              <div style={{ width: 14 }} className="text-center text-[10px]">
                {r.avg >= 88 ? <span className="text-emerald-500">↑</span> : r.avg >= 80 ? <span className="text-amber-500">→</span> : <span className="text-red-500">↓</span>}
              </div>
            </div>
          );
        })}
        {weakTracks.length > 0 && (
          <div className="border-t border-border px-7 py-4">
            <div className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
              <p className="text-[12px] text-red-700">
                <strong>{weakTracks.map((t) => t.name).join(", ")}</strong> below 80% average — these tracks need your attention to stay on path for certification.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Insights panel ───────────────────────────────────────── */}
      <div ref={insRef.ref}
        className={`rounded-2xl border border-border bg-surface p-7 transition-all duration-700 ${insRef.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
        <div className="mono-label mb-1">AI INSIGHTS</div>
        <h2 className="mb-5 font-display text-[20px] font-medium tracking-[-0.02em] text-ink">
          Personalised coaching notes
        </h2>
        <div className="space-y-4">
          <InsightRow visible={insRef.visible} delay={0}
            color="bg-blue-50 text-blue-600"
            icon={<TrendingUp className="h-3.5 w-3.5" />}
            text="Your pass rate has improved 17 points in 6 months — consistent with learners who reach senior cloud engineer level within a year." />
          <InsightRow visible={insRef.visible} delay={80}
            color="bg-red-50 text-red-600"
            icon={<AlertTriangle className="h-3.5 w-3.5" />}
            text="Storage and DevOps are your weakest tracks at 71% and 78%. Two targeted missions in each would bring both above the 80% threshold." />
          <InsightRow visible={insRef.visible} delay={160}
            color="bg-emerald-50 text-emerald-600"
            icon={<Zap className="h-3.5 w-3.5" />}
            text="Security is your strongest area at 93% average. Consider taking the Security Architect capstone — you're ready." />
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/recommendations"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[13px] font-medium text-white hover:opacity-90 transition-all hover:-translate-y-0.5">
            <Zap className="h-3.5 w-3.5" /> View my learning plan
          </Link>
          <Link to="/challenges"
            className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-[13px] font-medium text-foreground hover:bg-background transition">
            Browse missions <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

    </div>
  );
}
