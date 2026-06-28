import { createFileRoute, Link } from "@tanstack/react-router";
import cloudImage from "@/assets/cloud-arch.jpg";
import { learningTracks, trackRows } from "../data/mockData";
import { useEffect, useRef, useState } from "react";
import {
  Cpu, Database, Wifi, Lock, Rocket, Layout,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CloudFlight — Cloud skills that ship to production" },
      { name: "description", content: "AI-native cloud training platform with live GCP environments." },
    ],
  }),
  component: Landing,
});

/* ══════════════════════════════════════════════════════════════════
   NAV
══════════════════════════════════════════════════════════════════ */
function Logo() {
  return (
    <div className="flex items-center gap-2">
      <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
        <path d="M4 22 L14 4 L24 22 L18 22 L14 14 L10 22 Z" fill="var(--primary)" />
      </svg>
      <span className="text-xl font-semibold tracking-tight text-ink">PROPEL</span>
    </div>
  );
}
function Nav() {
  return (
    <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
      <Logo />
      <nav className="hidden items-center gap-10 md:flex">
        <a className="text-[15px] text-foreground hover:opacity-70" href="#tracks">Tracks</a>
        <a className="text-[15px] text-foreground hover:opacity-70" href="#how">How it works</a>
        <a className="text-[15px] text-foreground hover:opacity-70" href="#teams">For teams</a>
      </nav>
      <div className="flex items-center gap-5">
        <Link to="/login" className="hidden text-[15px] text-foreground hover:opacity-70 md:inline">Sign in</Link>
        <Link to="/login" className="btn-primary">Start mission</Link>
      </div>
    </header>
  );
}

/* ══════════════════════════════════════════════════════════════════
   HERO
══════════════════════════════════════════════════════════════════ */
const CARD_W = 280;
const CARD_H = 210;

// FIX: shifted fracs so leftmost card doesn't bleed off-screen
// At frac=0.18, card center is at 18% — with card width 280px on ~1200px container,
// leftmost edge = 18%*1200 - 140 = 76px, safe.
const PILL_FRACS = [0.20, 0.50, 0.80];

const LINE_Y   = 80;
const PATH_STR = `M 0 20 C 0 ${LINE_Y} 30 ${LINE_Y} 60 ${LINE_Y} L 1000 ${LINE_Y}`;
const PATH_LEN = 1060;

function Pill({ label }: { label: string }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      borderRadius: 999, border: "1px solid var(--border)",
      background: "rgba(var(--background-rgb, 240 237 228) / 0.92)",
      padding: "6px 13px", backdropFilter: "blur(8px)",
      boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
      whiteSpace: "nowrap",
    }}>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="var(--primary)">
        <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
      </svg>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--foreground)" }}>
        {label}
      </span>
    </div>
  );
}

function TerminalCard() {
  return (
    <div style={{ width: CARD_W, height: CARD_H, borderRadius: 16, background: "#0f1115", padding: "16px 18px", fontFamily: "var(--font-mono)", fontSize: 11, color: "white", boxShadow: "0 20px 48px rgba(0,0,0,0.28)", border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 12 }}>
        <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#ff5f56", display: "inline-block" }} />
        <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#ffbd2e", display: "inline-block" }} />
        <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#27c93f", display: "inline-block" }} />
        <span style={{ marginLeft: 8, fontSize: 10, color: "rgba(255,255,255,0.32)" }}>gcp-sandbox-04 · ready</span>
      </div>
      <div style={{ lineHeight: 1.8, fontSize: 10.5 }}>
        <div><span style={{ color: "rgba(255,255,255,0.3)" }}>$</span> gcloud compute instances create web-tier \</div>
        <div style={{ paddingLeft: 14, color: "rgba(255,255,255,0.55)" }}>--machine-type=e2-medium --zone=us-central1-a</div>
        <div style={{ color: "#7ee787" }}>✓ Instance web-tier provisioned (4.2s)</div>
        <div><span style={{ color: "rgba(255,255,255,0.3)" }}>$</span> kubectl apply -f deployment.yaml</div>
        <div style={{ color: "#7ee787" }}>✓ 3/3 pods running</div>
        <div style={{ color: "#ffa657" }}>→ Mission objective unlocked: Load balancer</div>
      </div>
    </div>
  );
}

function MissionCard() {
  return (
    <div style={{ width: CARD_W, height: CARD_H, borderRadius: 16, overflow: "hidden", position: "relative", boxShadow: "0 20px 48px rgba(0,0,0,0.28)" }}>
      <img src={cloudImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.1) 55%, transparent 100%)" }} />
      <div style={{ position: "absolute", top: 10, left: 10, display: "inline-flex", alignItems: "center", gap: 5, borderRadius: 999, background: "rgba(255,255,255,0.14)", padding: "4px 10px", backdropFilter: "blur(6px)" }}>
        <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#7ee787", display: "inline-block" }} />
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.06em", textTransform: "uppercase", color: "white" }}>Intermediate · 60 min</span>
      </div>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "14px 16px" }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "white", lineHeight: 1.25, marginBottom: 8 }}>Deploy a multi-tier app on GKE</div>
        <div style={{ display: "inline-block", borderRadius: 8, background: "rgba(255,255,255,0.14)", padding: "5px 11px", fontSize: 10.5, color: "white", backdropFilter: "blur(6px)" }}>
          Launch mission →
        </div>
      </div>
    </div>
  );
}

function GradeCard() {
  return (
    <div style={{ width: CARD_W, height: CARD_H, borderRadius: 16, background: "white", padding: "18px 20px", boxShadow: "0 20px 48px rgba(0,0,0,0.10)", border: "1px solid rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>Mission graded</span>
        <span style={{ borderRadius: 999, background: "#e8f5ee", padding: "2px 9px", fontSize: 9.5, fontWeight: 700, letterSpacing: "0.05em", color: "#1a7f3c" }}>PASS</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
            <span style={{ color: "var(--foreground)" }}>Score</span>
            <span style={{ fontWeight: 600, color: "var(--ink)" }}>92 / 100</span>
          </div>
          <div style={{ height: 5, borderRadius: 999, background: "var(--muted)", overflow: "hidden" }}>
            <div style={{ width: "92%", height: "100%", borderRadius: 999, background: "var(--primary)" }} />
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
          <span style={{ color: "var(--foreground)" }}>Skill XP</span>
          <span style={{ fontWeight: 600, color: "var(--primary)" }}>+ 240 XP</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
          <span style={{ color: "var(--foreground)" }}>Next badge</span>
          <span style={{ fontWeight: 500, color: "var(--ink)" }}>GKE Architect</span>
        </div>
      </div>
      <div style={{ borderRadius: 10, background: "var(--ink)", padding: "9px 0", textAlign: "center", fontSize: 11.5, fontWeight: 500, color: "white", cursor: "pointer" }}>
        View feedback
      </div>
    </div>
  );
}

function Hero() {
  const [progress, setProgress] = useState(0);
  const DURATION = 2400;

  useEffect(() => {
    let raf: number;
    const timeout = setTimeout(() => {
      let start: number | null = null;
      function tick(ts: number) {
        if (!start) start = ts;
        const p = Math.min((ts - start) / DURATION, 1);
        const eased = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
        setProgress(eased);
        if (p < 1) raf = requestAnimationFrame(tick);
      }
      raf = requestAnimationFrame(tick);
    }, 600);
    return () => { clearTimeout(timeout); cancelAnimationFrame(raf); };
  }, []);

  const show = PILL_FRACS.map((f) => progress >= f);
  const dashOffset = PATH_LEN * (1 - progress);
  const dotX = Math.min(progress * 1060, 1000);
  const dotY = progress < 0.07 ? 20 + (LINE_Y - 20) * (progress / 0.07) : LINE_Y;

  const CANVAS_H = 120 + 16 + CARD_H + 20;

  const cardFade = (show: boolean, delay = 0): React.CSSProperties => ({
    opacity: show ? 1 : 0,
    transform: show ? "translateY(0)" : "translateY(20px)",
    transition: `opacity 0.6s ease ${delay}ms, transform 0.6s cubic-bezier(0.34,1.4,0.64,1) ${delay}ms`,
  });

  return (
    <section className="mx-auto max-w-7xl px-6 pb-28 pt-6">
      <div style={{ position: "relative", width: "100%", height: CANVAS_H }}>
        <svg
          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: 120, overflow: "visible", pointerEvents: "none" }}
          viewBox="0 0 1000 120"
          preserveAspectRatio="none"
          fill="none"
        >
          <defs>
            <linearGradient id="hg" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="var(--primary)" stopOpacity="0.15" />
              <stop offset="50%"  stopColor="var(--primary)" stopOpacity="0.65" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.9" />
            </linearGradient>
          </defs>
          <path d={PATH_STR} stroke="var(--border)" strokeWidth="1.4" />
          <path d={PATH_STR} stroke="url(#hg)" strokeWidth="2" strokeLinecap="round"
            strokeDasharray={PATH_LEN} strokeDashoffset={dashOffset} />
          {progress > 0.02 && progress < 0.995 && (
            <>
              <circle cx={dotX} cy={dotY} r="7" fill="var(--primary)" opacity="0.15" />
              <circle cx={dotX} cy={dotY} r="3.5" fill="var(--primary)" />
            </>
          )}
          {PILL_FRACS.map((f, i) => (
            <line key={i}
              x1={f * 1000} y1={LINE_Y - 8} x2={f * 1000} y2={LINE_Y + 8}
              stroke="var(--primary)" strokeWidth="1.5"
              opacity={progress >= f ? 0.7 : 0}
              style={{ transition: "opacity 0.3s" }}
            />
          ))}
        </svg>

        {[
          { label: "PROVISION ENV",     frac: PILL_FRACS[0], show: show[0] },
          { label: "RECOMMEND MISSION", frac: PILL_FRACS[1], show: show[1] },
          { label: "GRADE SUBMISSION",  frac: PILL_FRACS[2], show: show[2] },
        ].map(({ label, frac, show: s }, i) => (
          <div key={label} style={{
            position: "absolute",
            left: `${frac * 100}%`,
            top: 66,
            transform: "translateX(-50%)",
            opacity: s ? 1 : 0,
            transition: `opacity 0.35s ease ${i * 80}ms`,
            zIndex: 2,
          }}>
            <Pill label={label} />
          </div>
        ))}

        {[
          { Card: TerminalCard, frac: PILL_FRACS[0], show: show[0] },
          { Card: MissionCard,  frac: PILL_FRACS[1], show: show[1] },
          { Card: GradeCard,    frac: PILL_FRACS[2], show: show[2] },
        ].map(({ Card, frac, show: s }, i) => (
          <div key={i} style={{
            position: "absolute",
            left: `${frac * 100}%`,
            top: 136,
            transform: "translateX(-50%)",
            ...cardFade(s, 100),
          }}>
            <Card />
          </div>
        ))}
      </div>

      <div className="mt-8">
        <h1 className="font-display text-[clamp(3rem,9vw,8.5rem)] font-medium leading-[0.92] tracking-[-0.04em] text-ink">
          Cloud skills that<br />ship to production
        </h1>
        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-2">
          <p className="max-w-xl text-[17px] leading-relaxed text-foreground">
            CloudFlight is the AI-native training platform for engineering teams.
            Personalised missions on live GCP environments, automatic grading,
            and learner analytics that show exactly who is ready to ship.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/login" className="btn-primary">Start a mission</Link>
            <button className="btn-ghost inline-flex items-center gap-2">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor"><path d="M2 1l9 5-9 5z" /></svg>
              Book a team demo
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   TRACK CARDS — clean, minimal, professional
══════════════════════════════════════════════════════════════════ */

const TRACK_ICONS_LUCIDE: Record<string, React.ReactNode> = {
  compute:      <Cpu      strokeWidth={1.5} />,
  storage:      <Database strokeWidth={1.5} />,
  networking:   <Wifi     strokeWidth={1.5} />,
  security:     <Lock     strokeWidth={1.5} />,
  devops:       <Rocket   strokeWidth={1.5} />,
  architecture: <Layout   strokeWidth={1.5} />,
};

const TRACK_THEME: Record<string, {
  bg: string; border: string; iconBg: string; iconColor: string;
  accent: string; labelColor: string; tier: string; missions: number; avg: number;
}> = {
  compute:      { bg: "#f0f4ff", border: "#c7d7fc", iconBg: "#dbe6ff", iconColor: "#3b6ef8", accent: "#3b6ef8", labelColor: "#3b6ef8", tier: "Tier I",   missions: 22, avg: 89 },
  storage:      { bg: "#f0faf4", border: "#b9eecf", iconBg: "#d4f5e2", iconColor: "#1e8a4a", accent: "#1e8a4a", labelColor: "#1e8a4a", tier: "Tier I",   missions: 18, avg: 71 },
  networking:   { bg: "#f0faff", border: "#b9e6fa", iconBg: "#d0f0fc", iconColor: "#0891b2", accent: "#0891b2", labelColor: "#0891b2", tier: "Tier II",  missions: 20, avg: 86 },
  security:     { bg: "#fff4f4", border: "#fccfcf", iconBg: "#ffe3e3", iconColor: "#dc2626", accent: "#dc2626", labelColor: "#dc2626", tier: "Tier II",  missions: 24, avg: 93 },
  devops:       { bg: "#f7f0ff", border: "#dac5fc", iconBg: "#e8d5ff", iconColor: "#7c3aed", accent: "#7c3aed", labelColor: "#7c3aed", tier: "Tier III", missions: 26, avg: 78 },
  architecture: { bg: "#fffbf0", border: "#f5dfa0", iconBg: "#fef0c0", iconColor: "#b45309", accent: "#b45309", labelColor: "#b45309", tier: "Tier III", missions: 30, avg: 84 },
};

function TrackCard({ track }: { track: typeof learningTracks[0] }) {
  const theme = TRACK_THEME[track.id] ?? TRACK_THEME.compute;
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: 20,
        border: `1px solid ${hovered ? theme.accent : theme.border}`,
        background: hovered ? theme.bg : "var(--background)",
        padding: "24px 22px",
        display: "flex",
        flexDirection: "column",
        gap: 0,
        cursor: "pointer",
        transition: "all 0.22s ease",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        boxShadow: hovered
          ? `0 12px 32px rgba(0,0,0,0.08), 0 0 0 1px ${theme.accent}22`
          : "0 1px 4px rgba(0,0,0,0.04)",
      }}
    >
      {/* Tier label */}
      <div style={{
        fontFamily: "var(--font-mono)",
        fontSize: "0.5rem",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: theme.labelColor,
        marginBottom: 14,
        opacity: 0.8,
      }}>
        {theme.tier}
      </div>

      {/* Icon */}
      <div style={{
        width: 44,
        height: 44,
        borderRadius: 12,
        background: theme.iconBg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: theme.iconColor,
        marginBottom: 16,
        transition: "transform 0.22s ease",
        transform: hovered ? "scale(1.08)" : "scale(1)",
      }}>
        <div style={{ width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {TRACK_ICONS_LUCIDE[track.id]}
        </div>
      </div>

      {/* Name */}
      <div style={{
        fontSize: 16,
        fontWeight: 650,
        color: "var(--ink)",
        letterSpacing: "-0.02em",
        marginBottom: 6,
      }}>
        {track.name}
      </div>

      {/* Description */}
      <div style={{
        fontSize: 12,
        color: "var(--foreground)",
        lineHeight: 1.55,
        marginBottom: 20,
        flex: 1,
      }}>
        {track.description}
      </div>

      {/* Footer stats row */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: 14,
        borderTop: `1px solid ${theme.border}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: theme.accent,
          }} />
          <span style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.5rem",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--foreground)",
          }}>
            {theme.missions} missions
          </span>
        </div>
        <span style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.5rem",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: theme.accent,
          fontWeight: 600,
        }}>
          {theme.avg}% avg
        </span>
      </div>
    </div>
  );
}

function Tracks() {
  return (
    <section id="tracks" className="mx-auto max-w-7xl px-6 py-24">
      <div className="mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
        <div>
          <div className="mono-label mb-3">SIX TRACKS · 140+ MISSIONS</div>
          <h2 className="font-display text-[clamp(2rem,5vw,3.5rem)] font-medium leading-[1] tracking-[-0.03em] text-ink">
            Skill paths mapped to the<br />work your team actually ships.
          </h2>
        </div>
        <p className="max-w-sm text-[15px] text-foreground">
          Hover to preview · click to explore each track.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {learningTracks.map((t) => <TrackCard key={t.id} track={t} />)}
      </div>
      <div className="mt-10 flex justify-center">
        <Link to="/login" className="btn-primary">View all missions</Link>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   DASHBOARD SHOWCASE
══════════════════════════════════════════════════════════════════ */
const ORBIT_TRACKS = [
  { label: "Compute",  pct: 89, color: "#5B8EF0", angle: 0   },
  { label: "Security", pct: 93, color: "#34A853", angle: 60  },
  { label: "Network",  pct: 86, color: "#38bdf8", angle: 120 },
  { label: "Storage",  pct: 71, color: "#f87171", angle: 180 },
  { label: "DevOps",   pct: 78, color: "#a78bfa", angle: 240 },
  { label: "Arch",     pct: 84, color: "#fbbf24", angle: 300 },
];

function OrbitRing() {
  const [angle, setAngle] = useState(0);
  const rafRef = useRef<number>(0);
  const prevRef = useRef<number | null>(null);

  useEffect(() => {
    function tick(ts: number) {
      if (!prevRef.current) prevRef.current = ts;
      const dt = ts - prevRef.current;
      prevRef.current = ts;
      setAngle(a => (a + dt * 0.018) % 360);
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const R1 = 110, R2 = 160;
  const cx = 180, cy = 180;

  return (
    <div style={{ position: "relative", width: 360, height: 360, flexShrink: 0 }}>
      <svg width="360" height="360" viewBox="0 0 360 360" fill="none">
        <circle cx={cx} cy={cy} r={R2} stroke="rgba(74,108,247,0.12)" strokeWidth="1" />
        <circle cx={cx} cy={cy} r={R1} stroke="rgba(74,108,247,0.08)" strokeWidth="1" />
        <circle cx={cx} cy={cy} r={R2} stroke="url(#arcGrad)" strokeWidth="2" strokeDasharray="80 920"
          strokeLinecap="round"
          style={{ transform: `rotate(${angle}deg)`, transformOrigin: `${cx}px ${cy}px` }} />
        <circle cx={cx} cy={cy} r={R1} stroke="url(#arcGrad2)" strokeWidth="1.5" strokeDasharray="50 640"
          strokeLinecap="round"
          style={{ transform: `rotate(${-angle * 0.6}deg)`, transformOrigin: `${cx}px ${cy}px` }} />
        <defs>
          <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4a6cf7" stopOpacity="0" />
            <stop offset="50%" stopColor="#4a6cf7" stopOpacity="1" />
            <stop offset="100%" stopColor="#4a6cf7" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="arcGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity="0" />
            <stop offset="50%" stopColor="#a78bfa" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ORBIT_TRACKS.map((t) => {
          const theta = ((t.angle + angle) * Math.PI) / 180;
          const x = cx + R2 * Math.cos(theta);
          const y = cy + R2 * Math.sin(theta);
          return (
            <g key={t.label}>
              <circle cx={x} cy={y} r="22" fill="white" stroke={t.color} strokeWidth="1.5"
                style={{ filter: `drop-shadow(0 2px 8px ${t.color}55)` }} />
              <text x={x} y={y + 4} textAnchor="middle" fontSize="9" fontWeight="700" fill={t.color} fontFamily="var(--font-mono)">{t.pct}%</text>
              <text x={x} y={y + 14} textAnchor="middle" fontSize="7" fill="var(--foreground)" fontFamily="var(--font-mono)" letterSpacing="0.05em">{t.label}</text>
            </g>
          );
        })}
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2 }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 38, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.04em", lineHeight: 1 }}>84%</div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--foreground)" }}>Avg score</div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", color: "#16a34a", marginTop: 2 }}>↑ TOP 18%</div>
      </div>
    </div>
  );
}

function MiniBarChart() {
  const data = [
    { m: "Jan", v: 72 }, { m: "Feb", v: 75 }, { m: "Mar", v: 78 },
    { m: "Apr", v: 82 }, { m: "May", v: 87 }, { m: "Jun", v: 92 },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>Score Momentum</div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 52 }}>
        {data.map((d, i) => (
          <div key={d.m} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <div style={{ width: "100%", height: `${(d.v / 100) * 44}px`, borderRadius: "3px 3px 0 0", background: i === data.length - 1 ? "var(--primary)" : "var(--muted)", transition: "height 1s ease" }} />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.42rem", color: i === data.length - 1 ? "var(--primary)" : "var(--muted-foreground)" }}>{d.m[0]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniGapBars() {
  const bars = [
    { label: "GCP Core", curr: 85, prev: 60, color: "#4a6cf7" },
    { label: "Security", curr: 93, prev: 75, color: "#34A853" },
    { label: "DevOps",   curr: 72, prev: 50, color: "#f87171" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>Skill Gap Analysis</div>
      {bars.map((b) => (
        <div key={b.label}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, marginBottom: 4 }}>
            <span style={{ color: "var(--ink)", fontWeight: 500 }}>{b.label}</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: b.color }}>{b.curr}%</span>
          </div>
          <div style={{ height: 4, borderRadius: 999, background: "var(--muted)", overflow: "hidden", position: "relative" }}>
            <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${b.prev}%`, borderRadius: 999, background: "rgba(0,0,0,0.1)" }} />
            <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${b.curr}%`, borderRadius: 999, background: b.color }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function DashboardShowcase() {
  return (
    <section className="border-y border-border bg-surface py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="mono-label mb-3">LIVE ANALYTICS DASHBOARD</div>
            <h2 className="font-display text-[clamp(2rem,5vw,3.5rem)] font-medium leading-[1] tracking-[-0.03em] text-ink">
              Every metric tells you<br />what to do next.
            </h2>
            <p className="mt-5 text-[16px] leading-relaxed text-foreground max-w-md">
              Not just scores — skill gaps, momentum curves, proficiency targets, and AI-ranked mission queues. Your engineers always know what to work on and why.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/login" className="btn-primary">See your dashboard</Link>
              <Link to="/login" className="btn-ghost">View sample report</Link>
            </div>
            <div className="mt-8 space-y-3">
              {[
                "Skill gap bars show before vs. after — not vanity metrics",
                "Score momentum tracked month-over-month with peer percentile",
                "AI mission queue ranked by impact on your weakest skills",
              ].map((t) => (
                <div key={t} className="flex items-start gap-2.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0" stroke="var(--primary)" strokeWidth="2.5">
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-[14px] text-foreground">{t}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", inset: -20, borderRadius: 32, background: "radial-gradient(ellipse at 60% 40%, rgba(74,108,247,0.08), transparent 70%)", pointerEvents: "none" }} />
            <div style={{ borderRadius: 20, border: "1px solid var(--border)", background: "var(--background)", overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.10)", position: "relative" }}>
              <div style={{ borderBottom: "1px solid var(--border)", padding: "12px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <svg width="16" height="16" viewBox="0 0 28 28" fill="none"><path d="M4 22 L14 4 L24 22 L18 22 L14 14 L10 22 Z" fill="var(--primary)" /></svg>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)" }}>PROPEL</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "white", fontWeight: 700 }}>AJ</div>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", letterSpacing: "0.05em", color: "var(--foreground)" }}>ALEX JOHNSON</span>
                </div>
              </div>
              <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  {[
                    { label: "Success rate",  val: "89%",     delta: "↑ 5%",   up: true  },
                    { label: "Missions done", val: "28",      delta: "+2 wk",  up: true  },
                    { label: "Weakest track", val: "Storage", delta: "71%",    up: false },
                  ].map((m) => (
                    <div key={m.label} style={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface)", padding: "10px 12px" }}>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.48rem", letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--muted-foreground)", marginBottom: 4 }}>{m.label}</div>
                      <div style={{ fontSize: 18, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.03em", lineHeight: 1 }}>{m.val}</div>
                      <div style={{ fontSize: 9, marginTop: 4, color: m.up ? "#16a34a" : "#dc2626", fontFamily: "var(--font-mono)" }}>{m.delta}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface)", padding: "12px 14px" }}><MiniBarChart /></div>
                  <div style={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface)", padding: "12px 14px" }}><MiniGapBars /></div>
                </div>
                <div style={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface)", padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 22, height: 22, borderRadius: 6, background: "rgba(74,108,247,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="var(--primary)"><path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" /></svg>
                    </div>
                    <div>
                      <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--ink)" }}>CI/CD Pipeline with Cloud Build</div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.48rem", color: "var(--foreground)", marginTop: 1 }}>AI PICK · closes DevOps gap</div>
                    </div>
                  </div>
                  <div style={{ borderRadius: 8, background: "var(--primary)", padding: "5px 12px", fontSize: 10.5, fontWeight: 600, color: "white", whiteSpace: "nowrap" }}>Start →</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   ORBIT SECTION
══════════════════════════════════════════════════════════════════ */
function OrbitSection() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
        <div>
          <div className="mono-label mb-3">LEARNER NETWORK</div>
          <h2 className="font-display text-[clamp(2rem,5vw,3.5rem)] font-medium leading-[1] tracking-[-0.03em] text-ink">
            6 tracks.<br />Every skill in orbit.
          </h2>
          <p className="mt-5 max-w-md text-[16px] leading-relaxed text-foreground">
            Every track is live-monitored. Your weakest skill pulls the next mission. Your strongest skill earns the next badge. The engine never stops optimising.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/login" className="btn-primary">Start your orbit</Link>
          </div>
        </div>
        <div className="flex justify-center">
          <OrbitRing />
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   HOW IT WORKS
══════════════════════════════════════════════════════════════════ */
function HowItWorks() {
  const steps = [
    { n: "01", title: "We profile your engineers",     body: "A 10-minute baseline mission scores each learner across the six tracks. No multiple choice — actual cloud work." },
    { n: "02", title: "AI assigns the next mission",   body: "Our recommender weighs gaps, recency, team objectives, and difficulty curve to pick what unlocks the most growth." },
    { n: "03", title: "Live GCP sandbox spins up",     body: "An isolated, budget-capped environment provisions in under 30 seconds. Real services, real bills (we pay)." },
    { n: "04", title: "Automatic grading + AI mentor", body: "Submissions are graded against infrastructure state, not screenshots. The mentor explains every deduction." },
  ];
  return (
    <section id="how" className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <div className="mono-label mb-3">HOW IT WORKS</div>
        <h2 className="max-w-3xl font-display text-[clamp(2rem,5vw,3.5rem)] font-medium leading-[1] tracking-[-0.03em] text-ink">
          From baseline to billable, in four steps.
        </h2>
        <div className="mt-16 grid grid-cols-1 gap-12 md:grid-cols-2">
          {steps.map((s) => (
            <div key={s.n} className="flex gap-6 border-t border-border pt-8">
              <div className="mono-label !text-[0.85rem] !text-primary">{s.n}</div>
              <div>
                <h3 className="font-display text-[22px] font-semibold text-ink">{s.title}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-foreground">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   STATS / TEAMS
══════════════════════════════════════════════════════════════════ */
function Teams() {
  const stats = [
    { value: "3.4×",  label: "faster onboarding for cloud-new hires" },
    { value: "87%",   label: "average mission pass rate after 30 days" },
    { value: "<60s", label: "to spin up an isolated GCP sandbox" },
    { value: "6 tracks",  label: "missions across compute, data, security, DevOps" },
  ];
  return (
    <section id="teams" className="mx-auto max-w-7xl px-6 py-24">
      <div className="grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label}>
            <div className="font-display text-[clamp(2.5rem,5vw,4rem)] font-medium leading-none tracking-[-0.04em] text-ink">{s.value}</div>
            <div className="mt-3 text-[13px] leading-snug text-foreground">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   CTA + FOOTER
══════════════════════════════════════════════════════════════════ */
function CTA() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-24">
      <div className="rounded-[2rem] bg-ink p-12 text-white md:p-16">
        <h2 className="max-w-3xl font-display text-[clamp(2rem,5vw,3.5rem)] font-medium leading-[1] tracking-[-0.03em]">
          Stop teaching cloud with slides.<br />Start grading on real infrastructure.
        </h2>
        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Link to="/login" className="rounded-full bg-primary px-6 py-3.5 text-[15px] font-medium text-white hover:opacity-90">
            Start a mission
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="mx-auto max-w-7xl border-t border-border px-6 py-10">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <Logo />
        <p className="mono-label">© 2026 CLOUDFLIGHT — BUILT FOR ENGINEERS WHO SHIP</p>
      </div>
    </footer>
  );
}

/* ══════════════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════════════ */
function Landing() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Nav />
      <Hero />
      <Tracks />
      <DashboardShowcase />
      <OrbitSection />
      <HowItWorks />
      <Teams />
      <CTA />
      <Footer />
    </main>
  );
}