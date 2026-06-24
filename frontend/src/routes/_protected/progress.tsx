import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import api from "../../api/apiService";

export const Route = createFileRoute("/_protected/progress")({
  head: () => ({ meta: [{ title: "Progress — CloudFlight" }] }),
  component: ProgressPage,
});

const COLORS = ["#2563eb", "#7c3aed", "#059669", "#d97706", "#dc2626", "#0891b2"];

function ProgressPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getProgressCharts().then((d) => { setData(d); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-64 animate-pulse rounded-3xl bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <div className="mono-label mb-2">LEARNING ANALYTICS</div>
        <h1 className="font-display text-[clamp(2rem,5vw,3.5rem)] font-medium leading-[1] tracking-[-0.03em] text-ink">
          Your progress at a glance.
        </h1>
        <p className="mt-3 text-[15px] text-foreground">
          Real-time insight into your cloud skill trajectory across all six tracks.
        </p>
      </div>

      {/* Mission Progress Trend */}
      <div className="rounded-3xl border border-border bg-surface p-8">
        <div className="mono-label mb-2">MISSION COMPLETION TREND</div>
        <h2 className="font-display text-[22px] font-medium tracking-[-0.02em] text-ink mb-6">
          Missions over time
        </h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data?.progressTrend} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "var(--foreground)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "var(--foreground)" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: "var(--background)", border: "1px solid var(--border)", borderRadius: "12px", fontSize: 13 }}
            />
            <Legend />
            <Bar dataKey="completed" name="Completed" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="inProgress" name="In Progress" fill="#7c3aed" radius={[4, 4, 0, 0]} />
            <Bar dataKey="failed" name="Failed" fill="#dc2626" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Success Rate + Skill Growth */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-border bg-surface p-8">
          <div className="mono-label mb-2">SUCCESS RATE TREND</div>
          <h2 className="font-display text-[22px] font-medium tracking-[-0.02em] text-ink mb-6">
            Pass rate over time
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data?.successRateTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "var(--foreground)" }} axisLine={false} tickLine={false} />
              <YAxis domain={[60, 100]} tick={{ fontSize: 12, fill: "var(--foreground)" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "var(--background)", border: "1px solid var(--border)", borderRadius: "12px", fontSize: 13 }}
                formatter={(v: number) => [`${v}%`, "Pass rate"]}
              />
              <Line
                type="monotone"
                dataKey="rate"
                stroke="var(--primary)"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "var(--primary)" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-3xl border border-border bg-surface p-8">
          <div className="mono-label mb-2">TRACK DISTRIBUTION</div>
          <h2 className="font-display text-[22px] font-medium tracking-[-0.02em] text-ink mb-6">
            Where you've focused
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data?.trackDistribution}
                dataKey="value"
                nameKey="track"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ track, percent }: any) => `${track} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {data?.trackDistribution?.map((_: any, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "var(--background)", border: "1px solid var(--border)", borderRadius: "12px", fontSize: 13 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Skill Growth */}
      <div className="rounded-3xl border border-border bg-surface p-8">
        <div className="mono-label mb-2">SKILL GROWTH</div>
        <h2 className="font-display text-[22px] font-medium tracking-[-0.02em] text-ink mb-6">
          Before vs. after
        </h2>
        <div className="space-y-5">
          {data?.skillGrowth?.map((s: any) => (
            <div key={s.skill}>
              <div className="mb-2 flex items-center justify-between text-[13px]">
                <span className="font-medium text-ink">{s.skill}</span>
                <span className="text-foreground">
                  <span className="text-foreground/50 line-through mr-2">{s.previous}</span>
                  <span className="font-semibold text-primary">{s.current}</span>
                </span>
              </div>
              <div className="relative h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="absolute h-full rounded-full bg-primary/20"
                  style={{ width: `${s.previous}%` }}
                />
                <div
                  className="absolute h-full rounded-full bg-primary transition-all"
                  style={{ width: `${s.current}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
