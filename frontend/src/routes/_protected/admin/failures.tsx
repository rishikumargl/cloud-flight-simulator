import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Zap, Cpu, Wifi, Database, Lock } from "lucide-react";

export const Route = createFileRoute("/_protected/admin/failures")({
  head: () => ({ meta: [{ title: "Failure Analytics — Admin" }] }),
  component: FailureAnalytics,
});

function FailureAnalytics() {
  return (
    <div className="space-y-8 pb-16">
      <div style={{ animation: "cfFadeSlideUp 0.5s ease both" }}>
        <h1 className="font-display text-[28px] font-medium tracking-[-0.025em] text-ink mb-2">
          Failure Analytics
        </h1>
        <p className="text-[14px] text-foreground">
          Identify and analyze recurring failure patterns across learner evaluations.
        </p>
      </div>

      {/* Coming soon placeholder */}
      <div className="rounded-2xl border border-border bg-surface p-12 text-center">
        <div className="flex items-center justify-center h-16 w-16 rounded-full bg-red-50 text-red-600 mx-auto mb-4">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h3 className="font-display text-[18px] font-medium text-ink mb-2">Coming Soon</h3>
        <p className="text-foreground text-[14px] mb-4">
          This page will aggregate all mission failures and display the most common failure patterns
          across different types of evaluations (IAM, networking, storage, etc.).
        </p>
        <p className="text-[12px] text-foreground/60">
          Data will come from evaluation criteria analysis as learners complete missions.
        </p>
      </div>

      {/* Failure types */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {[
          {
            icon: <Zap className="h-5 w-5 text-amber-600" />,
            label: "Startup Script Issues",
            desc: "Failed script executions, timeout errors, boot failures",
          },
          {
            icon: <Lock className="h-5 w-5 text-red-600" />,
            label: "IAM & Security",
            desc: "Role assignment failures, permission denials, auth issues",
          },
          {
            icon: <Wifi className="h-5 w-5 text-blue-600" />,
            label: "Networking Issues",
            desc: "Tag mismatches, route failures, connectivity problems",
          },
          {
            icon: <Database className="h-5 w-5 text-purple-600" />,
            label: "Storage & Metadata",
            desc: "Metadata key failures, disk configuration issues",
          },
          {
            icon: <Cpu className="h-5 w-5 text-cyan-600" />,
            label: "Compute Issues",
            desc: "Machine type failures, zone configuration errors",
          },
          {
            icon: <AlertTriangle className="h-5 w-5 text-orange-600" />,
            label: "Other Failures",
            desc: "Uncategorized issues, infrastructure problems",
          },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-border bg-surface p-5">
            <div className="flex items-start gap-3">
              {item.icon}
              <div>
                <div className="font-medium text-ink mb-1">{item.label}</div>
                <p className="text-[12px] text-foreground">{item.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`@keyframes cfFadeSlideUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}
