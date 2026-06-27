interface SkillRadarProps {
  skills: Record<
    string,
    {
      proficiency: number;
      confidence?: number;
    }
  >;
}

export function SkillRadar({ skills }: SkillRadarProps) {
  const skillLabels: Record<string, string> = {
    compute: "Compute",
    networking: "Networking",
    storage: "Storage",
    iam: "IAM",
    linux: "Linux",
    devops: "DevOps",
    cloud_ops: "Cloud Ops",
  };

  // Get top 2 and bottom 2 skills
  const skillEntries = Object.entries(skills)
    .map(([key, value]) => ({
      key,
      label: skillLabels[key] || key,
      proficiency: value.proficiency || 0,
    }))
    .sort((a, b) => b.proficiency - a.proficiency);

  const topSkills = skillEntries.slice(0, 2);
  const bottomSkills = skillEntries.slice(-2).reverse();

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 space-y-4">
      <h2 className="mono-label text-primary">SKILL RADAR</h2>

      <div className="space-y-4">
        {/* Strongest Skills */}
        <div className="space-y-2">
          <p className="text-[12px] font-semibold text-primary uppercase tracking-wider">
            Strongest Skills
          </p>
          {topSkills.length > 0 ? (
            <div className="space-y-2">
              {topSkills.map((skill) => (
                <div key={skill.key} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium text-ink">
                      {skill.label}
                    </span>
                    <span className="text-[12px] font-semibold text-emerald-600">
                      {skill.proficiency}%
                    </span>
                  </div>
                  <div className="w-full bg-background rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${skill.proficiency}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-foreground/50">No skill data yet</p>
          )}
        </div>

        <div className="border-t border-border" />

        {/* Areas to Improve */}
        <div className="space-y-2">
          <p className="text-[12px] font-semibold text-amber-600 uppercase tracking-wider">
            Areas to Improve
          </p>
          {bottomSkills.length > 0 ? (
            <div className="space-y-2">
              {bottomSkills.map((skill) => (
                <div key={skill.key} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium text-foreground">
                      {skill.label}
                    </span>
                    <span className="text-[12px] font-semibold text-amber-600">
                      {skill.proficiency}%
                    </span>
                  </div>
                  <div className="w-full bg-background rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full"
                      style={{ width: `${skill.proficiency}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-foreground/50">No skill data yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
