"""Feedback generation LangChain chain — P6 owned."""
import json
from pydantic import BaseModel, Field
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langsmith import traceable


class FeedbackOutput(BaseModel):
    """Structured feedback output from LLM."""
    summary: str = Field(..., description="Overall feedback text")
    strengths: list[str] = Field(..., description="What the learner did well")
    mistakes: list[str] = Field(..., description="What went wrong")
    improvements: list[str] = Field(..., description="Topics to study more")
    next_recommendation: dict = Field(
        ...,
        description="Recommendation with track, difficulty, and reason"
    )


def generate_feedback(
    evaluation_result: dict,
    mission_context: dict,
    learner_history: dict,
) -> FeedbackOutput:
    """
    Generate feedback using feedback-generation-v1 LangChain chain.

    Args:
        evaluation_result: EvaluationResultSchema from P5 (percentage, criteria_results, resource_snapshot)
        mission_context: MissionSchema from P3 (track, difficulty, title, objectives)
        learner_history: Learner's past performance (prior scores, attempts)

    Returns:
        FeedbackOutput with strengths, mistakes, improvements, and next_recommendation
    """
    percentage = evaluation_result.get("percentage", 0)
    criteria_results = evaluation_result.get("criteria_results", [])
    resource_snapshot = evaluation_result.get("resource_snapshot", {})

    track = mission_context.get("track", "COMPUTE")
    difficulty = mission_context.get("difficulty", "BEGINNER")
    title = mission_context.get("title", "Unknown Challenge")

    avg_prior_score = learner_history.get("average_score", 0)
    num_attempts = learner_history.get("num_attempts", 0)

    strengths_list = [
        c.get("description")
        for c in criteria_results
        if c.get("resource_met") is True
    ]
    mistakes_list = [
        c.get("description")
        for c in criteria_results
        if c.get("resource_met") is False
    ]

    resource_prefix = resource_snapshot.get("resource_prefix", "")

    prompt_template = PromptTemplate(
        input_variables=[
            "title", "track", "difficulty", "percentage", "num_attempts", "avg_prior_score",
            "strengths_list", "mistakes_list", "resource_prefix"
        ],
        template="""You are an expert feedback generator for a GCP learning platform. Your role is to explain evaluation results to learners, not to re-score or re-evaluate.

MISSION CONTEXT:
- Title: {title}
- Track: {track}
- Difficulty: {difficulty}

LEARNER PERFORMANCE:
- Score: {percentage}%
- Attempts: {num_attempts}
- Prior average: {avg_prior_score}%

EVALUATION RESULTS:
- Passed criteria: {strengths_list}
- Failed criteria: {mistakes_list}

RESOURCE PREFIX TO STRIP: "{resource_prefix}"

CRITICAL INSTRUCTIONS:
1. Base ALL feedback on the evaluation results above. Do NOT invent resources, failures, or successes.
2. When referencing resource names, STRIP the prefix "{resource_prefix}" and use only the human-readable suffix.
3. Explain WHY the learner succeeded or failed based on the criteria.
4. Your role is to EXPLAIN the evaluation—not to re-evaluate or override it.
5. Make feedback constructive and encouraging.

NEXT RECOMMENDATION LOGIC:
- If score >= 80%: recommend NEXT difficulty level in the same track
- If score < 60%: recommend SAME difficulty level
- If 60% <= score < 80%: recommend SAME difficulty (or next if reasoning is strong)

Generate feedback in JSON format with ONLY this structure (no markdown, no extra text):
{{
    "summary": "Brief overall feedback (1-2 sentences)",
    "strengths": ["What they did well", "Another strength"],
    "mistakes": ["What went wrong", "Another error"],
    "improvements": ["Topic to study", "Another area"],
    "next_recommendation": {{
        "track": "{track}",
        "difficulty": "BEGINNER|INTERMEDIATE|ADVANCED",
        "reason": "Explanation grounded in their {percentage}% score and specific performance"
    }}
}}
""",
    )

    json_parser = JsonOutputParser()

    try:
        from app.llm.factory import get_llm
    except ImportError:
        from langchain_openai import ChatOpenAI
        def get_llm():
            return ChatOpenAI(model="gpt-4o-mini", temperature=0.7)

    llm = get_llm()
    chain = prompt_template | llm | json_parser

    @traceable(
        name="feedback-generation-v1",
        tags=["feedback-generation", track, difficulty, f"score-{int(percentage)}"],
        metadata={
            "project": "cloud-flight-simulator",
            "service": "feedback",
            "track": track,
            "difficulty": difficulty,
            "score": percentage,
            "evaluation_id": evaluation_result.get("evaluation_id"),
            "session_id": evaluation_result.get("session_id"),
        }
    )
    def invoke_chain_with_tracing():
        try:
            feedback_dict = chain.invoke(
                {
                    "title": title,
                    "track": track,
                    "difficulty": difficulty,
                    "percentage": percentage,
                    "num_attempts": num_attempts,
                    "avg_prior_score": avg_prior_score,
                    "strengths_list": json.dumps(strengths_list),
                    "mistakes_list": json.dumps(mistakes_list),
                    "resource_prefix": resource_prefix,
                }
            )

            return FeedbackOutput(**feedback_dict)

        except Exception as e:
            raise ValueError(f"Failed to generate feedback: {str(e)}") from e

    return invoke_chain_with_tracing()
