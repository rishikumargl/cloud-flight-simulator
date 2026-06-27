import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { TrendingUp, Zap, Target, ArrowRight, CheckCircle2 } from "lucide-react";
import { mockRecommendations } from "../../data/mockData";
import api from "../../api/apiService";

export const Route = createFileRoute("/_protected/recommendations")({
  head: () => ({ meta: [{ title: "Recommendations — PROPEL" }] }),
  component: RecommendationsPage,
});

const DIFF_COLORS: Record<string, string> = {
  beginner: "text-emerald-700 border-emerald-200 bg-emerald-50",
  intermediate: "text-amber-700 border-amber-200 bg-amber-50",
  advanced: "text-red-700 border-red-200 bg-red-50",
};
const TRACK_ICONS: Record<string, string> = {
  compute: "⚙️", storage: "💾", networking: "🌐",
  security: "🔒", devops: "🚀", architecture: "🏗️",
};
const GAP_COLORS: Record<string, { bar: string; badge: string }> = {
  High:   { bar: "#ef4444", badge: "text-red-700 bg-red-50" },
  Medium: { bar: "#f59e0b", badge: "text-amber-700 bg-amber-50" },
  Low:    { bar: "#34a853", badge: "text-emerald-700 bg-emerald-50" },
};

function useFadeUp() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.08 });
    obs.observe(el); return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function RecommendationsPage() {
  const navigate = Route.useNavigate();
  const [recs, setRecs] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const heroRef   = useFadeUp();
  const pathRef   = useFadeUp();
  const gapsRef   = useFadeUp();
  const insRef    = useFadeUp();
  const stepsRef  = useFadeUp();

  useEffect(() => {
    // Note: api.getRecommendations() returns empty array by design
    // Recommendations come from evaluation response after completing a mission
    // For now, show placeholder until backend exposes recommendations differently
    setRecs(null);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-40 animate-pulse rounded-3xl bg-muted" />)}
      </div>
    );
  }

  if (!recs) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <Zap className="h-8 w-8 text-primary" />
        </div>
        <h2 className="font-display text-[22px] font-medium text-ink mb-2">No recommendations yet</h2>
        <p className="text-foreground text-[14px] text-center max-w-sm mb-6">
          Complete a mission to unlock personalized learning recommendations tailored to your skill level and progress.
        </p>
        <Link to="/challenges"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[13px] font-medium text-white hover:opacity-90">
          Start New Mission <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  const data = recs ?? { currentLevel: "Beginner", suggestedPath: [], skillGaps: [], insights: [] };

  return (
    <div className="space-y-8 pb-16">

      {/* Header */}
      <div style={{ animation: "cfFadeSlideUp 0.5s ease both" }}>
        <div className="mono-label mb-2">AI RECOMMENDATIONS</div>
        <h1 className="font-display text-[clamp(2rem,5vw,3rem)] font-medium tracking-[-0.03em] text-ink">
          Personalised learning path
        </h1>
        <p className="mt-2 text-[15px] text-foreground">
          AI-powered recommendations tailored to your skills and progress.
        </p>
      </div>

      {/* Status cards */}
      <div ref={heroRef.ref} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { icon: "⭐", label: "Current Level", value: data?.currentLevel ?? "Intermediate" },
          { icon: "📈", label: "Recommended", value: `${data?.suggestedPath?.length ?? 0} challenges` },
          { icon: "🎯", label: "Skill Gaps", value: `${data?.skillGaps?.length ?? 0} areas` },
        ].map((s, i) => (
          <div key={s.label}
            className={`flex items-center gap-4 rounded-2xl border border-border bg-surface p-6 transition-all duration-700 ${heroRef.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            style={{ transitionDelay: `${i * 80}ms` }}>
            <div className="h-12 w-12 shrink-0 flex items-center justify-center rounded-xl bg-background text-2xl">
              {s.icon}
            </div>
            <div>
              <div className="mono-label mb-0.5">{s.label}</div>
              <div className="font-display text-[1.4rem] font-medium text-ink">{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Suggested learning path */}
      <div ref={pathRef.ref}
        className={`rounded-2xl border border-border bg-surface p-7 transition-all duration-700 ${pathRef.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp className="h-5 w-5 text-primary" />
          <div className="font-display text-[18px] font-semibold text-ink">Suggested Learning Path</div>
        </div>
        <div className="space-y-4">
          {data?.suggestedPath?.map((ch: any, i: number) => (
            <div key={ch.id}
              className={`flex items-start gap-4 rounded-xl border border-border p-5 hover:border-primary/40 hover:bg-background transition-all duration-500 ${pathRef.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
              style={{ transitionDelay: `${i * 100}ms` }}>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-[15px] font-semibold text-primary">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="text-[14px] font-semibold text-ink">{ch.title}</span>
                  <span className={`rounded-full border px-2 py-0.5 font-mono text-[0.52rem] uppercase ${DIFF_COLORS[ch.difficulty] ?? ""}`}>
                    {ch.difficulty}
                  </span>
                  <span className="mono-label flex items-center gap-1">
                    {TRACK_ICONS[ch.track]} {ch.track}
                  </span>
                </div>
                <p className="text-[13px] text-foreground">{ch.reason}</p>
              </div>
              <button onClick={() => navigate({ to: "/challenges" })}
                className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[12px] font-medium text-white hover:opacity-90 transition">
                Start <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Skill gaps */}
      <div ref={gapsRef.ref}
        className={`rounded-2xl border border-border bg-surface p-7 transition-all duration-700 ${gapsRef.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
        <div className="flex items-center gap-2 mb-5">
          <Zap className="h-5 w-5 text-amber-500" />
          <div className="font-display text-[18px] font-semibold text-ink">Skill Gaps & Development Areas</div>
        </div>
        <div className="space-y-6">
          {data?.skillGaps?.map((gap: any, i: number) => {
            const style = GAP_COLORS[gap.gap] ?? GAP_COLORS.Medium;
            const pct = gap.gap === "High" ? 85 : gap.gap === "Medium" ? 55 : 25;
            return (
              <div key={gap.skill}
                className={`transition-all duration-500 ${gapsRef.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
                style={{ transitionDelay: `${i * 100}ms` }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-[14px] text-ink">{gap.skill}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold font-mono ${style.badge}`}>
                    {gap.gap} Gap
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted mb-2.5">
                  <div className="h-full rounded-full transition-all duration-1000"
                    style={{ width: gapsRef.visible ? `${pct}%` : "0%", background: style.bar, transitionDelay: `${i * 100 + 300}ms` }} />
                </div>
                <p className="text-[12px] text-foreground mb-2">{gap.suggestion}</p>
                <button onClick={() => navigate({ to: "/challenges" })}
                  className="text-[11px] font-medium text-primary hover:opacity-70">
                  Explore resources →
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Insights */}
      <div ref={insRef.ref}
        className={`rounded-2xl border border-primary/20 bg-primary/5 p-7 transition-all duration-700 ${insRef.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
        <div className="flex items-center gap-2 mb-5">
          <Target className="h-5 w-5 text-primary" />
          <div className="font-display text-[18px] font-semibold text-ink">Learning Insights</div>
        </div>
        <ul className="space-y-3">
          {data?.insights?.map((insight: string, i: number) => (
            <li key={i}
              className={`flex items-start gap-3 transition-all duration-500 ${insRef.visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`}
              style={{ transitionDelay: `${i * 80}ms` }}>
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span className="text-[14px] leading-relaxed text-foreground">{insight}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Next steps */}
      <div ref={stepsRef.ref}
        className={`rounded-2xl border border-border bg-surface p-7 transition-all duration-700 ${stepsRef.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
        <div className="font-display text-[18px] font-semibold text-ink mb-5">Recommended Next Steps</div>
        <ol className="space-y-4">
          {[
            { n: 1, text: `Start with ${data?.suggestedPath?.[0]?.title ?? "your first recommended challenge"} to reinforce your foundation.` },
            { n: 2, text: "Focus on Kubernetes skills through the Compute track's GKE specialisation." },
            { n: 3, text: "Complete advanced architecture challenges to earn the Cloud Architect badge." },
          ].map((s, i) => (
            <li key={s.n}
              className={`flex items-start gap-4 transition-all duration-500 ${stepsRef.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
              style={{ transitionDelay: `${i * 80}ms` }}>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary font-display text-[13px] font-semibold text-white">
                {s.n}
              </span>
              <span className="text-[14px] leading-relaxed text-foreground pt-0.5">{s.text}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* CTAs */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button onClick={() => navigate({ to: "/challenges" })}
          className="btn-primary flex-1 inline-flex items-center justify-center gap-2">
          Start Recommended Challenge <ArrowRight className="h-4 w-4" />
        </button>
        <Link to="/progress" className="btn-ghost flex-1 text-center inline-flex items-center justify-center">
          View Full Progress
        </Link>
      </div>

      <style>{`@keyframes cfFadeSlideUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}
