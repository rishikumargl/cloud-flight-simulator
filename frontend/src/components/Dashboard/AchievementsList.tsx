import { useEffect, useState } from "react";
import { Sparkles, Trophy, Zap, Flame, Target, Code } from "lucide-react";

interface Achievement {
  id: string;
  name: string;
  earned_at: string;
}

interface AchievementsListProps {
  achievements: Achievement[];
}

const achievementIcons: Record<string, React.ReactNode> = {
  "first-mission": <Trophy className="h-5 w-5" />,
  "five-missions": <Flame className="h-5 w-5" />,
  "perfect-infrastructure": <Zap className="h-5 w-5" />,
  "explanation-master": <Code className="h-5 w-5" />,
  "unstoppable": <Target className="h-5 w-5" />,
  "fast-resolver": <Sparkles className="h-5 w-5" />,
};

export function AchievementsList({ achievements }: AchievementsListProps) {
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Staggered reveal animation
    achievements.forEach((achievement, index) => {
      setTimeout(() => {
        setRevealed((prev) => new Set([...prev, achievement.id]));
      }, index * 100);
    });
  }, [achievements]);

  if (!achievements || achievements.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6 text-center">
        <h2 className="mono-label text-primary mb-4">ACHIEVEMENTS</h2>
        <p className="text-[13px] text-foreground/50">
          Complete missions to unlock achievements
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 space-y-4">
      <h2 className="mono-label text-primary">ACHIEVEMENTS</h2>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {achievements.map((achievement) => {
          const isRevealed = revealed.has(achievement.id);
          const icon = achievementIcons[achievement.id] || <Trophy className="h-5 w-5" />;

          return (
            <div
              key={achievement.id}
              className={`group relative flex flex-col items-center justify-center rounded-lg border border-primary/20 bg-gradient-to-br from-primary/10 to-secondary/10 p-4 text-center transition-all duration-300 ${
                isRevealed
                  ? "scale-100 opacity-100"
                  : "scale-75 opacity-0"
              }`}
            >
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary group-hover:scale-110 transition-transform">
                {icon}
              </div>

              <p className="text-[12px] font-semibold text-ink text-center line-clamp-2">
                {achievement.name}
              </p>

              {/* Hover tooltip with unlock date */}
              <div className="invisible absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-ink px-2 py-1 text-[11px] text-white group-hover:visible z-10">
                {new Date(achievement.earned_at).toLocaleDateString()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
