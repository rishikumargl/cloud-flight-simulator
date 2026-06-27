import { ArrowRight, Sparkles } from "lucide-react";

interface RecommendationCardProps {
  recommendation?: {
    track?: string;
    difficulty?: string;
    reason?: string;
  };
  onStartRecommended: () => Promise<void>;
  onReturnDashboard: () => void;
  isLoading?: boolean;
}

export function RecommendationCard({
  recommendation,
  onStartRecommended,
  onReturnDashboard,
  isLoading = false,
}: RecommendationCardProps) {
  if (!recommendation || !recommendation.track) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="mono-label text-primary">RECOMMENDED NEXT MISSION</h2>

      <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 p-6 space-y-4">
        <div className="space-y-3">
          <div className="flex items-baseline gap-2">
            <span className="text-[12px] font-semibold text-primary uppercase tracking-wider">
              Track
            </span>
            <span className="font-display text-2xl font-medium text-ink">
              {recommendation.track}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-[12px] font-semibold text-primary uppercase tracking-wider">
              Difficulty
            </span>
            <span className="text-[15px] font-semibold text-ink">
              {recommendation.difficulty}
            </span>
          </div>

          {recommendation.reason && (
            <div className="pt-2 border-t border-primary/10">
              <p className="text-[13px] text-foreground leading-relaxed">
                {recommendation.reason}
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onStartRecommended}
            disabled={isLoading}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-[14px] font-medium text-white hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Starting...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Start Mission
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

          <button
            onClick={onReturnDashboard}
            disabled={isLoading}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-full border border-border bg-surface px-4 py-3 text-[14px] font-medium text-foreground hover:bg-background transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
