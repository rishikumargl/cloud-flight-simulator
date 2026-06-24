import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import api from "../../../api/apiService";

export const Route = createFileRoute("/_protected/admin/dashboard")({
  head: () => ({ meta: [{ title: "Admin Dashboard — CloudFlight" }] }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [clearing, setClearing] = useState<Record<string, boolean>>({});
  const [clearErrors, setClearErrors] = useState<Record<string, string>>({});

  const loadSessions = async () => {
    try {
      const data = await (api as any).adminListSessions();
      setSessions(data ?? []);
    } catch (err: any) {
      console.error("Failed to load admin sessions:", err);
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    loadSessions();
    const interval = setInterval(loadSessions, 30_000);
    return () => clearInterval(interval);
  }, []);

  const handleClear = async (session_id: string) => {
    setClearing((prev) => ({ ...prev, [session_id]: true }));
    setClearErrors((prev) => { const n = { ...prev }; delete n[session_id]; return n; });
    try {
      await (api as any).adminClearSession(session_id);
      setSessions((prev) => prev.filter((s) => s.session_id !== session_id));
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message ?? err.message ?? "Clear failed";
      setClearErrors((prev) => ({ ...prev, [session_id]: msg }));
    } finally {
      setClearing((prev) => ({ ...prev, [session_id]: false }));
    }
  };

  const stats = [
    { label: "ACTIVE SESSIONS", value: String(sessions.length), icon: "🎯" },
    { label: "PROVISIONED VMs", value: String(sessions.filter((s) => s.environment?.status === "READY").length), icon: "🖥️" },
    { label: "PROVISIONING", value: String(sessions.filter((s) => s.environment?.status === "PROVISIONING").length), icon: "⚙️" },
    { label: "SYSTEM", value: "OK", icon: "✅" },
  ];

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="overflow-hidden rounded-3xl bg-ink p-10 text-white">
        <div className="mono-label mb-4 !text-white/50">ADMIN CONSOLE</div>
        <h1 className="font-display text-[clamp(2rem,5vw,3.5rem)] font-medium leading-[1] tracking-[-0.03em]">
          Platform overview.
        </h1>
        <p className="mt-3 text-[15px] text-white/70">
          Monitor learners, active GCP environments, and clear resources.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-3xl border border-border bg-surface p-7">
            <div className="mb-2 text-3xl">{s.icon}</div>
            <div className="mono-label mb-3">{s.label}</div>
            <div className="font-display text-[2.4rem] font-medium leading-none tracking-[-0.03em] text-ink">
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Active Sessions / Resource Management */}
      <div className="rounded-3xl border border-border bg-surface p-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="mono-label">ACTIVE GCP SESSIONS</div>
          <button
            onClick={loadSessions}
            className="mono-label rounded-full border border-border px-4 py-2 text-[11px] hover:border-primary/40 transition"
          >
            ↻ Refresh
          </button>
        </div>

        {loadingSessions ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-border">
            <p className="text-[14px] text-foreground/60">No active sessions.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border">
            <div className="grid grid-cols-[1fr_1fr_1fr_100px_120px] gap-4 border-b border-border bg-muted/50 px-5 py-3">
              {["SESSION", "USER", "ENVIRONMENT", "STATUS", "ACTION"].map((h) => (
                <div key={h} className="mono-label text-[10px]">{h}</div>
              ))}
            </div>
            {sessions.map((s, i) => (
              <div
                key={s.session_id}
                className={`grid grid-cols-[1fr_1fr_1fr_100px_120px] gap-4 items-center px-5 py-4 text-[13px] ${
                  i < sessions.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <span className="font-mono text-[11px] text-foreground">{s.session_id.slice(0, 8)}…</span>
                <span className="text-foreground truncate">{s.user_id.slice(0, 8)}…</span>
                <div>
                  {s.environment?.vm_name ? (
                    <span className="font-mono text-[11px] text-ink">{s.environment.vm_name}</span>
                  ) : (
                    <span className="text-foreground/40">—</span>
                  )}
                  {s.environment?.zone && (
                    <div className="mono-label text-[10px] !text-foreground/50">{s.environment.zone}</div>
                  )}
                </div>
                <span className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-semibold ${
                  s.environment?.status === "READY"
                    ? "bg-[#e8f5ee] text-[#1a7f3c]"
                    : s.environment?.status === "PROVISIONING"
                    ? "bg-yellow-50 text-yellow-700"
                    : "bg-muted text-foreground"
                }`}>
                  {s.environment?.status ?? s.status}
                </span>
                <div>
                  <button
                    onClick={() => handleClear(s.session_id)}
                    disabled={clearing[s.session_id]}
                    className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-[12px] font-medium text-red-600 hover:bg-red-100 transition disabled:opacity-50"
                  >
                    {clearing[s.session_id] ? "Clearing…" : "Clear"}
                  </button>
                  {clearErrors[s.session_id] && (
                    <div className="mt-1 text-[10px] text-red-500">{clearErrors[s.session_id]}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
