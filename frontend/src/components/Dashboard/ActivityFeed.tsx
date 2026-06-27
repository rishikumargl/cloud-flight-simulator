import { ActivityFeedItem } from "./ActivityFeedItem";

interface MissionItem {
  mission_id: string;
  title: string;
  track: string;
  score: number;
  explanation_score?: number;
  status: "PASSED" | "PARTIAL" | "FAILED";
  completed_at: string;
}

interface ActivityFeedProps {
  missions: MissionItem[];
}

export function ActivityFeed({ missions }: ActivityFeedProps) {
  if (!missions || missions.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6 text-center">
        <h2 className="mono-label text-primary mb-4">RECENT ACTIVITY</h2>
        <p className="text-[13px] text-foreground/50">
          Complete a mission to see your activity here
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 space-y-4">
      <h2 className="mono-label text-primary">RECENT ACTIVITY</h2>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {missions.map((mission) => (
          <ActivityFeedItem key={mission.mission_id} mission={mission} />
        ))}
      </div>
    </div>
  );
}
