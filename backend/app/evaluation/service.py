"""Evaluation Service - orchestrates the full evaluation pipeline."""
import logging
from uuid import uuid4
from datetime import datetime
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.evaluation.schemas import (
    EvaluationResultSchema,
    CriterionResult,
)
from backend.app.evaluation.resource_inspector import ResourceInspectorFactory
from backend.app.evaluation.validator import DeterministicValidator
from backend.app.evaluation.llm_chain import evaluate_understanding
from backend.app.evaluation.scoring import ScoringGate

logger = logging.getLogger(__name__)


class EvaluationService:
    """Main evaluation orchestrator."""

    def __init__(self, db: Session):
        self.db = db
        self.validator = DeterministicValidator()
        self.compute_inspector = ResourceInspectorFactory.get_compute_inspector()
        self.storage_inspector = ResourceInspectorFactory.get_storage_inspector()

    def fetch_resource_snapshot(
        self,
        gcp_project_id: str,
        resource_prefix: str,
        track: str,
        success_criteria: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Fetch actual GCP resource state for all criteria.

        Returns resource_snapshot with structure:
        {
            "gcp_project_id": "...",
            "resource_prefix": "...",
            "resources": {
                "compute_instance": {...},
                "persistent_disk": {...},
                ...
            }
        }
        """
        snapshot = {
            "gcp_project_id": gcp_project_id,
            "resource_prefix": resource_prefix,
            "resources": {},
            "fetched_at": datetime.utcnow().isoformat(),
        }

        # Fetch resources by type based on criteria
        resource_types = set()
        for criterion in success_criteria:
            resource_types.add(criterion.get("resource_type"))

        # COMPUTE track resources
        if track == "COMPUTE" or "compute_instance" in resource_types:
            for criterion in success_criteria:
                if criterion.get("resource_type") == "compute_instance":
                    name_suffix = criterion.get("expected_state", {}).get("name_suffix", "")
                    instance_name = f"{resource_prefix}-{name_suffix}"
                    # Assuming default zone is "us-central1-a" — adapt as needed
                    instance_data = self.compute_inspector.get_instance(
                        gcp_project_id, "us-central1-a", instance_name
                    )
                    snapshot["resources"][instance_name] = instance_data or {}

                elif criterion.get("resource_type") == "persistent_disk":
                    name_suffix = criterion.get("expected_state", {}).get("name_suffix", "")
                    disk_name = f"{resource_prefix}-{name_suffix}"
                    disk_data = self.compute_inspector.get_disk(
                        gcp_project_id, "us-central1-a", disk_name
                    )
                    snapshot["resources"][disk_name] = disk_data or {}

                elif criterion.get("resource_type") == "firewall_rule":
                    name_suffix = criterion.get("expected_state", {}).get("name_suffix", "")
                    rule_name = f"{resource_prefix}-{name_suffix}"
                    rule_data = self.compute_inspector.get_firewall_rule(gcp_project_id, rule_name)
                    snapshot["resources"][rule_name] = rule_data or {}

        # STORAGE track resources
        if track == "STORAGE" or "storage_bucket" in resource_types:
            for criterion in success_criteria:
                if criterion.get("resource_type") == "storage_bucket":
                    name_suffix = criterion.get("expected_state", {}).get("name_suffix", "")
                    # GCS bucket names need suffix for global uniqueness
                    bucket_name = f"{resource_prefix}-{name_suffix}"
                    bucket_data = self.storage_inspector.get_bucket(bucket_name)
                    snapshot["resources"][bucket_name] = bucket_data or {}

        return snapshot

    def run_evaluation(
        self,
        session_id: str,
        user_id: str,
        mission_id: str,
        env_id: str,
        submission_id: str,
        submission_text: str,
        gcp_project_id: str,
        resource_prefix: str,
        track: str,
        mission_title: str,
        mission_objectives: List[str],
        success_criteria: List[Dict[str, Any]],
    ) -> EvaluationResultSchema:
        """
        Execute full 10-step evaluation pipeline.

        Steps:
        1. Fetch resource_snapshot from GCP
        2. Run deterministic validation
        3. Invoke evaluation LLM
        4. Apply scoring gate
        5. Calculate percentage
        6. Persist to database
        7. Return EvaluationResultSchema
        """
        evaluation_id = str(uuid4())

        # Step 1: Fetch resource snapshot
        logger.info(f"[P5] Step 1: Fetching resource snapshot for {resource_prefix}")
        resource_snapshot = self.fetch_resource_snapshot(
            gcp_project_id=gcp_project_id,
            resource_prefix=resource_prefix,
            track=track,
            success_criteria=success_criteria,
        )

        # Step 2: Run deterministic validation per criterion
        logger.info(f"[P5] Step 2: Running deterministic validation")
        criteria_with_validation = []
        for criterion in success_criteria:
            resource_type = criterion.get("resource_type")
            expected_state = criterion.get("expected_state", {})
            name_suffix = expected_state.get("name_suffix", "")
            resource_name = f"{resource_prefix}-{name_suffix}"

            # Get the actual resource from snapshot
            actual_resource = resource_snapshot["resources"].get(resource_name, {})

            # Validate
            resource_met = self.validator.validate_criterion(
                resource_type=resource_type,
                resource_snapshot=actual_resource,
                expected_state=expected_state,
            )

            criteria_with_validation.append({
                **criterion,
                "resource_met": resource_met,
            })

        # Step 3: Invoke evaluation LLM
        logger.info(f"[P5] Step 3: Invoking evaluation LLM")
        criteria_descriptions = [c.get("description") for c in success_criteria]
        llm_scores = evaluate_understanding(
            mission_title=mission_title,
            mission_objectives=mission_objectives,
            success_criteria=success_criteria,
            learner_submission=submission_text,
            resource_snapshot=resource_snapshot,
        )

        # Map LLM scores back to criteria
        llm_score_map = {s.get("criterion_id"): s for s in llm_scores}

        # Step 4 & 5: Apply scoring gate and calculate points
        logger.info(f"[P5] Step 4-5: Applying scoring gate and calculating percentage")
        criteria_results = []
        for criterion in criteria_with_validation:
            criterion_id = criterion.get("criterion_id")
            resource_met = criterion.get("resource_met")
            weight = criterion.get("weight", 0)

            # Get LLM score
            llm_data = llm_score_map.get(criterion_id, {})
            understanding_score = llm_data.get("understanding_score", 50)
            reasoning = llm_data.get("reasoning", "No reasoning provided.")

            # Apply scoring gate
            points_awarded = ScoringGate.calculate_points(
                resource_met=resource_met,
                understanding_score=understanding_score,
                weight=weight,
            )

            criteria_results.append({
                "criterion_id": criterion_id,
                "description": criterion.get("description"),
                "resource_met": resource_met,
                "understanding_score": understanding_score,
                "reasoning": reasoning,
                "points_awarded": points_awarded,
            })

        # Calculate percentage
        percentage = ScoringGate.calculate_percentage(criteria_results)

        # Step 6: Persist to database
        logger.info(f"[P5] Step 6: Persisting evaluation to database")
        evaluation_record = self._persist_evaluation(
            evaluation_id=evaluation_id,
            session_id=session_id,
            submission_id=submission_id,
            percentage=percentage,
            criteria_results=criteria_results,
            resource_snapshot=resource_snapshot,
        )

        # Step 7: Return EvaluationResultSchema
        logger.info(f"[P5] Step 7: Returning evaluation result")
        return EvaluationResultSchema(
            evaluation_id=evaluation_id,
            session_id=session_id,
            resource_snapshot=resource_snapshot,
            submission_id=submission_id,
            criteria_results=[
                CriterionResult(
                    criterion_id=c["criterion_id"],
                    description=c["description"],
                    resource_met=c["resource_met"],
                    understanding_score=c["understanding_score"],
                    reasoning=c["reasoning"],
                    points_awarded=c["points_awarded"],
                )
                for c in criteria_results
            ],
            percentage=percentage,
            evaluation_mode="LLM_GROUNDED",
            evaluated_at=datetime.utcnow(),
        )

    def get_latest_evaluation(self, session_id: str) -> Optional[EvaluationResultSchema]:
        """Retrieve the latest evaluation for a session."""
        from backend.app.database import Evaluation

        evaluation_record = (
            self.db.query(Evaluation)
            .filter(Evaluation.session_id == session_id)
            .order_by(desc(Evaluation.evaluated_at))
            .first()
        )

        if not evaluation_record:
            return None

        return EvaluationResultSchema(
            evaluation_id=str(evaluation_record.evaluation_id),
            session_id=str(evaluation_record.session_id),
            resource_snapshot=evaluation_record.resource_snapshot,
            submission_id=str(evaluation_record.submission_id),
            criteria_results=[
                CriterionResult(**c) for c in evaluation_record.criteria_results
            ],
            percentage=float(evaluation_record.percentage),
            evaluation_mode=evaluation_record.evaluation_mode,
            evaluated_at=evaluation_record.evaluated_at,
        )

    def _persist_evaluation(
        self,
        evaluation_id: str,
        session_id: str,
        submission_id: str,
        percentage: float,
        criteria_results: List[Dict[str, Any]],
        resource_snapshot: Dict[str, Any],
    ) -> Any:
        """Persist evaluation to database."""
        from backend.app.database import Evaluation

        evaluation = Evaluation(
            evaluation_id=evaluation_id,
            session_id=session_id,
            submission_id=submission_id,
            percentage=percentage,
            evaluation_mode="LLM_GROUNDED",
            criteria_results=criteria_results,
            resource_snapshot=resource_snapshot,
            evaluated_at=datetime.utcnow(),
        )

        self.db.add(evaluation)
        self.db.commit()
        return evaluation
