import { useEffect, useState } from "react";

interface SkillBreakdownCardProps {
  skills: Record<string, { proficiency: number; weight?: number }>;
}

export function SkillBreakdownCard({ skills }: SkillBreakdownCardProps) {
  const [displayValues, setDisplayValues] = useState<Record<string, number>>({});

  // Animate skill bars on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayValues(
        Object.fromEntries(
          Object.entries(skills).map(([k, v]) => [k, v.proficiency])
        )
      );
    }, 100);
    return () => clearTimeout(timer);
  }, [skills]);

  const skillLabels: Record<string, string> = {
    compute: "Compute",
    storage: "Storage",
    networking: "Networking",
    iam: "IAM",
    linux: "Linux",
    debugging: "Debugging",
    devops: "DevOps",
    cloud_ops: "Cloud Operations",
    operations: "Operations",
    architecture: "Architecture",
    security: "Security",
  };

  return (
    <div className="space-y-4">
      <h2 className="mono-label text-primary">TECHNICAL SKILLS DEMONSTRATED</h2>

      <div className="space-y-4 rounded-xl bg-gradient-to-br from-blue-50/50 to-cyan-50/50 border border-blue-100/50 p-6">
        {Object.entries(skills).map(([skill, data]) => {
          const current = displayValues[skill] ?? 0;
          const label = skillLabels[skill] || skill.replace(/_/g, " ");

          return (
            <div key={skill} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-semibold text-ink uppercase tracking-wider">
                  {label}
                </span>
                <span className="text-[13px] font-semibold text-primary">
                  {current}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/50">
                <div
                  className="h-full bg-gradient-to-r from-primary to-blue-400 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${current}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
