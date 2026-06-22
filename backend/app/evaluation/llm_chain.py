"""Evaluation LLM chain with LangSmith tracing - assesses learner understanding."""
import json
import logging
from typing import List, Dict, Any
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from langsmith import traceable
import os

logger = logging.getLogger(__name__)


@traceable(name="evaluation-understanding-assessment")
def evaluate_understanding(
    mission_title: str,
    mission_objectives: List[str],
    success_criteria: List[Dict[str, Any]],
    learner_submission: str,
    resource_snapshot: Dict[str, Any],
) -> List[Dict[str, Any]]:
    """
    LLM-based understanding assessment.

    Returns:
        List of dicts with keys: criterion_id, understanding_score (0-100), reasoning
    """
    # Initialize LLM client
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY environment variable not set")

    llm = ChatOpenAI(
        model="gpt-4",
        temperature=0.3,
        api_key=api_key,
    )

    # Build criteria descriptions for context
    criteria_text = "\n".join(
        [f"- {c['description']}" for c in success_criteria]
    )

    # System prompt with explicit grounding instructions
    system_prompt = SystemMessage(content="""You are an expert evaluator assessing a learner's understanding of Google Cloud Platform challenges.

Your task:
1. Evaluate the learner's submission against each success criterion.
2. Assign an understanding_score (0-100) based on clarity, correctness, and depth.
3. Provide reasoning that references ONLY:
   - The actual GCP resources shown in the resource_snapshot
   - The learner's submission text
   - No invented facts or assumptions

CRITICAL CONSTRAINTS:
- You MUST ONLY use facts from the resource_snapshot and submission.
- You MUST NOT invent, assume, or hallucinate any resources or configurations.
- Every statement in reasoning must be supported by evidence.
- If a resource is not in the snapshot, it does NOT exist.
- scoring is INDEPENDENT of resource_met — you assess understanding, not correctness.

Return JSON with this structure for EACH criterion:
{
  "criterion_id": "uuid",
  "understanding_score": <0-100 int>,
  "reasoning": "<evidence-based explanation>"
}""")

    # User prompt with all context
    user_content = f"""Mission: {mission_title}
Objectives: {', '.join(mission_objectives)}

Success Criteria:
{criteria_text}

Learner's Submission:
{learner_submission}

Actual GCP Resource State (from inspection):
{json.dumps(resource_snapshot, indent=2)}

Evaluate the learner's understanding of what they accomplished. Base your assessment ONLY on the submission text and the actual resources shown above."""

    user_message = HumanMessage(content=user_content)

    # Invoke LLM
    try:
        response = llm.invoke([system_prompt, user_message])
        response_text = response.content

        # Parse JSON response
        # Extract JSON from response (may be wrapped in markdown code blocks)
        if "```json" in response_text:
            json_start = response_text.find("```json") + 7
            json_end = response_text.find("```", json_start)
            response_text = response_text[json_start:json_end].strip()
        elif "```" in response_text:
            json_start = response_text.find("```") + 3
            json_end = response_text.find("```", json_start)
            response_text = response_text[json_start:json_end].strip()

        # Try to parse as array or single object
        try:
            result = json.loads(response_text)
            if isinstance(result, list):
                scores = result
            elif isinstance(result, dict) and "scores" in result:
                scores = result["scores"]
            else:
                # Single object, wrap in list
                scores = [result]
        except json.JSONDecodeError:
            logger.error(f"Failed to parse LLM response: {response_text}")
            # Fallback: return neutral scores
            scores = [
                {
                    "criterion_id": c["criterion_id"],
                    "understanding_score": 50,
                    "reasoning": "Unable to evaluate response - defaulting to neutral score.",
                }
                for c in success_criteria
            ]

        # Ensure all criteria have scores
        criterion_ids = {c["criterion_id"] for c in success_criteria}
        scored_ids = {s.get("criterion_id") for s in scores}
        missing_ids = criterion_ids - scored_ids

        for missing_id in missing_ids:
            scores.append(
                {
                    "criterion_id": missing_id,
                    "understanding_score": 50,
                    "reasoning": "Score not provided by LLM - using default.",
                }
            )

        return scores

    except Exception as e:
        logger.error(f"LLM evaluation failed: {e}")
        # Fallback: return neutral scores for all criteria
        return [
            {
                "criterion_id": c["criterion_id"],
                "understanding_score": 50,
                "reasoning": f"Evaluation error: {str(e)}",
            }
            for c in success_criteria
        ]
