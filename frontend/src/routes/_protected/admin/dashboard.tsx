import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Activity, AlertTriangle, CheckCircle2, Clock, Cpu, Database, Lock, RefreshCw,
  Rocket, Server, TrendingUp, Users, Wifi, XCircle, Zap,
} from "lucide-react";
import api from "../../../api/apiService";

export const Route = createFileRoute("/_protected/admin/dashboard")({
  head: () => ({ meta: [{ title: "Admin — Operations Center" }] }),
  component: AdminDashboard,
});

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

interface Analytics {
  total_users: number;
  total_missions_generated: number;
  total_missions_completed: number;
  average_completion_rate: number;
  average_score: number;
  average_completion_time: number;
  most_attempted_mission: string | null;
  most_failed_mission: string | null;
  difficulty_distribution: Record<string, number>;
  track_distribution: Record<string, number>;
  last_updated: string;
}

function AdminDashboard() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  const cardsRef = useFadeUp();
  const sessionsRef = useFadeUp();

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [sessionsData, analyticsData] = await Promise.all([
          api.adminListSessions().catch(() => []),
          api.adminGetAnalytics().catch(() => null),
        ]);
        setSessions(Array.isArray(sessionsData) ? sessionsData : []);
        setAnalytics(analyticsData);
      } catch (err) {
        console.error("Failed to load admin data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Refresh every 5 seconds
    const interval = setInterval(loadData, 5000);
    setRefreshInterval(interval);

    return () => clearInterval(interval);
  }, []);

  // Compute metrics
  const metrics = {
    runningLabs: sessions.filter(s => s.status === "ACTIVE" && !s.completed_at).length,
    provisioning: sessions.filter(s => s.environment?.status === "PROVISIONING").length,
    ready: sessions.filter(s => s.environment?.status === "READY").length,
    cleanupPending: sessions.filter(s => s.environment?.status === "CLEANUP_PENDING").length,
    destroyed: sessions.filter(s => s.environment?.status === "CLEANED").length,
    failed: sessions.filter(s => s.environment?.status === "FAILED").length,
    avgProvisionTime: sessions.length > 0
      ? Math.round(sessions.reduce((sum, s) => {
          if (s.started_at && s.expires_at) {
            const diff = new Date(s.expires_at).getTime() - new Date(s.started_at).getTime();
            return sum + diff;
          }
          return sum;
        }, 0) / sessions.length / 60000) // Convert to minutes
      : 0,
  };

  const handleClear = async (sessionId: string) => {
    setClearing(sessionId);
    try {
      await api.adminClearSession(sessionId);
      setSessions(prev => prev.filter(s => s.session_id !== sessionId));
    } catch (err) {
      console.error("Failed to clear session:", err);
    } finally {
      setClearing(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div style={{ animation: "cfFadeSlideUp 0.5s ease both" }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-[28px] font-medium tracking-[-0.025em] text-ink">
              Operations Center
            </h1>
            <p className="mt-1 text-[14px] text-foreground">
              Real-time platform metrics powered by {sessions.length} active learners
            </p>
          </div>
          <button
            onClick={() => {
              setLoading(true);
              const loadData = async () => {
                try {
                  const [sessionsData, analyticsData] = await Promise.all([
                    api.adminListSessions().catch(() => []),
                    api.adminGetAnalytics().catch(() => null),
                  ]);
                  setSessions(Array.isArray(sessionsData) ? sessionsData : []);
                  setAnalytics(analyticsData);
                } finally {
                  setLoading(false);
                }
              };
              loadData();
            }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-[12px] font-medium text-foreground hover:bg-muted transition"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* Operations metrics cards */}
      <div ref={cardsRef.ref} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          {
            icon: <Activity className="h-4 w-4" />,
            label: "RUNNING LABS",
            value: String(metrics.runningLabs),
            color: "text-emerald-600 bg-emerald-50",
          },
          {
            icon: <Clock className="h-4 w-4" />,
            label: "PROVISIONING",
            value: String(metrics.provisioning),
            color: "text-amber-600 bg-amber-50",
          },
          {
            icon: <CheckCircle2 className="h-4 w-4" />,
            label: "READY ENVS",
            value: String(metrics.ready),
            color: "text-blue-600 bg-blue-50",
          },
          {
            icon: <AlertTriangle className="h-4 w-4" />,
            label: "CLEANUP QUEUE",
            value: String(metrics.cleanupPending),
            color: "text-orange-600 bg-orange-50",
          },
          {
            icon: <XCircle className="h-4 w-4" />,
            label: "FAILED",
            value: String(metrics.failed),
            color: "text-red-600 bg-red-50",
          },
        ].map((card, i) => (
          <div
            key={card.label}
            className={`rounded-2xl border border-border bg-surface p-4 transition-all duration-700 ${
              cardsRef.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
            style={{ transitionDelay: `${i * 70}ms` }}
          >
            <div className={`rounded-lg ${card.color} p-2 w-fit mb-3`}>{card.icon}</div>
            <div className="mono-label mb-1 text-[10px]">{card.label}</div>
            <div className="font-display text-[1.8rem] font-medium text-ink leading-none">{card.value}</div>
          </div>
        ))}
      </div>

      {/* System metrics row */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          {
            label: "AVG PROVISION TIME",
            value: `${metrics.avgProvisionTime}m`,
            sublabel: "Minutes",
            icon: <Zap className="h-4 w-4 text-primary" />,
          },
          {
            label: "AVG COMPLETION TIME",
            value: analytics?.average_completion_time ? `${Math.round(analytics.average_completion_time)}m` : "—",
            sublabel: "Minutes",
            icon: <Clock className="h-4 w-4 text-primary" />,
          },
          {
            label: "AVG EVALUATION SCORE",
            value: analytics?.average_score ? `${Math.round(analytics.average_score)}%` : "—",
            sublabel: "Percentage",
            icon: <TrendingUp className="h-4 w-4 text-primary" />,
          },
        ].map((metric, i) => (
          <div
            key={metric.label}
            className={`rounded-2xl border border-border bg-surface p-5 transition-all duration-700 ${
              cardsRef.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
            style={{ transitionDelay: `${(i + 5) * 70}ms` }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="mono-label text-[10px]">{metric.label}</div>
              {metric.icon}
            </div>
            <div className="font-display text-[2rem] font-medium text-ink leading-none mb-1">{metric.value}</div>
            <p className="text-[11px] text-foreground">{metric.sublabel}</p>
          </div>
        ))}
      </div>

      {/* Live sessions table */}
      <div
        ref={sessionsRef.ref}
        className={`rounded-2xl border border-border bg-surface overflow-hidden transition-all duration-700 ${
          sessionsRef.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border px-7 py-5">
          <div className="mono-label">LIVE SESSION CENTER</div>
          <span className="mono-label text-emerald-700">
            {sessions.filter(s => !s.completed_at).length} Active
          </span>
        </div>

        {sessions.length === 0 ? (
          <div className="px-7 py-12 text-center text-[14px] text-foreground">
            No active sessions at this time.
          </div>
        ) : (
          <>
            {/* Header row */}
            <div
              className="grid gap-4 border-b border-border px-7 py-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground"
              style={{
                gridTemplateColumns:
                  "1fr 1.2fr 1fr 0.8fr 1.2fr 1fr 0.8fr auto",
              }}
            >
              <div>Learner</div>
              <div>Mission</div>
              <div>Status</div>
              <div>Zone</div>
              <div>VM Name</div>
              <div>Started</div>
              <div>Expires</div>
              <div>Action</div>
            </div>

            {/* Session rows */}
            {sessions.map((session, i) => {
              const startTime = new Date(session.started_at);
              const expiresTime = new Date(session.expires_at);
              const isExpired = expiresTime < new Date();

              return (
                <div
                  key={session.session_id}
                  className={`grid gap-4 border-b border-border px-7 py-4 items-center hover:bg-background transition last:border-0 ${
                    sessionsRef.visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                  }`}
                  style={{
                    gridTemplateColumns:
                      "1fr 1.2fr 1fr 0.8fr 1.2fr 1fr 0.8fr auto",
                    transitionDelay: `${i * 50}ms`,
                    transition:
                      "opacity 0.5s ease, transform 0.5s ease, background 0.15s ease",
                  }}
                >
                  {/* Learner */}
                  <div>
                    <div className="text-[12px] font-medium text-ink truncate">
                      {session.user_id.slice(0, 8)}
                    </div>
                  </div>

                  {/* Mission */}
                  <div className="text-[12px] text-foreground truncate">
                    {session.mission_id?.slice(0, 16) || "—"}
                  </div>

                  {/* Status */}
                  <div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-mono font-medium ${
                        session.status === "ACTIVE"
                          ? "text-emerald-700 bg-emerald-50"
                          : "text-amber-700 bg-amber-50"
                      }`}
                    >
                      {session.status === "ACTIVE" ? (
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                      ) : (
                        <Clock className="h-3 w-3" />
                      )}
                      {session.status}
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
                    className={`text-[11px] font-mono ${
                      isExpired
                        ? "text-red-600 font-medium"
                        : "text-foreground"
                    }`}
                  >
                    {expiresTime.toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>

                  {/* Action */}
                  <button
                    onClick={() => handleClear(session.session_id)}
                    disabled={clearing === session.session_id || session.completed_at !== null}
                    className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[10px] font-medium text-red-600 hover:bg-red-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {clearing === session.session_id ? (
                      <>
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        <span className="hidden sm:inline">Clearing…</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3" />
                        <span className="hidden sm:inline">Clear</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Summary footer */}
      {analytics && (
        <div className="rounded-2xl border border-border bg-surface p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: "Total Learners",
                value: analytics.total_users,
                icon: <Users className="h-4 w-4 text-primary" />,
              },
              {
                label: "Missions Generated",
                value: analytics.total_missions_generated,
                icon: <Zap className="h-4 w-4 text-primary" />,
              },
              {
                label: "Completed Today",
                value: analytics.total_missions_completed,
                icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
              },
              {
                label: "Completion Rate",
                value: `${Math.round(analytics.average_completion_rate)}%`,
                icon: <TrendingUp className="h-4 w-4 text-primary" />,
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex items-start gap-3"
              >
                <div className="rounded-lg bg-background p-2">{stat.icon}</div>
                <div>
                  <div className="mono-label mb-0.5 text-[10px]">{stat.label}</div>
                  <div className="font-display text-[1.6rem] font-medium text-ink">
                    {stat.value}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`@keyframes cfFadeSlideUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}
