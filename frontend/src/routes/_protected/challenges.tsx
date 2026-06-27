import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Cpu, Database, Wifi, Lock, Rocket, Layout,
  Sprout, BookOpen, Zap, CheckCircle2, ArrowRight, Sparkles,
} from "lucide-react";
import { learningTracks, difficulties, trackRows } from "../../data/mockData";
import api from "../../api/apiService";
import { CloudGenie } from "../../components/CloudGenie";

export const Route = createFileRoute("/_protected/challenges")({
  head: () => ({ meta: [{ title: "Challenges — PROPEL" }] }),
  component: ChallengesPage,
});

/* ── constants ── */
const TRACK_ICONS: Record<string, React.ReactNode> = {
  compute:      <Cpu className="h-5 w-5" />,
  storage:      <Database className="h-5 w-5" />,
  networking:   <Wifi className="h-5 w-5" />,
  security:     <Lock className="h-5 w-5" />,
  devops:       <Rocket className="h-5 w-5" />,
  architecture: <Layout className="h-5 w-5" />,
};
const TRACK_COLORS: Record<string, string> = {
  compute:      "text-blue-600 bg-blue-50 border-blue-200",
  storage:      "text-emerald-600 bg-emerald-50 border-emerald-200",
  networking:   "text-cyan-600 bg-cyan-50 border-cyan-200",
  security:     "text-red-600 bg-red-50 border-red-200",
  devops:       "text-violet-600 bg-violet-50 border-violet-200",
  architecture: "text-amber-600 bg-amber-50 border-amber-200",
};
const DIFF_META: Record<string, { icon: React.ReactNode; color: string; time: string; desc: string }> = {
  beginner:     { icon: <Sprout className="h-4 w-4" />,  color: "text-emerald-700 bg-emerald-50 border-emerald-200", time: "30–60 min",  desc: "Perfect for building foundational GCP skills" },
  intermediate: { icon: <BookOpen className="h-4 w-4" />, color: "text-amber-700 bg-amber-50 border-amber-200",     time: "60–90 min",  desc: "Real-world multi-service scenarios" },
  advanced:     { icon: <Zap className="h-4 w-4" />,     color: "text-red-700 bg-red-50 border-red-200",           time: "90–180 min", desc: "Complex enterprise architectures under pressure" },
};

type Stage = "idle" | "generating" | "provisioning" | "ready" | "error";
const STAGE_STEPS = [
  { key: "generating",   label: "Generating AI scenario",       activeIn: ["generating", "provisioning", "ready"] },
  { key: "provisioning", label: "Provisioning GCP environment", activeIn: ["provisioning", "ready"] },
  { key: "ready",        label: "Launching mission",            activeIn: ["ready"] },
];

function useFadeUp() {
  const ref = useRef<HTMLDivElement>(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setV(true); obs.disconnect(); } },
      { threshold: 0.08 }
    );
    obs.observe(el); return () => obs.disconnect();
  }, []);
  return { ref, visible: v };
}

/* ── Track card ── */
function TrackCard({ track, selected, onSelect }: { track: any; selected: boolean; onSelect: () => void }) {
  const row = trackRows.find(r => r.key === track.id);
  const pct = row ? Math.round((row.completed / row.total) * 100) : 0;
  const colors = TRACK_COLORS[track.id] ?? "text-primary bg-primary/5 border-primary/20";

  return (
    // The button IS the card. It must be flex-col and stretch to fill the grid cell.
    // The parent div has `contents` so the button directly participates in the grid.
    <button
      onClick={onSelect}
      style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%" }}
      className={`group relative rounded-2xl border p-6 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${
        selected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border bg-surface hover:border-primary/30 hover:bg-background"
      }`}
    >
      {selected && (
        <div className="absolute right-3 top-3">
          <CheckCircle2 className="h-4 w-4 text-primary" />
        </div>
      )}

      {/* icon */}
      <div className={`inline-flex items-center justify-center h-10 w-10 rounded-xl border ${colors}`}>
        {TRACK_ICONS[track.id] ?? track.icon}
      </div>

      {/* title + description */}
      <div className="mt-4">
        <div className="text-[14px] font-semibold text-ink mb-1">{track.name}</div>
        <div className="text-[12px] text-foreground leading-snug">{track.description}</div>
      </div>

      {/* spacer pushes progress to bottom */}
      <div style={{ flex: 1 }} />

      {/* progress — always at bottom */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="mono-label">YOUR PROGRESS</span>
          <span className="mono-label">{row ? `${row.completed}/${row.total}` : "—"}</span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </button>
  );
}

/* ── Difficulty card ── */
function DiffCard({ diff, selected, onSelect }: { diff: any; selected: boolean; onSelect: () => void }) {
  const meta = DIFF_META[diff.id];
  return (
    <button
      onClick={onSelect}
      className={`group flex w-full flex-col gap-3 rounded-2xl border p-5 text-left transition-all duration-300 hover:-translate-y-0.5 ${
        selected ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-surface hover:border-primary/30"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${meta?.color ?? ""}`}>
          {meta?.icon} {diff.name}
        </div>
        {selected && <CheckCircle2 className="h-4 w-4 text-primary" />}
      </div>
      <p className="text-[12px] text-foreground leading-snug">{meta?.desc}</p>
      <div className="mono-label">{meta?.time}</div>
    </button>
  );
}


/* ── Main ── */
function ChallengesPage() {
  const navigate = Route.useNavigate();
  const [track, setTrack] = useState<string | null>(null);
  const [diff,  setDiff]  = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [modal, setModal] = useState(false);

  const headerRef = useFadeUp();
  const tracksRef = useFadeUp();
  const configRef = useFadeUp();
  const isValid   = track && diff;

  const handleLaunch = async () => {
    if (!isValid || stage !== "idle") return;
    setModal(true); setStage("generating"); setErrMsg(null);
    try {
      const scenario   = await api.generateScenario(track!, diff!);
      const mission_id = scenario?.mission_id ?? scenario?.id;
      if (!mission_id) throw new Error("No mission_id returned");
      setStage("provisioning");
      const challengeData = await api.startChallenge(mission_id);
      const session_id = challengeData?.session_id;
      if (!session_id) throw new Error("No session_id returned");
      setStage("ready");
      await new Promise(r => setTimeout(r, 500));
      navigate({ to: "/mission/$id", params: { id: session_id } });
    } catch (err: any) {
      setErrMsg(err?.response?.data?.detail ?? err?.message ?? "Launch failed. Please try again.");
      setStage("error");
    }
  };


  return (
    <div className="mx-auto w-full max-w-7xl px-6 xl:px-8 space-y-10 pb-16">

      {/* Header */}
      <div
        ref={headerRef.ref}
        className={`transition-all duration-700 ${headerRef.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
      >
        <div className="mono-label mb-2">MISSION LAUNCHER</div>
        <h1 className="font-display text-[clamp(2rem,5vw,3rem)] font-medium tracking-[-0.03em] text-ink">
          Choose your next mission
        </h1>
        <p className="mt-2 max-w-xl text-[15px] text-foreground">
          Select a track and difficulty — AI generates a unique live scenario on real GCP infrastructure.
        </p>
      </div>

      {/* Track selector */}
      <div ref={tracksRef.ref}>
        <div className={`flex items-center justify-between mb-4 transition-all duration-700 ${tracksRef.visible ? "opacity-100" : "opacity-0"}`}>
          <div className="mono-label">LEARNING TRACK</div>
          {track && (
            <button onClick={() => setTrack(null)} className="mono-label text-primary hover:opacity-70">
              Clear
            </button>
          )}
        </div>

        {/*
          KEY FIX: The grid uses `grid-rows` implicitly via auto-rows-fr.
          Each cell is a flex container via `display:contents` workaround —
          instead we make the grid itself control height by setting an explicit
          row height, then let the button fill it with height:100%.

          The simplest reliable solution: drop `auto-rows-fr` and use a CSS
          subgrid-style approach: each wrapper div is `display:contents` so
          the button IS the grid item and h-full works perfectly.
        */}
        <div
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          style={{ gridAutoRows: "1fr" }}
        >
          {learningTracks.map((t, i) => (
            // display:contents removes the wrapper from layout — button becomes the grid item
            <div
              key={t.id}
              style={{ display: "contents" }}
            >
              <div
                className={`transition-all duration-500 ${
                  tracksRef.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
                style={{ transitionDelay: `${i * 70}ms`, display: "flex", flexDirection: "column" }}
              >
                <TrackCard track={t} selected={track === t.id} onSelect={() => setTrack(t.id)} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Difficulty + launch */}
      <div
        ref={configRef.ref}
        className={`rounded-2xl border border-border bg-surface p-8 transition-all duration-700 ${
          configRef.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-stretch">

          {/* Difficulty column */}
          <div className="flex flex-col">
            <div className="mono-label mb-4">DIFFICULTY LEVEL</div>
            <div className="flex flex-col gap-3 flex-1">
              {difficulties.map((d, i) => (
                <div
                  key={d.id}
                  className={`transition-all duration-500 ${
                    configRef.visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                  }`}
                  style={{ transitionDelay: `${i * 80}ms` }}
                >
                  <DiffCard diff={d} selected={diff === d.id} onSelect={() => setDiff(d.id)} />
                </div>
              ))}
            </div>
          </div>

          {/* Selection + CTA column */}
          <div className="flex flex-col">
            {/* grows to fill column height */}
            <div className="rounded-2xl border border-border bg-background p-6 flex flex-col flex-1">
              <div className="mono-label mb-4">YOUR SELECTION</div>

              {!track && !diff ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <Sparkles className="mb-3 h-8 w-8 text-muted-foreground" />
                  <p className="text-[14px] text-foreground">
                    Select a track and difficulty above to configure your mission
                  </p>
                </div>
              ) : (
                <div className="space-y-4 flex-1">
                  {track && (
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl border shrink-0 ${TRACK_COLORS[track] ?? ""}`}>
                        {TRACK_ICONS[track]}
                      </div>
                      <div className="min-w-0">
                        <div className="mono-label mb-0.5">TRACK</div>
                        <div className="text-[14px] font-semibold text-ink">
                          {learningTracks.find(t => t.id === track)?.name}
                        </div>
                      </div>
                    </div>
                  )}
                  {diff && (
                    <div className="flex items-center gap-3">
                      <div className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-semibold shrink-0 ${DIFF_META[diff]?.color ?? ""}`}>
                        {DIFF_META[diff]?.icon} {difficulties.find(d => d.id === diff)?.name}
                      </div>
                      <span className="mono-label">{DIFF_META[diff]?.time}</span>
                    </div>
                  )}
                  {track && diff && (
                    <div className="rounded-xl bg-primary/5 border border-primary/15 p-3 text-[12px] text-primary leading-relaxed">
                      <Sparkles className="inline h-3.5 w-3.5 mr-1.5" />
                      AI will generate a unique, real-world scenario for this combination.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Launch button — always at bottom of right column */}
            <div className="space-y-3 mt-6">
              <button
                onClick={handleLaunch}
                disabled={!isValid || stage !== "idle"}
                className="group w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 text-[15px] font-medium text-white hover:opacity-90 transition hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0"
              >
                <Zap className="h-4 w-4 transition-transform group-hover:scale-110" />
                {isValid ? "Launch Mission" : "Select Track & Difficulty"}
                {isValid && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />}
              </button>
              <p className="text-center text-[11px] text-muted-foreground">
                A live GCP environment will be provisioned for you
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cloud Genie Provisioning Experience */}
      {modal && stage !== "idle" && <CloudGenie stage={stage} errorMsg={errMsg} difficulty={diff as "beginner" | "intermediate" | "advanced"} />}

      <style>{`
        @keyframes cfFadeSlideUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes cfModalIn { from{opacity:0;transform:scale(0.92) translateY(16px)} to{opacity:1;transform:scale(1) translateY(0)} }
      `}</style>
    </div>
  );
}