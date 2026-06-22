from typing import Optional, Dict, Any, List
from uuid import UUID
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import select
import json
from langchain.prompts import ChatPromptTemplate
from langchain.schema.runnable import RunnablePassthrough
from langsmith import traceable
import logging

from .schemas import (
    FeedbackReportSchema,
    EvaluationResultSchema,
    MissionSchema,
    NextRecommendationSchema
)
from .models import FeedbackReport

logger = logging.getLogger(__name__)


class FeedbackService:
    """Handles feedback generation and persistence."""

    def __init__(self, db: Session, llm):
        """Initialize feedback service."""
        self.db = db
        self.llm = llm

    @traceable(
        name="feedback-generation-v1",
        tags=["feedback-generation", "langchain"],
        metadata={"project": "cloud-flight-simulator", "domain": "P6-feedback"}
    )
    def generate_feedback(
        self,
        session_id: UUID,
        user_id: UUID,
        evaluation: EvaluationResultSchema,
        mission: MissionSchema,
        learner_history: Optional[List[Dict[str, Any]]] = None
    ) -> FeedbackReportSchema:
        """Generate personalized feedback based on evaluation results."""
        if not evaluation or not mission:
            raise ValueError("Cannot generate feedback without evaluation and mission data")

        prompt = self._build_feedback_prompt(evaluation, mission, learner_history)
        feedback_text = self._invoke_feedback_chain(prompt, evaluation, mission)
        feedback_report = self._structure_feedback_response(session_id, feedback_text, evaluation, mission)
        self._persist_feedback(feedback_report)

        return feedback_report

    def _build_feedback_prompt(
        self, evaluation: EvaluationResultSchema, mission: MissionSchema, learner_history: Optional[List[Dict[str, Any]]] = None
    ) -> str:
        """Build the feedback generation prompt with grounding instructions."""
        strengths = []
        mistakes = []

        for criterion in evaluation.criteria_results:
            desc = criterion.get("description", "")
            reasoning = criterion.get("reasoning", "")
            resource_met = criterion.get("resource_met", False)

            if resource_met:
                strengths.append({"description": desc, "reasoning": reasoning})
            else:
                mistakes.append({"description": desc, "reasoning": reasoning})

        learner_context = ""
        if learner_history:
            learner_context = f"\n\nLEARNER HISTORY:\n{json.dumps(learner_history[:5], indent=2)}"

        prompt = f"""You are a cloud infrastructure expert and learning assessor.
Your role is to EXPLAIN the evaluation results provided below. Do not re-score or re-evaluate.

CRITICAL CONSTRAINTS:
1. Base ALL feedback on the provided evaluation results ONLY
2. Do NOT invent resources, failures, successes, or configurations
3. When referencing resource names, strip the prefix and use ONLY the human-readable suffix
4. You are explaining the evaluation - NOT generating new scores

MISSION CONTEXT:
Title: {mission.title}
Track: {mission.track}
Difficulty: {mission.difficulty}

EVALUATION RESULTS:
Score: {evaluation.percentage}%
Evaluation Mode: {evaluation.evaluation_mode}

CRITERIA ASSESSMENT:
{json.dumps(evaluation.criteria_results, indent=2)}

STRENGTHS (resource_met = true):
{json.dumps(strengths, indent=2)}

MISTAKES (resource_met = false):
{json.dumps(mistakes, indent=2)}
{learner_context}

TASK:
Generate structured feedback in this format:

## PERFORMANCE ASSESSMENT
**Assessment:** [Excellent/Good/Fair/Needs Improvement]
**Summary:** [1-2 sentences summarizing overall performance]

## STRENGTHS
- [Strength 1]
- [Strength 2]

## MISTAKES
- [Mistake 1]
- [Mistake 2]

## IMPROVEMENTS
- [Area 1]
- [Area 2]"""

        return prompt

    def _invoke_feedback_chain(self, prompt: str, evaluation: EvaluationResultSchema, mission: MissionSchema) -> str:
        """Invoke the feedback-generation-v1 LangChain chain."""
        from langchain.schema import SystemMessage, HumanMessage

        messages = [
            SystemMessage(content="You are a cloud infrastructure learning assessor. Provide structured feedback based on evaluation results only."),
            HumanMessage(content=prompt)
        ]

        response = self.llm.invoke(messages)
        feedback_text = response.content if hasattr(response, 'content') else str(response)

        logger.info(f"Feedback generated for session {evaluation.session_id}")

        return feedback_text

    def _structure_feedback_response(
        self, session_id: UUID, feedback_text: str, evaluation: EvaluationResultSchema, mission: MissionSchema
    ) -> FeedbackReportSchema:
        """Parse LLM feedback and structure into FeedbackReportSchema."""
        parsed = self._parse_feedback_sections(feedback_text)

        next_rec = self._determine_next_recommendation(
            percentage=evaluation.percentage,
            current_track=mission.track,
            current_difficulty=mission.difficulty,
            reasoning=parsed.get("reasoning", "")
        )

        report = FeedbackReportSchema(
            feedback_id=UUID(int=0),
            session_id=session_id,
            summary=parsed.get("summary", ""),
            strengths=parsed.get("strengths", []),
            mistakes=parsed.get("mistakes", []),
            improvements=parsed.get("improvements", []),
            next_recommendation=next_rec,
            generated_at=datetime.utcnow()
        )

        return report

    def _parse_feedback_sections(self, feedback_text: str) -> Dict[str, Any]:
        """Parse structured feedback from LLM response."""
        sections = {"summary": "", "strengths": [], "mistakes": [], "improvements": [], "reasoning": ""}
        lines = feedback_text.split("\n")
        current_section = None

        for line in lines:
            line = line.strip()

            if "SUMMARY" in line.upper():
                current_section = "summary"
            elif "STRENGTHS" in line.upper():
                current_section = "strengths"
            elif "MISTAKES" in line.upper():
                current_section = "mistakes"
            elif "IMPROVEMENTS" in line.upper():
                current_section = "improvements"
            elif "RECOMMENDED" in line.upper():
                current_section = "reasoning"
            elif line.startswith("-") and current_section in ["strengths", "mistakes", "improvements"]:
                sections[current_section].append(line.lstrip("- "))
            elif line and current_section == "summary" and not line.startswith("**"):
                sections["summary"] = line if not sections["summary"] else sections["summary"] + " " + line

        return sections

    def _determine_next_recommendation(self, percentage: int, current_track: str, current_difficulty: str, reasoning: str) -> NextRecommendationSchema:
        """Determine next recommendation based on percentage thresholds."""
        difficulty_progression = {
            "BEGINNER": "INTERMEDIATE",
            "INTERMEDIATE": "ADVANCED",
            "ADVANCED": "EXPERT",
            "EXPERT": "MASTER",
            "MASTER": "MASTER"
        }

        if percentage >= 80:
            next_difficulty = difficulty_progression.get(current_difficulty, current_difficulty)
            rec_reason = f"Excellent performance ({percentage}%) on {current_difficulty} challenges. Ready for {next_difficulty} level."
        elif percentage < 60:
            next_difficulty = current_difficulty
            rec_reason = f"Score of {percentage}% indicates need for more practice at {current_difficulty} level."
        else:
            next_difficulty = current_difficulty
            rec_reason = f"Solid performance ({percentage}%) on {current_difficulty} challenges. Continue to strengthen fundamentals."

        return NextRecommendationSchema(track=current_track, difficulty=next_difficulty, reason=rec_reason)

    def _persist_feedback(self, report: FeedbackReportSchema) -> None:
        """Persist feedback report to database."""
        feedback_record = FeedbackReport(
            feedback_id=report.feedback_id,
            session_id=report.session_id,
            summary=report.summary,
            strengths=report.strengths,
            mistakes=report.mistakes,
            improvements=report.improvements,
            next_recommendation=report.next_recommendation.dict(),
            generated_at=report.generated_at
        )

        self.db.add(feedback_record)
        self.db.commit()
        self.db.refresh(feedback_record)

        logger.info(f"Feedback persisted: {report.feedback_id}")

    def get_feedback(self, session_id: UUID) -> Optional[FeedbackReportSchema]:
        """Retrieve existing feedback report by session ID."""
        stmt = select(FeedbackReport).where(FeedbackReport.session_id == session_id)
        record = self.db.execute(stmt).scalars().first()

        if not record:
            return None

        return FeedbackReportSchema(
            feedback_id=record.feedback_id,
            session_id=record.session_id,
            summary=record.summary,
            strengths=record.strengths or [],
            mistakes=record.mistakes or [],
            improvements=record.improvements or [],
            next_recommendation=NextRecommendationSchema(**record.next_recommendation),
            generated_at=record.generated_at
        )
