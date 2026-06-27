import { useEffect, useState } from "react";
import { CheckCircle2, Circle, RefreshCw } from "lucide-react";
import { PROVISION_STEPS } from "./genieContent";

interface ProvisionTimelineProps {
  stage: "generating" | "provisioning" | "ready" | "error";
}

export function ProvisionTimeline({ stage }: ProvisionTimelineProps) {
  const [completedSteps, setCompletedSteps] = useState<number>(0);

  // Advance through steps every few seconds
  useEffect(() => {
    if (stage === "error" || stage === "ready") return;

    // Map stage to how many steps should be completed
    const stepMap = {
      generating: 1,
      provisioning: 3, // At least 3 steps by provisioning
      ready: PROVISION_STEPS.length,
    };

    const targetSteps = stepMap[stage] || 0;

    // Animate steps with staggered timing
    if (completedSteps < targetSteps) {
      const timer = setTimeout(() => {
        setCompletedSteps((prev) => Math.min(prev + 1, targetSteps));
      }, 800 + Math.random() * 1200); // 800-2000ms per step

      return () => clearTimeout(timer);
    }
  }, [stage, completedSteps]);

  // When ready, complete all remaining steps
  useEffect(() => {
    if (stage === "ready" && completedSteps < PROVISION_STEPS.length) {
      setCompletedSteps(PROVISION_STEPS.length);
    }
  }, [stage, completedSteps]);

  return (
    <div className="space-y-2">
      {PROVISION_STEPS.map((step, index) => {
        const isCompleted = index < completedSteps;
        const isActive = index === completedSteps && stage === "provisioning";

        return (
          <div
            key={step.key}
            className={`flex items-center gap-3 transition-all duration-300 ${
              isCompleted || isActive ? "opacity-100" : "opacity-40"
            }`}
          >
            <div className="relative flex h-5 w-5 shrink-0 items-center justify-center">
              {isCompleted ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              ) : isActive ? (
                <div className="relative">
                  <RefreshCw className="h-5 w-5 animate-spin text-primary" />
                  <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-pulse" />
                </div>
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <span
              className={`text-[13px] font-medium transition-all duration-300 ${
                isCompleted
                  ? "text-emerald-700"
                  : isActive
                    ? "text-primary font-semibold"
                    : "text-foreground"
              }`}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
