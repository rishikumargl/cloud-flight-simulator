import { CheckCircle, AlertCircle, X, ArrowRight } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

interface HistoryTimelineItemProps {
  evaluation_id: string;
  mission_id: string;
  title: string;
  track: string;
  difficulty: string;
  score: number;
  explanation_score?: number;
  status: "PASSED" | "PARTIAL" | "FAILED";
  summary?: string;
  completed_at: string;
}

export function HistoryTimelineItem({
  evaluation_id,
  mission_id,
  title,
  track,
  difficulty,
  score,
  explanation_score,
  status,
  summary,
  completed_at,
}: HistoryTimelineItemProps) {
  const navigate = useNavigate();

  const statusIcon =
    status === "PASSED" ? (
      <CheckCircle className="h-6 w-6 text-emerald-500" />
    ) : status === "PARTIAL" ? (
      <AlertCircle className="h-6 w-6 text-amber-500" />
    ) : (
      <X className="h-6 w-6 text-red-500" />
    );

  const statusColor =
    status === "PASSED"
      ? "text-emerald-600 bg-emerald-50"
      : status === "PARTIAL"
        ? "text-amber-600 bg-amber-50"
        : "text-red-600 bg-red-50";

  const completedDate = new Date(completed_at);
  const dateStr = completedDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="relative">
      {/* Timeline dot */}
      <div className="absolute left-0 top-0 w-6 h-6 -translate-x-1/4">
        {statusIcon}
      </div>

      {/* Content card */}
      <div className="ml-8 rounded-lg border border-border bg-surface p-4 space-y-3 hover:border-primary/30 transition">
        {/* Date header */}
        <p className="text-[11px] font-semibold text-foreground/50 uppercase tracking-wider">
          {dateStr}
        </p>

        {/* Title and status */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-ink mb-1 truncate">{title}</h3>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-primary/10 text-primary uppercase tracking-wider">
                {track}
              </span>
              <span className="text-[12px] font-medium text-foreground/60">
                {difficulty}
              </span>
            </div>
          </div>

          <div
            className={`flex-shrink-0 inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[12px] font-bold uppercase tracking-wider ${statusColor}`}
          >
            {status === "PASSED" ? "Passed" : status === "PARTIAL" ? "Partial" : "Failed"}
          </div>
        </div>

        {/* Scores */}
        <div className="flex items-center gap-4 text-[12px] font-semibold text-ink border-t border-border pt-3">
          <span>Infrastructure: {score}%</span>
          {explanation_score !== undefined && (
            <>
              <span className="text-foreground/30">•</span>
              <span>Explanation: {explanation_score}%</span>
            </>
          )}
        </div>

        {/* Summary */}
        {summary && (
          <p className="text-[13px] text-foreground/70 leading-relaxed line-clamp-2">
            {summary}
          </p>
        )}

        {/* View Report Button */}
        <button
          onClick={() => navigate({ to: `/feedback/${evaluation_id}` })}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-[12px] font-medium bg-primary/10 text-primary hover:bg-primary/20 transition"
        >
          View Full Report
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
