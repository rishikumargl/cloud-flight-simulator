import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import api from "../../api/apiService";

export const Route = createFileRoute("/_protected/history")({
  head: () => ({ meta: [{ title: "Mission History — CloudFlight" }] }),
  component: HistoryPage,
});

const TRACK_ICONS: Record<string, string> = {
  compute: "⚙️", storage: "💾", networking: "🌐",
  security: "🔒", devops: "🚀", architecture: "🏗️",
};

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="mono-label">—</span>;
  const color = score >= 90 ? "text-[#1a7f3c] bg-[#e8f5ee]" : score >= 70 ? "text-[#946200] bg-[#fff3cd]" : "text-[#b42318] bg-[#fde8e8]";
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${color}`}>
      {score}
    </span>
  );
}

function DiffBadge({ difficulty }: { difficulty: string }) {
  const colors: Record<string, string> = {
    beginner: "text-[#1a7f3c] border-[#c3e6cb]",
    intermediate: "text-[#946200] border-[#ffc107]/40",
    advanced: "text-[#b42318] border-[#f5c6cb]",
  };
  return (
    <span className={`mono-label rounded-full border px-2.5 py-0.5 !text-[10px] ${colors[difficulty] || ""}`}>
      {difficulty.toUpperCase()}
    </span>
  );
}

function HistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTrack, setFilterTrack] = useState("all");
  const navigate = Route.useNavigate();

  useEffect(() => {
    api.getMissionHistory().then((d) => { setHistory(d); setLoading(false); });
  }, []);

  const filtered = history.filter((m) => {
    const matchSearch = m.title.toLowerCase().includes(search.toLowerCase());
    const matchTrack = filterTrack === "all" || m.track === filterTrack;
    return matchSearch && matchTrack;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted" />)}
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <div className="mono-label mb-2">MISSION HISTORY</div>
        <h1 className="font-display text-[clamp(2rem,5vw,3.5rem)] font-medium leading-[1] tracking-[-0.03em] text-ink">
          Your completed missions.
        </h1>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/50" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search missions…"
            className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-4 text-[14px] text-ink placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <select
          value={filterTrack}
          onChange={(e) => setFilterTrack(e.target.value)}
          className="h-11 rounded-xl border border-border bg-background px-4 text-[14px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="all">All tracks</option>
          {["compute", "storage", "networking", "security", "devops", "architecture"].map((t) => (
            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-border bg-surface p-7">
          <div className="mono-label mb-3">TOTAL MISSIONS</div>
          <div className="font-display text-[3rem] font-medium leading-none tracking-[-0.03em] text-ink">
            {history.length}
          </div>
        </div>
        <div className="rounded-3xl border border-border bg-surface p-7">
          <div className="mono-label mb-3">AVG SCORE</div>
          <div className="font-display text-[3rem] font-medium leading-none tracking-[-0.03em] text-ink">
            {history.length > 0
              ? Math.round(history.reduce((s, m) => s + (m.score ?? 0), 0) / history.length)
              : "—"}
          </div>
        </div>
        <div className="rounded-3xl border border-border bg-surface p-7">
          <div className="mono-label mb-3">BEST SCORE</div>
          <div className="font-display text-[3rem] font-medium leading-none tracking-[-0.03em] text-primary">
            {history.length > 0 ? Math.max(...history.map((m) => m.score ?? 0)) : "—"}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-3xl border border-border bg-surface">
        {/* Desktop header */}
        <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_80px] gap-4 border-b border-border px-7 py-4 md:grid">
          {["MISSION", "TRACK", "DIFFICULTY", "COMPLETED", "SCORE"].map((h) => (
            <div key={h} className="mono-label text-left">{h}</div>
          ))}
        </div>
        {/* Rows */}
        {filtered.length === 0 ? (
          <div className="px-7 py-12 text-center text-[15px] text-foreground">No missions match your filter.</div>
        ) : (
          filtered.map((m, i) => (
            <button
              key={m.id}
              onClick={() => navigate({ to: "/results/$id", params: { id: m.id } })}
              className={`grid w-full grid-cols-1 gap-2 px-7 py-5 text-left transition hover:bg-background md:grid-cols-[2fr_1fr_1fr_1fr_80px] md:gap-4 md:py-4 ${
                i < filtered.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{TRACK_ICONS[m.track] || "📋"}</span>
                <span className="font-medium text-ink text-[14px]">{m.title}</span>
              </div>
              <div className="text-[13px] capitalize text-foreground">{m.track}</div>
              <div><DiffBadge difficulty={m.difficulty} /></div>
              <div className="text-[13px] text-foreground">{m.completionDate}</div>
              <div><ScoreBadge score={m.score} /></div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
