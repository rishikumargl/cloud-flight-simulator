import { CheckCircle2, AlertCircle } from "lucide-react";

interface ExplanationReviewCardProps {
  score: number;
  feedback: {
    strengths?: string[];
    improvements?: string[];
    next_focus?: string;
  };
}

export function ExplanationReviewCard({
  score,
  feedback,
}: ExplanationReviewCardProps) {
  const strengths = feedback.strengths || [];
  const improvements = feedback.improvements || [];

  return (
    <div className="space-y-4">
      <h2 className="mono-label text-primary">AI REVIEW OF YOUR EXPLANATION</h2>

      {/* Explanation Score */}
      <div className="flex items-center gap-6 rounded-xl bg-gradient-to-br from-primary/5 to-primary/2 border border-primary/10 p-6">
        <div className="flex items-center justify-center">
          <div className="relative h-24 w-24">
            <svg className="h-full w-full" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-muted opacity-20"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray={`${(score / 100) * 283} 283`}
                strokeLinecap="round"
                className="text-primary transition-all duration-500"
                style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-display text-2xl font-bold text-ink">
                {score}
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <div>
            <p className="text-[11px] font-semibold text-primary uppercase tracking-wider mb-1">
              Explanation Quality
            </p>
            <p className="text-[13px] text-foreground">
              {score >= 80
                ? "Excellent explanation with clear reasoning"
                : score >= 60
                  ? "Good explanation with some technical depth"
                  : "Explanation needs more detail and clarity"}
            </p>
          </div>
        </div>
      </div>

      {/* Strengths */}
      {strengths.length > 0 && (
        <div className="space-y-2.5">
          <h3 className="text-[13px] font-semibold text-emerald-700 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            What you did well
          </h3>
          <ul className="space-y-2 ml-6">
            {strengths.map((s, i) => (
              <li key={i} className="text-[13px] text-foreground leading-relaxed">
                • {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Areas to Improve */}
      {improvements.length > 0 && (
        <div className="space-y-2.5">
          <h3 className="text-[13px] font-semibold text-amber-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Areas to improve
          </h3>
          <ul className="space-y-2 ml-6">
            {improvements.map((imp, i) => (
              <li key={i} className="text-[13px] text-foreground leading-relaxed">
                • {imp}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
