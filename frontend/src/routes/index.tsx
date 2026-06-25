// import { createFileRoute, Link } from "@tanstack/react-router";
// import cloudImage from "@/assets/cloud-arch.jpg";
// import { learningTracks } from "../data/mockData";

// export const Route = createFileRoute("/")({
//   head: () => ({
//     meta: [
//       { title: "CloudFlight — Cloud skills that ship to production" },
//       { name: "description", content: "AI-native cloud training platform with live GCP environments, automatic grading, and real-time mentorship." },
//     ],
//   }),
//   component: Landing,
// });

// function Logo() {
//   return (
//     <div className="flex items-center gap-2">
//       <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
//         <path d="M4 22 L14 4 L24 22 L18 22 L14 14 L10 22 Z" fill="var(--primary)" />
//       </svg>
//       <span className="text-xl font-semibold tracking-tight text-ink">cloudflight</span>
//     </div>
//   );
// }

// function Nav() {
//   return (
//     <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
//       <Logo />
//       <nav className="hidden items-center gap-10 md:flex">
//         <a className="text-[15px] text-foreground hover:opacity-70" href="#tracks">Tracks</a>
//         <a className="text-[15px] text-foreground hover:opacity-70" href="#how">How it works</a>
//         <a className="text-[15px] text-foreground hover:opacity-70" href="#teams">For teams</a>
//       </nav>
//       <div className="flex items-center gap-5">
//         <Link to="/login" className="hidden text-[15px] text-foreground hover:opacity-70 md:inline">Sign in</Link>
//         <Link to="/login" className="btn-primary">Start free mission</Link>
//       </div>
//     </header>
//   );
// }

// function Pill({ label }: { label: string }) {
//   return (
//     <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-3 py-1.5 backdrop-blur">
//       <svg width="11" height="11" viewBox="0 0 24 24" fill="var(--primary)">
//         <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
//       </svg>
//       <span className="mono-label !text-[0.62rem] text-foreground">{label}</span>
//     </div>
//   );
// }

// function TerminalCard() {
//   return (
//     <div className="w-[340px] rounded-2xl bg-[#0f1115] p-4 font-mono text-[12px] text-white shadow-2xl shadow-black/30">
//       <div className="mb-3 flex items-center gap-1.5">
//         <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
//         <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
//         <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
//         <span className="ml-3 text-[11px] text-white/40">gcp-sandbox-04 · ready</span>
//       </div>
//       <div className="space-y-1 leading-relaxed">
//         <div><span className="text-white/40">$</span> gcloud compute instances create web-tier \</div>
//         <div className="pl-3 text-white/70">--machine-type=e2-medium --zone=us-central1-a</div>
//         <div className="text-[#7ee787]">✓ Instance web-tier provisioned (4.2s)</div>
//         <div><span className="text-white/40">$</span> kubectl apply -f deployment.yaml</div>
//         <div className="text-[#7ee787]">✓ 3/3 pods running</div>
//         <div className="text-[#ffa657]">→ Mission objective unlocked: Load balancer</div>
//       </div>
//     </div>
//   );
// }

// function MissionCard() {
//   return (
//     <div className="relative w-[280px] overflow-hidden rounded-3xl shadow-2xl shadow-black/30">
//       <img src={cloudImage} alt="Cloud architecture" className="h-[360px] w-full object-cover" />
//       <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
//       <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-white backdrop-blur">
//         <span className="h-1.5 w-1.5 rounded-full bg-[#7ee787]" /> Intermediate · 60 min
//       </div>
//       <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
//         <h3 className="font-display text-[20px] font-semibold leading-[1.1]">Deploy a multi-tier app on GKE</h3>
//         <Link to="/login" className="mt-3 inline-block rounded-md bg-white/15 px-3 py-1.5 text-[12px] font-medium backdrop-blur hover:bg-white/25">
//           Launch mission →
//         </Link>
//       </div>
//     </div>
//   );
// }

// function ProgressCard() {
//   return (
//     <div className="w-[240px] rounded-2xl bg-white p-5 shadow-2xl shadow-black/10">
//       <div className="flex items-center justify-between">
//         <h4 className="font-display text-[15px] font-semibold text-ink">Mission graded</h4>
//         <span className="rounded-full bg-[#e8f5ee] px-2 py-0.5 text-[10px] font-semibold text-[#1a7f3c]">PASS</span>
//       </div>
//       <div className="mt-4 space-y-3">
//         <div>
//           <div className="flex items-center justify-between text-[12px]">
//             <span className="text-foreground">Score</span>
//             <span className="font-semibold text-ink">92 / 100</span>
//           </div>
//           <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
//             <div className="h-full w-[92%] rounded-full bg-primary" />
//           </div>
//         </div>
//         <div className="flex items-center justify-between text-[12px]">
//           <span className="text-foreground">Skill XP</span>
//           <span className="font-semibold text-primary">+ 240 XP</span>
//         </div>
//         <div className="flex items-center justify-between text-[12px]">
//           <span className="text-foreground">Next badge</span>
//           <span className="font-medium text-ink">GKE Architect</span>
//         </div>
//       </div>
//       <Link to="/login" className="mt-5 block w-full rounded-xl bg-ink py-2.5 text-center text-[12px] font-medium text-white hover:opacity-90">
//         View feedback
//       </Link>
//     </div>
//   );
// }

// function Hero() {
//   return (
//     <section className="relative mx-auto max-w-7xl px-6 pb-24 pt-12">
//       <div className="relative min-h-[440px]">
//         <svg className="absolute inset-0 h-full w-full" viewBox="0 0 800 440" preserveAspectRatio="none" fill="none">
//           <path d="M 0 30 L 120 30 Q 150 30 150 60 L 150 120 Q 150 150 180 150 L 800 150" stroke="var(--primary)" strokeWidth="1.5" opacity="0.5" />
//         </svg>
//         <div className="absolute left-[14%] top-[125px] flex items-center gap-6">
//           <Pill label="PROVISION ENV" />
//           <Pill label="RECOMMEND MISSION" />
//           <Pill label="GRADE SUBMISSION" />
//         </div>
//         <div className="absolute left-0 top-[190px]"><TerminalCard /></div>
//         <div className="absolute left-[38%] top-[165px]"><MissionCard /></div>
//         <div className="absolute right-0 top-[200px]"><ProgressCard /></div>
//       </div>

//       <div className="mt-36 lg:mt-44">
//         <h1 className="font-display text-[clamp(3rem,10vw,9rem)] font-medium leading-[0.92] tracking-[-0.04em] text-ink">
//           Cloud skills that
//           <br />ship to production
//         </h1>
//         <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-2">
//           <p className="max-w-xl text-[17px] leading-relaxed text-foreground">
//             CloudFlight is the AI-native training platform for engineering teams.
//             Personalized missions on live GCP environments, automatic grading,
//             and learner analytics that show exactly who is ready to ship — and who needs another rep.
//           </p>
//           <div className="flex flex-wrap items-center gap-3">
//             <Link to="/login" className="btn-primary">Start a free mission</Link>
//             <button className="btn-ghost inline-flex items-center gap-2">
//               <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M2 1l9 5-9 5z" /></svg>
//               Book a team demo
//             </button>
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// }

// function Tracks() {
//   return (
//     <section id="tracks" className="mx-auto max-w-7xl px-6 py-24">
//       <div className="mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
//         <div>
//           <div className="mono-label mb-3">SIX TRACKS · 140+ MISSIONS</div>
//           <h2 className="font-display text-[clamp(2rem,5vw,3.5rem)] font-medium leading-[1] tracking-[-0.03em] text-ink">
//             Skill paths mapped to the
//             <br />work your team actually ships.
//           </h2>
//         </div>
//         <p className="max-w-sm text-[15px] text-foreground">
//           Every track ends with a capstone mission graded against the same rubric your hiring panel uses.
//         </p>
//       </div>
//       <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
//         {learningTracks.map((t) => (
//           <Link
//             key={t.id}
//             to="/login"
//             className="group rounded-3xl border border-border bg-surface p-7 transition hover:border-primary/40 hover:bg-background"
//           >
//             <div className="text-3xl">{t.icon}</div>
//             <h3 className="mt-5 font-display text-[22px] font-semibold text-ink">{t.name}</h3>
//             <p className="mt-2 text-[14px] leading-relaxed text-foreground">{t.description}</p>
//             <div className="mono-label mt-6 inline-flex items-center gap-1.5 text-primary opacity-0 transition group-hover:opacity-100">
//               Explore track →
//             </div>
//           </Link>
//         ))}
//       </div>
//       <div className="mt-10 flex justify-center">
//         <Link to="/login" className="btn-primary">View learner analytics</Link>
//       </div>
//     </section>
//   );
// }

// function HowItWorks() {
//   const steps = [
//     { n: "01", title: "We profile your engineers", body: "A 10-minute baseline mission scores each learner across the six tracks. No multiple choice — actual cloud work." },
//     { n: "02", title: "AI assigns the next mission", body: "Our recommender weighs gaps, recency, team objectives, and difficulty curve to pick what unlocks the most growth." },
//     { n: "03", title: "Live GCP sandbox spins up", body: "An isolated, budget-capped environment provisions in under 30 seconds. Real services, real bills (we pay)." },
//     { n: "04", title: "Automatic grading + AI mentor", body: "Submissions are graded against infrastructure state, not screenshots. The mentor explains every deduction." },
//   ];
//   return (
//     <section id="how" className="border-t border-border bg-surface">
//       <div className="mx-auto max-w-7xl px-6 py-24">
//         <div className="mono-label mb-3">HOW IT WORKS</div>
//         <h2 className="max-w-3xl font-display text-[clamp(2rem,5vw,3.5rem)] font-medium leading-[1] tracking-[-0.03em] text-ink">
//           From baseline to billable, in four steps.
//         </h2>
//         <div className="mt-16 grid grid-cols-1 gap-12 md:grid-cols-2">
//           {steps.map((s) => (
//             <div key={s.n} className="flex gap-6 border-t border-border pt-8">
//               <div className="mono-label !text-[0.85rem] !text-primary">{s.n}</div>
//               <div>
//                 <h3 className="font-display text-[22px] font-semibold text-ink">{s.title}</h3>
//                 <p className="mt-3 text-[15px] leading-relaxed text-foreground">{s.body}</p>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </section>
//   );
// }

// function Teams() {
//   const stats = [
//     { value: "3.4×", label: "faster onboarding for cloud-new hires" },
//     { value: "87%", label: "average mission pass rate after 30 days" },
//     { value: "< 30s", label: "to spin up an isolated GCP sandbox" },
//     { value: "140+", label: "missions across compute, data, security, DevOps" },
//   ];
//   return (
//     <section id="teams" className="mx-auto max-w-7xl px-6 py-24">
//       <div className="grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-4">
//         {stats.map((s) => (
//           <div key={s.label}>
//             <div className="font-display text-[clamp(2.5rem,5vw,4rem)] font-medium leading-none tracking-[-0.04em] text-ink">{s.value}</div>
//             <div className="mt-3 text-[13px] leading-snug text-foreground">{s.label}</div>
//           </div>
//         ))}
//       </div>
//     </section>
//   );
// }

// function CTA() {
//   return (
//     <section className="mx-auto max-w-7xl px-6 pb-24">
//       <div className="rounded-[2rem] bg-ink p-12 text-white md:p-16">
//         <h2 className="max-w-3xl font-display text-[clamp(2rem,5vw,3.5rem)] font-medium leading-[1] tracking-[-0.03em]">
//           Stop teaching cloud with slides.
//           Start grading on real infrastructure.
//         </h2>
//         <div className="mt-10 flex flex-wrap items-center gap-3">
//           <Link to="/login" className="rounded-full bg-primary px-6 py-3.5 text-[15px] font-medium text-white hover:opacity-90">
//             Start a free mission
//           </Link>
//           <button className="rounded-full border border-white/20 px-6 py-3.5 text-[15px] font-medium hover:bg-white/5">
//             Book a team demo
//           </button>
//         </div>
//       </div>
//     </section>
//   );
// }

// function Footer() {
//   return (
//     <footer className="mx-auto max-w-7xl border-t border-border px-6 py-10">
//       <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
//         <Logo />
//         <p className="mono-label">© 2026 CLOUDFLIGHT — BUILT FOR ENGINEERS WHO SHIP</p>
//       </div>
//     </footer>
//   );
// }

// function Landing() {
//   return (
//     <main className="min-h-screen bg-background text-foreground">
//       <Nav />
//       <Hero />
//       <Tracks />
//       <HowItWorks />
//       <Teams />
//       <CTA />
//       <Footer />
//     </main>
//   );
// }



import { createFileRoute, Link } from "@tanstack/react-router";
import cloudImage from "@/assets/cloud-arch.jpg";
import { learningTracks } from "../data/mockData";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CloudFlight — Cloud skills that ship to production" },
      { name: "description", content: "AI-native cloud training platform with live GCP environments, automatic grading, and real-time mentorship." },
    ],
  }),
  component: Landing,
});

/* ─── Logo ──────────────────────────────────────────────────────────────────── */
function Logo() {
  return (
    <div className="flex items-center gap-2">
      <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
        <path d="M4 22 L14 4 L24 22 L18 22 L14 14 L10 22 Z" fill="var(--primary)" />
      </svg>
      <span className="text-xl font-semibold tracking-tight text-ink">cloudflight</span>
    </div>
  );
}

/* ─── Nav ───────────────────────────────────────────────────────────────────── */
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
        <Link to="/login" className="btn-primary">Start free mission</Link>
      </div>
    </header>
  );
}

/* ─── Pill badge that sits ON the line ──────────────────────────────────────── */
function Pill({ label }: { label: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/80 px-3 py-1.5 shadow-sm backdrop-blur-sm">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="var(--primary)">
        <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
      </svg>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--foreground)", whiteSpace: "nowrap" }}>
        {label}
      </span>
    </div>
  );
}

/* ─── Terminal card ─────────────────────────────────────────────────────────── */
function TerminalCard() {
  return (
    <div className="w-[340px] rounded-2xl bg-[#0f1115] p-5 font-mono text-[11.5px] text-white shadow-2xl shadow-black/30 ring-1 ring-white/5">
      <div className="mb-3 flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
        <span className="ml-3 text-[10px] text-white/35">gcp-sandbox-04 · ready</span>
      </div>
      <div className="space-y-1 leading-[1.75]">
        <div><span className="text-white/35">$</span> gcloud compute instances create web-tier \</div>
        <div className="pl-4 text-white/60">--machine-type=e2-medium --zone=us-central1-a</div>
        <div className="text-[#7ee787]">✓ Instance web-tier provisioned (4.2s)</div>
        <div><span className="text-white/35">$</span> kubectl apply -f deployment.yaml</div>
        <div className="text-[#7ee787]">✓ 3/3 pods running</div>
        <div className="text-[#ffa657]">→ Mission objective unlocked: Load balancer</div>
      </div>
    </div>
  );
}

/* ─── Mission card ──────────────────────────────────────────────────────────── */
function MissionCard() {
  return (
    <div className="relative w-[260px] overflow-hidden rounded-3xl shadow-2xl shadow-black/30 ring-1 ring-white/10">
      <img src={cloudImage} alt="Cloud architecture" className="h-[320px] w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
      <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[9px] font-medium uppercase tracking-wider text-white backdrop-blur-sm">
        <span className="h-1.5 w-1.5 rounded-full bg-[#7ee787]" /> Intermediate · 60 min
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
        <h3 className="font-display text-[18px] font-semibold leading-[1.15]">Deploy a multi-tier app on GKE</h3>
        <Link to="/login" className="mt-3 inline-block rounded-lg bg-white/15 px-3 py-1.5 text-[11px] font-medium backdrop-blur-sm hover:bg-white/25 transition">
          Launch mission →
        </Link>
      </div>
    </div>
  );
}

/* ─── Grade card ────────────────────────────────────────────────────────────── */
function GradeCard() {
  return (
    <div className="w-[230px] rounded-2xl bg-white p-5 shadow-2xl shadow-black/10 ring-1 ring-black/5">
      <div className="flex items-center justify-between">
        <h4 className="font-display text-[14px] font-semibold text-ink">Mission graded</h4>
        <span className="rounded-full bg-[#e8f5ee] px-2 py-0.5 text-[9px] font-bold tracking-wide text-[#1a7f3c]">PASS</span>
      </div>
      <div className="mt-4 space-y-3">
        <div>
          <div className="flex items-center justify-between text-[12px] mb-1.5">
            <span className="text-foreground">Score</span>
            <span className="font-semibold text-ink">92 / 100</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-[92%] rounded-full bg-primary" />
          </div>
        </div>
        <div className="flex items-center justify-between text-[12px]">
          <span className="text-foreground">Skill XP</span>
          <span className="font-semibold text-primary">+ 240 XP</span>
        </div>
        <div className="flex items-center justify-between text-[12px]">
          <span className="text-foreground">Next badge</span>
          <span className="font-medium text-ink">GKE Architect</span>
        </div>
      </div>
      <Link to="/login" className="mt-5 block w-full rounded-xl bg-ink py-2.5 text-center text-[12px] font-medium text-white hover:opacity-90 transition">
        View feedback
      </Link>
    </div>
  );
}

/* ─── Hero ──────────────────────────────────────────────────────────────────── */
/*
  Layout (all measured in px at a ~1200px container):
  The line travels LEFT→RIGHT across the full width.
  Three pills sit ON the line at x positions: 20%, 50%, 80%
  The line Y = 80px from top of the hero canvas.

  Cards appear BELOW the line, centered under their pill:
  - Terminal: under pill 1 (left)
  - Mission:  under pill 2 (center)
  - Grade:    under pill 3 (right)

  SVG viewBox = "0 0 1000 90" (just the line + a bit of headroom)
  preserveAspectRatio = "none" so it stretches full width
  Path: horizontal line at y=70 with a small inbound curve from top-left
*/

// Segment fractions where each pill sits on the line (0→1)
const PILL_FRACS = [0.20, 0.50, 0.80];

function Hero() {
  const [progress, setProgress] = useState(0); // 0–1, how far the line has drawn
  const containerRef = useRef<HTMLDivElement>(null);

  const DURATION = 2200; // ms for full line draw

  useEffect(() => {
    let raf: number;
    let start: number | null = null;

    const timeout = setTimeout(() => {
      function tick(ts: number) {
        if (!start) start = ts;
        const p = Math.min((ts - start) / DURATION, 1);
        // ease-in-out cubic
        const eased = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
        setProgress(eased);
        if (p < 1) raf = requestAnimationFrame(tick);
      }
      raf = requestAnimationFrame(tick);
    }, 500);

    return () => { clearTimeout(timeout); cancelAnimationFrame(raf); };
  }, []);

  // Which cards are revealed
  const show1 = progress >= PILL_FRACS[0];
  const show2 = progress >= PILL_FRACS[1];
  const show3 = progress >= PILL_FRACS[2];

  // SVG line geometry (viewBox 0 0 1000 100)
  // Line runs at y=68, from x=0 to x=1000
  // Small entry curve: starts at (0,20), curves down to (60,68), then horizontal
  const LINE_Y = 68;
  const PATH = `M 0 20 Q 0 ${LINE_Y} 50 ${LINE_Y} L 1000 ${LINE_Y}`;
  // Approximate arc length of this path
  const PATH_LEN = 1060;
  const dashOffset = PATH_LEN * (1 - progress);

  // Pill x positions in SVG coords (0–1000)
  const pillXs = PILL_FRACS.map((f) => f * 1000);

  // Dot position along path as progress moves
  // Simple linear approximation: x = progress * 1000, y = LINE_Y (close enough after the curve)
  const dotX = Math.min(progress * 1050 - 50, 1000);
  const dotY = progress < 0.06 ? 20 + (LINE_Y - 20) * (progress / 0.06) : LINE_Y;

  // Card reveal style helper
  const cardStyle = (show: boolean, delay = 0): React.CSSProperties => ({
    opacity: show ? 1 : 0,
    transform: show ? "translateY(0px)" : "translateY(18px)",
    transition: `opacity 0.55s ease ${delay}ms, transform 0.55s cubic-bezier(0.34,1.4,0.64,1) ${delay}ms`,
  });

  return (
    <section className="relative mx-auto max-w-7xl overflow-hidden px-6 pb-28 pt-8">

      {/* ── Line + pills + cards canvas ───────────────────────── */}
      <div ref={containerRef} className="relative w-full" style={{ height: 580 }}>

        {/* SVG line — stretches full width, fixed height */}
        <svg
          className="absolute left-0 top-0 w-full"
          style={{ height: 100, overflow: "visible", pointerEvents: "none" }}
          viewBox="0 0 1000 100"
          preserveAspectRatio="none"
          fill="none"
        >
          <defs>
            <linearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
              <stop offset="60%" stopColor="var(--primary)" stopOpacity="0.7" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.9" />
            </linearGradient>
          </defs>

          {/* Ghost full path (very faint) */}
          <path d={PATH} stroke="var(--border)" strokeWidth="1.5" />

          {/* Animated drawn line */}
          <path
            d={PATH}
            stroke="url(#lg)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeDasharray={PATH_LEN}
            strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 16ms linear" }}
          />

          {/* Glowing dot at tip */}
          {progress > 0.02 && progress < 0.99 && (
            <>
              <circle cx={dotX} cy={dotY} r="5" fill="var(--primary)" opacity="0.25" />
              <circle cx={dotX} cy={dotY} r="3" fill="var(--primary)" opacity="1" />
            </>
          )}

          {/* Pill connector ticks — small vertical tick marks on the line at pill positions */}
          {pillXs.map((px, i) => (
            <line
              key={i}
              x1={px} y1={LINE_Y - 10}
              x2={px} y2={LINE_Y + 10}
              stroke="var(--primary)"
              strokeWidth="1.5"
              opacity={progress >= PILL_FRACS[i] ? 0.6 : 0}
              style={{ transition: "opacity 0.3s ease" }}
            />
          ))}
        </svg>

        {/* Pills — absolutely positioned over the line, centered at each pill x fraction */}
        {/* We use percentage left to match the SVG pill fractions */}
        {[
          { label: "PROVISION ENV",     frac: PILL_FRACS[0], show: show1 },
          { label: "RECOMMEND MISSION", frac: PILL_FRACS[1], show: show2 },
          { label: "GRADE SUBMISSION",  frac: PILL_FRACS[2], show: show3 },
        ].map(({ label, frac, show }, i) => (
          <div
            key={label}
            className="absolute"
            style={{
              left: `${frac * 100}%`,
              top: 54, // line sits at ~68/100 * 100px = 68px; pill centers at ~54px
              transform: "translateX(-50%)",
              opacity: show ? 1 : 0,
              transition: `opacity 0.35s ease ${i * 60}ms, transform 0.35s ease ${i * 60}ms`,
            }}
          >
            <Pill label={label} />
          </div>
        ))}

        {/* ── Cards — each centered under its pill, below the line ── */}

        {/* Card 1: Terminal — under pill 1 (20%) */}
        <div
          className="absolute"
          style={{
            left: `${PILL_FRACS[0] * 100}%`,
            top: 130,
            transform: "translateX(-50%)",
            ...cardStyle(show1, 80),
          }}
        >
          <TerminalCard />
        </div>

        {/* Card 2: Mission — under pill 2 (50%) */}
        <div
          className="absolute"
          style={{
            left: `${PILL_FRACS[1] * 100}%`,
            top: 115,
            transform: "translateX(-50%)",
            ...cardStyle(show2, 80),
          }}
        >
          <MissionCard />
        </div>

        {/* Card 3: Grade — under pill 3 (80%) */}
        <div
          className="absolute"
          style={{
            left: `${PILL_FRACS[2] * 100}%`,
            top: 130,
            transform: "translateX(-50%)",
            ...cardStyle(show3, 80),
          }}
        >
          <GradeCard />
        </div>
      </div>

      {/* ── Headline ─────────────────────────────────────────────── */}
      <div className="mt-0">
        <h1 className="font-display text-[clamp(3rem,9vw,8.5rem)] font-medium leading-[0.92] tracking-[-0.04em] text-ink">
          Cloud skills that
          <br />ship to production
        </h1>
        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-2">
          <p className="max-w-xl text-[17px] leading-relaxed text-foreground">
            CloudFlight is the AI-native training platform for engineering teams.
            Personalized missions on live GCP environments, automatic grading,
            and learner analytics that show exactly who is ready to ship — and who needs another rep.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/login" className="btn-primary">Start a free mission</Link>
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

/* ─── Tracks ─────────────────────────────────────────────────────────────────── */
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
          Every track ends with a capstone mission graded against the same rubric your hiring panel uses.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {learningTracks.map((t) => (
          <Link key={t.id} to="/login"
            className="group rounded-3xl border border-border bg-surface p-7 transition hover:border-primary/40 hover:bg-background">
            <div className="text-3xl">{t.icon}</div>
            <h3 className="mt-5 font-display text-[22px] font-semibold text-ink">{t.name}</h3>
            <p className="mt-2 text-[14px] leading-relaxed text-foreground">{t.description}</p>
            <div className="mono-label mt-6 inline-flex items-center gap-1.5 text-primary opacity-0 transition group-hover:opacity-100">
              Explore track →
            </div>
          </Link>
        ))}
      </div>
      <div className="mt-10 flex justify-center">
        <Link to="/login" className="btn-primary">View learner analytics</Link>
      </div>
    </section>
  );
}

/* ─── How it works ───────────────────────────────────────────────────────────── */
function HowItWorks() {
  const steps = [
    { n: "01", title: "We profile your engineers", body: "A 10-minute baseline mission scores each learner across the six tracks. No multiple choice — actual cloud work." },
    { n: "02", title: "AI assigns the next mission", body: "Our recommender weighs gaps, recency, team objectives, and difficulty curve to pick what unlocks the most growth." },
    { n: "03", title: "Live GCP sandbox spins up", body: "An isolated, budget-capped environment provisions in under 30 seconds. Real services, real bills (we pay)." },
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

/* ─── Teams stats ────────────────────────────────────────────────────────────── */
function Teams() {
  const stats = [
    { value: "3.4×",  label: "faster onboarding for cloud-new hires" },
    { value: "87%",   label: "average mission pass rate after 30 days" },
    { value: "< 30s", label: "to spin up an isolated GCP sandbox" },
    { value: "140+",  label: "missions across compute, data, security, DevOps" },
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

/* ─── CTA ─────────────────────────────────────────────────────────────────────── */
function CTA() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-24">
      <div className="rounded-[2rem] bg-ink p-12 text-white md:p-16">
        <h2 className="max-w-3xl font-display text-[clamp(2rem,5vw,3.5rem)] font-medium leading-[1] tracking-[-0.03em]">
          Stop teaching cloud with slides.
          Start grading on real infrastructure.
        </h2>
        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Link to="/login" className="rounded-full bg-primary px-6 py-3.5 text-[15px] font-medium text-white hover:opacity-90">
            Start a free mission
          </Link>
          <button className="rounded-full border border-white/20 px-6 py-3.5 text-[15px] font-medium hover:bg-white/5">
            Book a team demo
          </button>
        </div>
      </div>
    </section>
  );
}

/* ─── Footer ──────────────────────────────────────────────────────────────────── */
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

/* ─── Page ────────────────────────────────────────────────────────────────────── */
function Landing() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Nav />
      <Hero />
      <Tracks />
      <HowItWorks />
      <Teams />
      <CTA />
      <Footer />
    </main>
  );
}