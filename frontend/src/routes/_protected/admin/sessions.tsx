import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Clock, Eye, RefreshCw, Trash2, AlertTriangle } from "lucide-react";
import api from "../../../api/apiService";

export const Route = createFileRoute("/_protected/admin/sessions")({
  head: () => ({ meta: [{ title: "Live Sessions — Admin" }] }),
  component: LiveSessions,
});

interface Session {
  session_id: string;
  user_id: string;
  mission_id: string;
  status: string;
  started_at: string;
  expires_at: string;
  completed_at: string | null;
  environment?: { vm_name: string; zone: string; status: string };
}

function useFadeUp() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: 0.08 });
    obs.observe(el); return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function LiveSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const tableRef = useFadeUp();

  // Load sessions
  useEffect(() => {
    const loadSessions = async () => {
      try {
        const data = await api.adminListSessions().catch(() => []);
        setSessions(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load sessions:", err);
      } finally {
        setLoading(false);
      }
    };

    loadSessions();

    // Refresh every 5 seconds
    const interval = setInterval(loadSessions, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredSessions = sessions.filter((s) => {
    const searchLower = search.toLowerCase();
    return (
      s.user_id.toLowerCase().includes(searchLower) ||
      s.mission_id.toLowerCase().includes(searchLower) ||
      s.session_id.toLowerCase().includes(searchLower) ||
      (s.environment?.vm_name || "").toLowerCase().includes(searchLower)
    );
  });

  const activeSessions = filteredSessions.filter((s) => !s.completed_at);
  const completedSessions = filteredSessions.filter((s) => s.completed_at);

  const handleClear = async (sessionId: string) => {
    setClearing(sessionId);
    try {
      await api.adminClearSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.session_id !== sessionId));
    } catch (err) {
      console.error("Failed to clear session:", err);
    } finally {
      setClearing(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div style={{ animation: "cfFadeSlideUp 0.5s ease both" }}>
        <h1 className="font-display text-[28px] font-medium tracking-[-0.025em] text-ink mb-2">
          Live Session Center
        </h1>
        <p className="text-[14px] text-foreground">
          Monitor all active learner sessions, GCP environments, and infrastructure.
        </p>
      </div>

      {/* Session stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Active Sessions", value: activeSessions.length, color: "text-emerald-600" },
          { label: "Completed", value: completedSessions.length, color: "text-blue-600" },
          { label: "Total", value: sessions.length, color: "text-foreground" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-border bg-surface p-5">
            <div className="mono-label mb-2 text-[10px]">{stat.label}</div>
            <div className={`font-display text-[2rem] font-medium ${stat.color}`}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="rounded-2xl border border-border bg-surface p-4">
        <input
          type="text"
          placeholder="Search by learner, mission, VM name, or session ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-4 py-2 text-[13px] placeholder:text-foreground/50 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
        />
      </div>

      {/* Active sessions table */}
      <div
        ref={tableRef.ref}
        className={`rounded-2xl border border-border bg-surface overflow-hidden transition-all duration-700 ${
          tableRef.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border px-7 py-5">
          <div className="mono-label">ACTIVE SESSIONS</div>
          <span className="mono-label text-emerald-700">
            {activeSessions.length} Running
          </span>
        </div>

        {activeSessions.length === 0 ? (
          <div className="px-7 py-12 text-center text-[14px] text-foreground">
            No active sessions at this time.
          </div>
        ) : (
          <>
            {/* Header row */}
            <div
              className="grid gap-4 border-b border-border px-7 py-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground"
              style={{
                gridTemplateColumns: "1.5fr 1.5fr 0.8fr 0.8fr 1.2fr 0.8fr 0.8fr auto",
              }}
            >
              <div>Learner</div>
              <div>Mission</div>
              <div>Status</div>
              <div>Zone</div>
              <div>VM Name</div>
              <div>Started</div>
              <div>Expires</div>
              <div>Actions</div>
            </div>

            {/* Session rows */}
            {activeSessions.map((session, i) => {
              const startTime = new Date(session.started_at);
              const expiresTime = new Date(session.expires_at);
              const isExpired = expiresTime < new Date();
              const minutesRemaining = Math.round(
                (expiresTime.getTime() - new Date().getTime()) / 60000
              );

              return (
                <div
                  key={session.session_id}
                  className={`grid gap-4 border-b border-border px-7 py-4 items-center hover:bg-background transition last:border-0 ${
                    tableRef.visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                  }`}
                  style={{
                    gridTemplateColumns:
                      "1.5fr 1.5fr 0.8fr 0.8fr 1.2fr 0.8fr 0.8fr auto",
                    transitionDelay: `${i * 50}ms`,
                    transition:
                      "opacity 0.5s ease, transform 0.5s ease, background 0.15s ease",
                  }}
                >
                  {/* Learner */}
                  <div>
                    <div className="text-[12px] font-medium text-ink truncate">
                      {session.user_id.slice(0, 12)}
                    </div>
                  </div>

                  {/* Mission */}
                  <div className="text-[12px] text-foreground truncate font-mono">
                    {session.mission_id?.slice(0, 20) || "Unknown"}
                  </div>

                  {/* Status */}
                  <div>
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-mono font-medium text-emerald-700 bg-emerald-50">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                      ACTIVE
                    </span>
                  </div>

                  {/* Zone */}
                  <div className="text-[11px] text-foreground font-mono">
                    {session.environment?.zone || "—"}
                  </div>

                  {/* VM Name */}
                  <div className="text-[11px] text-foreground truncate font-mono">
                    {session.environment?.vm_name || "—"}
                  </div>

                  {/* Started */}
                  <div className="text-[11px] text-foreground font-mono">
                    {startTime.toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>

                  {/* Expires */}
                  <div
                    className={`text-[11px] font-mono flex items-center gap-1 ${
                      isExpired ? "text-red-600" : minutesRemaining < 5 ? "text-amber-600" : "text-foreground"
                    }`}
                  >
                    {isExpired ? (
                      <>
                        <AlertTriangle className="h-3 w-3" />
                        Expired
                      </>
                    ) : (
                      <>
                        {minutesRemaining < 5 && (
                          <AlertTriangle className="h-3 w-3" />
                        )}
                        {minutesRemaining}m
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      title="View session details"
                      disabled
                      className="inline-flex items-center justify-center h-8 w-8 rounded-full border border-border hover:bg-muted disabled:opacity-50 transition"
                    >
                      <Eye className="h-3.5 w-3.5 text-foreground" />
                    </button>
                    <button
                      onClick={() => handleClear(session.session_id)}
                      disabled={clearing === session.session_id}
                      title="Clear session & cleanup infrastructure"
                      className="inline-flex items-center justify-center h-8 w-8 rounded-full border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 transition disabled:opacity-50"
                    >
                      {clearing === session.session_id ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Completed sessions summary */}
      {completedSessions.length > 0 && (
        <div className="rounded-2xl border border-border bg-surface p-6">
          <div className="mono-label mb-4">COMPLETED TODAY</div>
          <div className="grid grid-cols-1 gap-2">
            {completedSessions.slice(0, 5).map((session) => {
              const completedTime = new Date(session.completed_at || session.expires_at);
              return (
                <div
                  key={session.session_id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-background transition"
                >
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-foreground/50" />
                    <div>
                      <div className="text-[12px] font-medium text-ink">
                        {session.user_id.slice(0, 12)}
                      </div>
                      <div className="text-[11px] text-foreground">
                        {session.mission_id?.slice(0, 16) || "Unknown"} •{" "}
                        {completedTime.toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style>{`@keyframes cfFadeSlideUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}
