import { useEffect, useState } from "react";
import {
  Cloud,
  Lightbulb,
  Brain,
  BookOpen,
  Zap,
  HelpCircle,
} from "lucide-react";
import {
  CLOUD_FACTS,
  CLOUD_TIPS,
  INTERVIEW_QUESTIONS,
  BEHIND_THE_SCENES,
  DIFFICULTY_HINTS,
  MINI_CHALLENGES,
} from "./genieContent";

type CardType = "facts" | "tips" | "interview" | "behind" | "hints" | "challenges";

interface Card {
  type: CardType;
  content: string;
  icon: React.ReactNode;
  label: string;
}

interface GenieCarouselProps {
  difficulty?: "beginner" | "intermediate" | "advanced";
  isLocked?: boolean;
}

function getRandomCard(difficulty: "beginner" | "intermediate" | "advanced"): Card {
  const cardTypes: CardType[] = [
    "facts",
    "tips",
    "interview",
    "behind",
    "hints",
    "challenges",
  ];
  const type = cardTypes[Math.floor(Math.random() * cardTypes.length)];

  const iconMap: Record<CardType, React.ReactNode> = {
    facts: <Cloud className="h-4 w-4" />,
    tips: <Lightbulb className="h-4 w-4" />,
    interview: <Brain className="h-4 w-4" />,
    behind: <Zap className="h-4 w-4" />,
    hints: <BookOpen className="h-4 w-4" />,
    challenges: <HelpCircle className="h-4 w-4" />,
  };

  const labelMap: Record<CardType, string> = {
    facts: "Cloud Fact",
    tips: "Pro Tip",
    interview: "Interview Prep",
    behind: "Behind the Scenes",
    hints: "Mission Hint",
    challenges: "Mini Challenge",
  };

  let content = "";
  switch (type) {
    case "facts":
      content = CLOUD_FACTS[Math.floor(Math.random() * CLOUD_FACTS.length)];
      break;
    case "tips":
      content = CLOUD_TIPS[Math.floor(Math.random() * CLOUD_TIPS.length)];
      break;
    case "interview": {
      const q = INTERVIEW_QUESTIONS[Math.floor(Math.random() * INTERVIEW_QUESTIONS.length)];
      content = `Q: ${q.q}\n\nA: ${q.a}`;
      break;
    }
    case "behind":
      content = BEHIND_THE_SCENES[Math.floor(Math.random() * BEHIND_THE_SCENES.length)];
      break;
    case "hints": {
      const hints = DIFFICULTY_HINTS[difficulty];
      content = hints[Math.floor(Math.random() * hints.length)];
      break;
    }
    case "challenges":
      content = MINI_CHALLENGES[Math.floor(Math.random() * MINI_CHALLENGES.length)];
      break;
  }

  return {
    type,
    content,
    icon: iconMap[type],
    label: labelMap[type],
  };
}

export function GenieCarousel({ difficulty = "beginner", isLocked = false }: GenieCarouselProps) {
  const [card, setCard] = useState<Card>(() => getRandomCard(difficulty));
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Rotate card every 8-10 seconds (only if not locked by interactive card)
  useEffect(() => {
    if (isLocked) return;

    const timer = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCard(getRandomCard(difficulty));
        setIsTransitioning(false);
      }, 300);
    }, 8000 + Math.random() * 2000); // 8-10 seconds

    return () => clearInterval(timer);
  }, [difficulty, isLocked]);

  return (
    <div className="space-y-3">
      <div
        className={`rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-5 min-h-[140px] flex flex-col justify-between transition-all duration-300 ${
          isTransitioning ? "opacity-0 scale-95" : "opacity-100 scale-100"
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
            {card.icon}
          </div>
          <div className="flex-1">
            <div className="text-[11px] font-semibold text-primary uppercase tracking-wide mb-2">
              {card.label}
            </div>
            <p className="text-[13px] text-foreground leading-relaxed whitespace-pre-line">
              {card.content}
            </p>
          </div>
        </div>
      </div>

      {/* Rotation indicator dots */}
      <div className="flex items-center justify-center gap-1">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === ["facts", "tips", "interview", "behind", "hints", "challenges"].indexOf(
                card.type
              )
                ? "w-3 bg-primary"
                : "w-1.5 bg-muted"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
