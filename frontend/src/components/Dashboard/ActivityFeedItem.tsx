import { CheckCircle, AlertCircle, X } from "lucide-react";

interface MissionItem {
  mission_id: string;
  title: string;
  track: string;
  score: number;
  explanation_score?: number;
  status: "PASSED" | "PARTIAL" | "FAILED";
  completed_at: string;
}

interface ActivityFeedItemProps {
  mission: MissionItem;
}

export function ActivityFeedItem({ mission }: ActivityFeedItemProps) {
  const statusIcon =
    mission.status === "PASSED" ? (
      <CheckCircle className="h-5 w-5 text-emerald-500" />
    ) : mission.status === "PARTIAL" ? (
      <AlertCircle className="h-5 w-5 text-amber-500" />
    ) : (
      <X className="h-5 w-5 text-red-500" />
    );

  const statusColor =
    mission.status === "PASSED"
      ? "text-emerald-600"
      : mission.status === "PARTIAL"
        ? "text-amber-600"
        : "text-red-600";

  const completedDate = new Date(mission.completed_at);
  const now = new Date();
  const diffMs = now.getTime() - completedDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  let timeAgo = "";
  if (diffDays > 0) {
    timeAgo = `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  } else if (diffHours > 0) {
    timeAgo = `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  } else {
    timeAgo = "Just now";
  }

  return (
    <div className="flex items-start gap-3 rounded-lg border border-border/50 bg-background p-3">
      <div className="mt-1 flex-shrink-0">{statusIcon}</div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2 mb-1">
          <p className="text-[13px] font-semibold text-ink truncate">
            {mission.title}
          </p>
          <span className={`text-[11px] font-bold uppercase tracking-wider ${statusColor}`}>
            {mission.status === "PASSED"
              ? "Passed"
              : mission.status === "PARTIAL"
                ? "Partial"
                : "Failed"}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-[12px] text-foreground/60">{mission.track}</span>
          <span className="text-[12px] font-semibold text-ink">{mission.score}%</span>
          {mission.explanation_score !== undefined && (
            <>
              <span className="text-[12px] text-foreground/60">•</span>
              <span className="text-[12px] text-foreground/60">
                Explanation: {mission.explanation_score}%
              </span>
            </>
          )}
        </div>

        <p className="text-[11px] text-foreground/50">{timeAgo}</p>
      </div>
    </div>
  );
}
