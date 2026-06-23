import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import api from "../../../api/mockApi";

export const Route = createFileRoute("/_protected/admin/dashboard")({
  head: () => ({ meta: [{ title: "Admin Dashboard — CloudFlight" }] }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAdminData().then((d) => { setData(d); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => <div key={i} className="h-40 animate-pulse rounded-3xl bg-muted" />)}
      </div>
    );
  }

  const stats = [
    { label: "ACTIVE LEARNERS", value: String(data?.activeLearners), icon: "👥" },
    { label: "ACTIVE CHALLENGES", value: String(data?.activeChallenges), icon: "🎯" },
    { label: "AVG COMPLETION", value: data?.avgCompletionTime, icon: "⏱️" },
    { label: "SYSTEM STATUS", value: data?.systemHealth, icon: "✅" },
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
          Monitor learners, AI pipelines, and GCP environments in real time.
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

      {/* Logs section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Scenario generation logs */}
        <div className="rounded-3xl border border-border bg-surface p-8">
          <div className="mono-label mb-5">SCENARIO GENERATION LOG</div>
          <div className="space-y-1">
            {data?.scenarioGenerationLogs?.map((log: any) => (
              <div key={log.id} className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3 text-[13px]">
                <div className="flex items-center gap-3">
                  <span className="mono-label !text-foreground/50">{log.timestamp}</span>
                  <span className="text-foreground">{log.scenario}</span>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  log.status === "success" ? "bg-[#e8f5ee] text-[#1a7f3c]" : "bg-[#fde8e8] text-[#b42318]"
                }`}>
                  {log.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Evaluation logs */}
        <div className="rounded-3xl border border-border bg-surface p-8">
          <div className="mono-label mb-5">EVALUATION LOG</div>
          <div className="space-y-1">
            {data?.evaluationLogs?.map((log: any) => (
              <div key={log.id} className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3 text-[13px]">
                <div className="flex items-center gap-3">
                  <span className="mono-label !text-foreground/50">{log.timestamp}</span>
                  <span className="text-foreground">{log.challenge}</span>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  log.result === "Pass" ? "bg-[#e8f5ee] text-[#1a7f3c]" : "bg-[#fde8e8] text-[#b42318]"
                }`}>
                  {log.result.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Audit log */}
      <div className="rounded-3xl border border-border bg-surface p-8">
        <div className="mono-label mb-5">AUDIT EVENTS</div>
        <div className="overflow-hidden rounded-2xl border border-border">
          <div className="grid grid-cols-[100px_1fr_1fr_1fr] gap-4 border-b border-border bg-muted/50 px-5 py-3">
            {["TIME", "USER", "ACTION", "RESOURCE"].map((h) => (
              <div key={h} className="mono-label text-[10px]">{h}</div>
            ))}
          </div>
          {data?.auditEvents?.map((e: any, i: number) => (
            <div
              key={e.id}
              className={`grid grid-cols-[100px_1fr_1fr_1fr] gap-4 px-5 py-3.5 text-[13px] ${
                i < data.auditEvents.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <span className="mono-label !text-foreground/50">{e.timestamp}</span>
              <span className="text-foreground">{e.user}</span>
              <span className="text-ink">{e.action}</span>
              <span className="text-foreground">{e.resource}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
