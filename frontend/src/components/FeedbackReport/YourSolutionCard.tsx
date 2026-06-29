import { ChevronDown } from "lucide-react";
import { useState } from "react";

interface YourSolutionCardProps {
  solution: string;
}

export function YourSolutionCard({ solution }: YourSolutionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const preview = solution.substring(0, 150) + (solution.length > 150 ? "..." : "");

  return (
    <div className="space-y-3">
      <h2 className="mono-label text-primary">YOUR SOLUTION</h2>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left rounded-xl bg-slate-50 dark:bg-slate-900 border border-border p-5 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
      >
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[13px] text-foreground leading-relaxed whitespace-pre-wrap break-words">
              {isExpanded ? solution : preview}
            </p>
          </div>
          <ChevronDown
            className={`h-4 w-4 shrink-0 transition-transform ${
              isExpanded ? "rotate-180" : ""
            } text-foreground/40 mt-1`}
          />
        </div>
      </button>
    </div>
  );
}
