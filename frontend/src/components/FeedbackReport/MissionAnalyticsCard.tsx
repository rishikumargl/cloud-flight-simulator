interface MissionAnalyticsCardProps {
  analytics?: {
    completion_time_minutes?: number;
    expected_time_minutes?: number;
    time_efficiency?: number;
    provisioning_minutes?: number;
    verification_minutes?: number;
  };
  evaluationScore: number;
  explanationScore?: number;
  criteriaResults?: { passed: number; failed: number };
}

export function MissionAnalyticsCard({
  analytics,
  evaluationScore,
  explanationScore,
  criteriaResults,
}: MissionAnalyticsCardProps) {
  const hasTimeData = analytics?.completion_time_minutes || analytics?.expected_time_minutes;

  const stats: Array<{ label: string; value: string | null; sublabel?: string }> = [];

  if (analytics?.completion_time_minutes || hasTimeData) {
    stats.push({
      label: "Total Time",
      value: analytics?.completion_time_minutes
        ? `${analytics.completion_time_minutes} min`
        : "Not available",
    });
  }

  if (hasTimeData) {
    stats.push({
      label: "Efficiency",
      value: analytics?.time_efficiency
        ? `${(analytics.time_efficiency * 100).toFixed(0)}%`
        : "Not available",
      sublabel: `vs ${analytics?.expected_time_minutes}m expected`,
    });
  }

  stats.push({
    label: "Infrastructure Score",
    value: `${evaluationScore}%`,
  });

  if (explanationScore !== undefined) {
    stats.push({
      label: "Explanation Score",
      value: `${explanationScore}%`,
    });
  }

  if (criteriaResults) {
    stats.push({
      label: "Criteria Passed",
      value: `${criteriaResults.passed}/${criteriaResults.passed + criteriaResults.failed}`,
    });
  }

  return (
    <div className="space-y-3">
      <h2 className="mono-label text-primary">MISSION ANALYTICS</h2>

      <div className="grid grid-cols-2 gap-3 rounded-xl bg-gradient-to-br from-slate-50 to-slate-50/50 border border-border p-5">
        {stats.map((stat, i) => (
          <div key={i} className="space-y-1">
            <p className="text-[11px] font-semibold text-foreground/60 uppercase tracking-wider">
              {stat.label}
            </p>
            <p className={`text-[15px] font-semibold ${stat.value === "Not available" ? "text-foreground/50" : "text-ink"}`}>
              {stat.value}
            </p>
            {stat.sublabel && (
              <p className="text-[11px] text-foreground/50">{stat.sublabel}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
