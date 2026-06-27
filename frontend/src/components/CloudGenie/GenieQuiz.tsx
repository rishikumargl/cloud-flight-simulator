import { useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { QUIZ_QUESTIONS } from "./genieContent";

type AnswerState = "unanswered" | "answered" | "explanation";

interface GenieQuizProps {
  isLocked?: boolean;
  answerState?: AnswerState;
  onAnswered?: () => void;
  onSkip?: () => void;
}

export function GenieQuiz({
  isLocked = false,
  answerState = "unanswered",
  onAnswered,
  onSkip,
}: GenieQuizProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const question = QUIZ_QUESTIONS[currentIndex % QUIZ_QUESTIONS.length];

  // Reset when question changes
  useEffect(() => {
    setSelectedAnswer(null);
  }, [currentIndex]);

  const handleSelect = (index: number) => {
    if (selectedAnswer !== null || isLocked) return; // Already answered or locked
    setSelectedAnswer(index);
    onAnswered?.();
  };

  const handleSkip = () => {
    setSelectedAnswer(null);
    setCurrentIndex((prev) => prev + 1);
    onSkip?.();
  };

  const isCorrect = selectedAnswer === question.answer;

  return (
    <div className="space-y-4 rounded-xl bg-primary/5 border border-primary/10 p-5">
      <div className="space-y-3">
        <h4 className="text-[14px] font-semibold text-ink">Quick Question</h4>
        <p className="text-[13px] text-foreground leading-relaxed">{question.question}</p>
      </div>

      <div className="space-y-2">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleSelect(index)}
            disabled={selectedAnswer !== null}
            className={`w-full text-left text-[12px] px-3 py-2.5 rounded-lg border transition-all ${
              selectedAnswer === null
                ? "border-primary/20 bg-background hover:border-primary/40 cursor-pointer"
                : selectedAnswer === index
                  ? isCorrect
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-red-500 bg-red-50"
                  : index === question.answer
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-muted opacity-50"
            }`}
          >
            <div className="flex items-start gap-2">
              {selectedAnswer === index &&
                (isCorrect ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                ))}
              <span className={selectedAnswer === index ? "font-medium" : ""}>{option}</span>
            </div>
          </button>
        ))}
      </div>

      {(answerState === "answered" || answerState === "explanation") && selectedAnswer !== null && (
        <div
          className={`text-[12px] px-3 py-2 rounded-lg animate-in fade-in-0 duration-300 ${
            isCorrect
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-amber-50 text-amber-800 border border-amber-200"
          }`}
        >
          <p className="font-medium mb-1">{isCorrect ? "Correct!" : "Not quite."}</p>
          <p>{question.explanation}</p>
        </div>
      )}

      {/* Submit and Skip buttons */}
      {answerState === "unanswered" && selectedAnswer === null && (
        <div className="flex gap-2 pt-2">
          <button
            onClick={handleSkip}
            disabled={isLocked}
            className="flex-1 text-[12px] px-3 py-2 rounded-lg border border-muted bg-background hover:border-muted-foreground/50 transition-all disabled:opacity-50"
          >
            Skip
          </button>
        </div>
      )}

      {selectedAnswer !== null && answerState === "unanswered" && (
        <div className="flex gap-2 pt-2">
          <button
            onClick={handleSkip}
            disabled={isLocked}
            className="flex-1 text-[12px] px-3 py-2 rounded-lg border border-muted bg-background hover:border-muted-foreground/50 transition-all disabled:opacity-50"
          >
            Skip Question
          </button>
        </div>
      )}

      <div className="text-[11px] text-foreground/50 text-center pt-2">
        Question {(currentIndex % QUIZ_QUESTIONS.length) + 1} of {QUIZ_QUESTIONS.length}
      </div>
    </div>
  );
}
