interface LearnerLevelProps {
  currentLevel: string;
  progressPct: number;
  nextLevel: string;
}

export function LearnerLevel({
  currentLevel,
  progressPct,
  nextLevel,
}: LearnerLevelProps) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 space-y-4">
      <h2 className="mono-label text-primary">CURRENT LEVEL</h2>

      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <p className="text-lg font-semibold text-ink">{currentLevel}</p>
          <p className="text-[13px] font-semibold text-foreground/60">{progressPct}%</p>
        </div>

        <div className="w-full bg-background rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <p className="text-[13px] text-foreground/60">Next Level: {nextLevel}</p>
      </div>
    </div>
  );
}
