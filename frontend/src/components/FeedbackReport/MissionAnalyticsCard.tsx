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
  const stats = [
    {
      label: "Total Time",
      value: analytics?.completion_time_minutes
        ? `${analytics.completion_time_minutes} min`
        : "—",
    },
    {
      label: "Efficiency",
      value: analytics?.time_efficiency
        ? `${(analytics.time_efficiency * 100).toFixed(0)}%`
        : "—",
      sublabel: `vs ${analytics?.expected_time_minutes}m expected`,
    },
    {
      label: "Infrastructure Score",
      value: `${evaluationScore}%`,
    },
    ...(explanationScore !== undefined
      ? [
          {
            label: "Explanation Score",
            value: `${explanationScore}%`,
          },
        ]
      : []),
    ...(criteriaResults
      ? [
          {
            label: "Criteria Passed",
            value: `${criteriaResults.passed}/${criteriaResults.passed + criteriaResults.failed}`,
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-3">
      <h2 className="mono-label text-primary">MISSION ANALYTICS</h2>

      <div className="grid grid-cols-2 gap-3 rounded-xl bg-gradient-to-br from-slate-50 to-slate-50/50 border border-border p-5">
        {stats.map((stat, i) => (
          <div key={i} className="space-y-1">
            <p className="text-[11px] font-semibold text-foreground/60 uppercase tracking-wider">
              {stat.label}
            </p>
            <p className="text-[15px] font-semibold text-ink">{stat.value}</p>
            {stat.sublabel && (
              <p className="text-[11px] text-foreground/50">{stat.sublabel}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
