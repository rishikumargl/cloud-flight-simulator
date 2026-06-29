import { CheckCircle2, AlertCircle, XCircle, Clock, Calendar } from "lucide-react";

interface MissionReportHeaderProps {
  status: "PASSED" | "PARTIAL" | "FAILED";
  score: number;
  title: string;
  difficulty: string;
  track: string;
  completionTimeMinutes?: number;
  completedAt?: string;
}

export function MissionReportHeader({
  status,
  score,
  title,
  difficulty,
  track,
  completionTimeMinutes,
  completedAt,
}: MissionReportHeaderProps) {
  const statusConfig = {
    PASSED: {
      icon: <CheckCircle2 className="h-12 w-12 text-emerald-500" />,
      label: "PASSED",
      color: "bg-emerald-50 border-emerald-200",
      textColor: "text-emerald-900",
    },
    PARTIAL: {
      icon: <AlertCircle className="h-12 w-12 text-amber-500" />,
      label: "PARTIAL",
      color: "bg-amber-50 border-amber-200",
      textColor: "text-amber-900",
    },
    FAILED: {
      icon: <XCircle className="h-12 w-12 text-red-500" />,
      label: "FAILED",
      color: "bg-red-50 border-red-200",
      textColor: "text-red-900",
    },
  };

  const config = statusConfig[status];

  return (
    <div className={`rounded-2xl border ${config.color} p-8`}>
      <div className="flex items-start gap-6">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-white">
          {config.icon}
        </div>

        <div className="flex-1">
          <div className="flex items-baseline gap-3 mb-4">
            <span className={`font-display text-4xl font-bold ${config.textColor}`}>
              {score}%
            </span>
            <span className={`font-semibold uppercase tracking-wider ${config.textColor}`}>
              {config.label}
            </span>
          </div>

          <h1 className={`font-display text-2xl font-medium ${config.textColor} mb-3`}>
            {title}
          </h1>

          <div className="flex flex-wrap gap-4 text-[13px]">
            {[
              { label: "Track", value: track },
              { label: "Difficulty", value: difficulty },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center gap-2">
                <span className={`${config.textColor} opacity-70`}>{label}:</span>
                <span className={`font-semibold ${config.textColor}`}>{value}</span>
              </div>
            ))}
          </div>

          {(completionTimeMinutes !== undefined || completedAt) && (
            <div className="mt-4 flex flex-wrap gap-4 text-[12px]">
              {completionTimeMinutes !== undefined && (
                <div className="flex items-center gap-2 text-foreground/60">
                  <Clock className="h-4 w-4" />
                  <span>{completionTimeMinutes} minutes</span>
                </div>
              )}
              {completedAt && (
                <div className="flex items-center gap-2 text-foreground/60">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(completedAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
