import { Flame, Target } from "lucide-react";

interface LearningStreakProps {
  current: number;
  longest: number;
  missionsThisWeek: number;
  averageScore?: number;
}

export function LearningStreak({
  current,
  longest,
  missionsThisWeek,
  averageScore,
}: LearningStreakProps) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 space-y-4">
      <h2 className="mono-label text-primary">LEARNING STREAK</h2>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          <span className="text-[13px] font-semibold text-foreground/60 uppercase tracking-wider">
            Current Streak
          </span>
          <span className="ml-auto text-xl font-bold text-ink">{current} days</span>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-border">
          <Target className="h-5 w-5 text-primary" />
          <span className="text-[13px] font-semibold text-foreground/60 uppercase tracking-wider">
            This Week
          </span>
          <span className="ml-auto text-lg font-semibold text-ink">{missionsThisWeek} missions</span>
        </div>

        {averageScore !== undefined && (
          <div className="pt-2 border-t border-border">
            <p className="text-[13px] font-semibold text-foreground/60 uppercase tracking-wider mb-1">
              Average Score
            </p>
            <p className="text-lg font-semibold text-ink">{Math.round(averageScore)}%</p>
          </div>
        )}

        <div className="pt-2 border-t border-border text-[12px] text-foreground/50">
          Longest streak: {longest} days
        </div>
      </div>
    </div>
  );
}
