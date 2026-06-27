"""Feedback service — converts evaluations into AI coaching insights."""

from datetime import datetime
from typing import Dict, Any
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langsmith import traceable

from app.evaluation.models import Evaluation
from app.scenarios.models import Mission
from app.models.challenge_sessions import ChallengeSession
from .schemas import FeedbackSchema


class FeedbackService:
    """Service for generating AI coaching feedback from evaluations."""

    @traceable(
        name="feedback-generation-v1",
        tags=["feedback-generation"],
        metadata={"project": "cloud-flight-simulator"},
    )
    def generate_feedback(
        self,
        evaluation: Evaluation,
        mission: Mission,
        session: ChallengeSession,
        user_id: str
    ) -> FeedbackSchema:
        """Generate AI coaching feedback for completed mission.

        Takes evaluation results and mission details to generate:
        - Strength and weakness analysis
        - Biggest mistake identification
        - Actionable recommendations
        - GCP concept to review
        - Readiness assessment

        Args:
            evaluation: Evaluation ORM with results
            mission: Mission ORM with criteria
            session: ChallengeSession ORM
            user_id: User UUID

        Returns:
            FeedbackSchema with coaching insights
        """
        try:
            # Build context for LLM
            score = int(evaluation.percentage)
            status = "PASSED" if score >= 80 else "PARTIAL" if score >= 50 else "FAILED"

            criteria_results = evaluation.criteria_results.get("criteria", [])
            passed = [c for c in criteria_results if c.get("passed")]
            failed = [c for c in criteria_results if not c.get("passed")]

            # Extract mission context
            mission_title = mission.title
            mission_difficulty = mission.difficulty
            mission_objectives = mission.objectives if mission.objectives else []

            # Prepare failure details for LLM analysis
            failure_analysis = ""
            if failed:
                failures = [c.get("details", "Unknown") for c in failed]
                failure_analysis = f"Failed checks: {'; '.join(failures)}"

            # Get LLM from factory
            try:
                from app.llm.factory import get_llm
            except ImportError:
                from app.llm.factory import get_llm

            llm = get_llm()

            # Create coaching prompt
            prompt_template = PromptTemplate(
                input_variables=[
                    "mission_title",
                    "difficulty",
                    "score",
                    "status",
                    "objectives",
                    "passed_criteria",
                    "failed_criteria",
                    "num_passed",
                    "num_failed"
                ],
                template="""You are an expert GCP instructor and coach. Analyze this mission result and provide coaching feedback.

Mission: {mission_title}
Difficulty: {difficulty}
Score: {score}%
Status: {status}

Objectives:
{objectives}

Passed Criteria ({num_passed}):
{passed_criteria}

Failed Criteria ({num_failed}):
{failed_criteria}

Generate coaching feedback in JSON format (no markdown, no explanation):
{{{{
  "strengths": ["What learner did well - specific to this mission"],
  "weaknesses": ["Areas to improve - specific failures"],
  "biggest_mistake": "The primary error or misconception - one sentence",
  "recommendation": "Specific actionable next steps",
  "cloud_concept": "Key GCP concept to review (e.g., 'VM metadata', 'network tags')",
  "suggested_next_mission": "Type: VM_DEBUGGING, NETWORKING, IAM, SECURITY, or null",
  "estimated_readiness": "READY_FOR_HARDER, REPEAT_THIS_LEVEL, or NEEDS_FOUNDATION"
}}}}

Be concise, specific, and encouraging. Focus on what learner can improve.""",
            )

            parser = JsonOutputParser()
            chain = prompt_template | llm | parser

            # Invoke LLM
            objectives_text = "\n".join(mission_objectives) if mission_objectives else "No objectives"
            passed_text = "\n".join([f"✓ {c.get('details', 'Passed')}" for c in passed]) if passed else "None"
            failed_text = "\n".join([f"✗ {c.get('details', 'Failed')}" for c in failed]) if failed else "None"

            feedback_data = chain.invoke({
                "mission_title": mission_title,
                "difficulty": mission_difficulty,
                "score": score,
                "status": status,
                "objectives": objectives_text,
                "passed_criteria": passed_text,
                "failed_criteria": failed_text,
                "num_passed": len(passed),
                "num_failed": len(failed)
            })

            # Validate response has required fields
            required_fields = [
                "strengths",
                "weaknesses",
                "biggest_mistake",
                "recommendation",
                "cloud_concept",
                "suggested_next_mission",
                "estimated_readiness"
            ]
            for field in required_fields:
                if field not in feedback_data:
                    raise ValueError(f"Missing required field in feedback: {field}")

            # Create FeedbackSchema
            return FeedbackSchema(
                session_id=str(session.session_id),
                user_id=str(user_id),
                mission_id=str(mission.mission_id),
                score=score,
                status=status,
                strengths=feedback_data.get("strengths", []),
                weaknesses=feedback_data.get("weaknesses", []),
                biggest_mistake=feedback_data.get("biggest_mistake", "Unable to determine"),
                recommendation=feedback_data.get("recommendation", "Review GCP documentation"),
                cloud_concept=feedback_data.get("cloud_concept", "GCP best practices"),
                suggested_next_mission=feedback_data.get("suggested_next_mission"),
                estimated_readiness=feedback_data.get("estimated_readiness", "REPEAT_THIS_LEVEL"),
                generated_at=datetime.utcnow()
            )

        except Exception as e:
            print(f"[ERROR] Feedback generation failed: {e}")
            # Return safe fallback feedback
            return FeedbackSchema(
                session_id=str(session.session_id),
                user_id=str(user_id),
                mission_id=str(mission.mission_id),
                score=int(evaluation.percentage),
                status="PARTIAL",
                strengths=["You completed the mission"],
                weaknesses=["Review the criteria that failed"],
                biggest_mistake="Review failed criteria in evaluation results",
                recommendation="Study the mission objectives and try again",
                cloud_concept="GCP Compute Engine",
                suggested_next_mission=None,
                estimated_readiness="REPEAT_THIS_LEVEL",
                generated_at=datetime.utcnow()
            )
