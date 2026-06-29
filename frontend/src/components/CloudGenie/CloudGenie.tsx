import { useEffect, useState } from "react";
import { CheckCircle2, Cloud, AlertTriangle } from "lucide-react";
import { ProvisionTimeline } from "./ProvisionTimeline";
import { GenieCarousel } from "./GenieCarousel";
import { GenieQuiz } from "./GenieQuiz";
import { ENCOURAGING_MESSAGES } from "./genieContent";

interface CloudGenieProps {
  stage: "generating" | "provisioning" | "ready" | "error";
  errorMsg?: string | null;
  difficulty?: "beginner" | "intermediate" | "advanced";
}

type GenieCardMode = "carousel" | "quiz";
type QuizAnswerState = "unanswered" | "answered" | "explanation";

export function CloudGenie({ stage, errorMsg, difficulty = "beginner" }: CloudGenieProps) {
  const [encouragingIndex, setEncouragingIndex] = useState(0);

  // Independent Genie card lifecycle
  const [cardMode, setCardMode] = useState<GenieCardMode>("carousel");
  const [quizAnswerState, setQuizAnswerState] = useState<QuizAnswerState>("unanswered");
  const [shouldLockCard, setShouldLockCard] = useState(false);

  // Rotate encouraging messages (independent from provisioning)
  useEffect(() => {
    const timer = setInterval(() => {
      setEncouragingIndex((prev) => (prev + 1) % ENCOURAGING_MESSAGES.length);
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  // When quiz answer is shown, lock the card for 3-4 seconds
  useEffect(() => {
    if (quizAnswerState === "explanation") {
      setShouldLockCard(true);
      const timer = setTimeout(() => {
        setQuizAnswerState("unanswered");
        setShouldLockCard(false);
        // Auto-rotate to new card after explanation
        setCardMode(Math.random() > 0.4 ? "quiz" : "carousel");
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [quizAnswerState]);

  // Handle quiz submission from child
  const handleQuizAnswered = () => {
    setQuizAnswerState("answered");
    setTimeout(() => {
      setQuizAnswerState("explanation");
    }, 300);
  };

  // Handle skip button
  const handleSkipQuestion = () => {
    setQuizAnswerState("unanswered");
    setShouldLockCard(false);
    // Load new random card
    setCardMode(Math.random() > 0.4 ? "quiz" : "carousel");
  };

  const isError = stage === "error";
  const isReady = stage === "ready";

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
        isError
          ? "bg-red-50/50"
          : isReady
            ? "bg-emerald-50/50"
            : "bg-gradient-to-br from-primary/5 via-background to-secondary/5"
      }`}
      style={{
        backdropFilter: "blur(10px)",
      }}
    >
      <div
        className={`w-full max-w-2xl rounded-3xl border p-8 shadow-2xl transition-all duration-500 ${
          isError
            ? "border-red-200 bg-white"
            : isReady
              ? "border-emerald-200 bg-white"
              : "border-primary/10 bg-white/95"
        }`}
        style={{
          animation:
            !isError && !isReady ? "cfModalIn 0.5s cubic-bezier(0.34,1.4,0.64,1) both" : "none",
        }}
      >
        {/* Header */}
        <div className="mb-8 text-center">
          {isError ? (
            <div className="mb-4 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </div>
          ) : isReady ? (
            <div className="mb-4 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 animate-pulse">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
            </div>
          ) : (
            <div className="mb-4 flex justify-center">
              <div
                className="text-5xl"
                style={{
                  animation:
                    "cfFloatingCloud 3s cubic-bezier(0.4, 0.0, 0.2, 1) infinite",
                }}
              >
                ☁️
              </div>
            </div>
          )}

          <h3
            className={`font-display text-2xl font-medium ${
              isError
                ? "text-red-900"
                : isReady
                  ? "text-emerald-900"
                  : "text-ink"
            } mb-2`}
          >
            {isError
              ? "Launch Failed"
              : isReady
                ? "Cloud Environment Ready!"
                : "Cloud Genie"}
          </h3>

          {isError ? (
            <p className="text-sm text-red-700 mb-4">{errorMsg}</p>
          ) : isReady ? (
            <p className="text-sm text-emerald-700 mb-4">
              Your lab is prepared. Launching your mission...
            </p>
          ) : (
            <>
              <p className="text-sm text-foreground mb-2">
                Preparing your personal cloud lab...
              </p>
              <p className="text-xs text-foreground/60 mb-6">
                Estimated wait: 45–90 seconds
              </p>
            </>
          )}
        </div>

        {/* Content */}
        {!isError && !isReady && (
          <div className="space-y-8">
            {/* Timeline */}
            <div className="bg-gradient-to-br from-blue-50/50 to-cyan-50/50 rounded-2xl border border-blue-100/50 p-6">
              <h4 className="text-xs font-semibold text-primary/80 uppercase tracking-wider mb-4">
                Provisioning Progress
              </h4>
              <ProvisionTimeline stage={stage} />
            </div>

            {/* Learning Content — Decoupled from provisioning */}
            <div className="space-y-6">
              {cardMode === "carousel" ? (
                <GenieCarousel difficulty={difficulty} isLocked={shouldLockCard} />
              ) : (
                <GenieQuiz
                  isLocked={shouldLockCard}
                  answerState={quizAnswerState}
                  onAnswered={handleQuizAnswered}
                  onSkip={handleSkipQuestion}
                />
              )}
            </div>

            {/* Encouraging message */}
            <div className="text-center">
              <p
                className={`text-sm font-medium text-foreground/70 transition-all duration-500 ${
                  encouragingIndex % 2 === 0 ? "opacity-100" : "opacity-60"
                }`}
              >
                {ENCOURAGING_MESSAGES[encouragingIndex]}
              </p>
            </div>
          </div>
        )}

        {isError && (
          <div className="space-y-4">
            <p className="text-sm text-foreground leading-relaxed">
              Something went wrong while launching your challenge. Try again or contact support if
              the issue persists.
            </p>
          </div>
        )}

        {isReady && (
          <div className="text-center">
            <p className="text-sm text-foreground/70">
              Your environment is ready. You'll be redirected shortly...
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes cfFloatingCloud {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          25% { transform: translateY(-8px) translateX(4px); }
          50% { transform: translateY(-12px) translateX(-4px); }
          75% { transform: translateY(-8px) translateX(4px); }
        }

        @keyframes cfModalIn {
          from { opacity: 0; transform: scale(0.92) translateY(16px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
