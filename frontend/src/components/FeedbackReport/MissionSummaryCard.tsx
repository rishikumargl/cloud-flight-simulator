interface MissionSummaryCardProps {
  summary: string;
}

export function MissionSummaryCard({ summary }: MissionSummaryCardProps) {
  return (
    <div className="space-y-3">
      <h2 className="mono-label text-primary">MISSION DEBRIEF</h2>
      <div className="rounded-xl bg-gradient-to-br from-primary/5 to-primary/2 border border-primary/10 p-6">
        <p className="text-[15px] leading-relaxed text-foreground whitespace-pre-line">
          {summary}
        </p>
      </div>
    </div>
  );
}
