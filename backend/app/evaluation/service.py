"""Evaluation service — validates repairs against mission success criteria."""

import os
from datetime import datetime, timezone
from uuid import uuid4

try:
    from google.cloud import compute_v1
    from google.oauth2 import service_account
except ImportError:
    compute_v1 = None
    service_account = None

from sqlalchemy.orm import Session

from app.config import GCP_PROJECT_ID, GCP_KEY_PATH
from app.models.challenge_sessions import ChallengeSession
from app.models.environments import Environment
from app.scenarios.models import Mission
from app.evaluation.models import Evaluation


class EvaluationService:
    """Service for evaluating mission success criteria against live GCP state.

    Core responsibility: Compare expected_state from mission success criteria
    against actual live GCP resource state. Never compare against fault_configuration.

    Constraint: Always evaluate against live GCP state, never cached results.
    """

    @staticmethod
    def evaluate(session_id: str, db: Session) -> Evaluation:
        """Evaluate whether learner has successfully repaired infrastructure.

        Flow:
        1. Load mission, session, environment from database
        2. Fetch live VM state from GCP API
        3. For each criterion, validate: metadata, status, tags
        4. Calculate weighted score
        5. Persist evaluation result
        6. Return evaluation

        Args:
            session_id: UUID of challenge session
            db: Database session

        Returns:
            Evaluation object with results

        Raises:
            Exception if GCP access fails, resources not found, or validation fails
        """
        # Step 1: Load mission, session, environment
        session = db.query(ChallengeSession).filter(
            ChallengeSession.session_id == session_id
        ).first()

        if not session:
            raise ValueError(f"Session not found: {session_id}")

        mission = db.query(Mission).filter(
            Mission.mission_id == session.mission_id
        ).first()

        if not mission:
            raise ValueError(f"Mission not found for session {session_id}")

        environment = db.query(Environment).filter(
            Environment.session_id == session_id
        ).first()

        if not environment:
            raise ValueError(f"Environment not found for session {session_id}")

        # Step 2: Fetch live VM state from GCP
        if not GCP_KEY_PATH or not os.path.exists(GCP_KEY_PATH):
            raise FileNotFoundError(
                f"GCP_KEY_PATH environment variable must be set to a valid service account key file. "
                f"Current value: {GCP_KEY_PATH}"
            )

        credentials = service_account.Credentials.from_service_account_file(GCP_KEY_PATH)
        instance_client = compute_v1.InstancesClient(credentials=credentials)

        live_instance = instance_client.get(
            project=GCP_PROJECT_ID,
            zone=environment.zone,
            instance=environment.vm_name
        )

        # Extract live state once for resource_snapshot
        live_metadata = {}
        if live_instance.metadata and live_instance.metadata.items:
            live_metadata = {item.key: item.value for item in live_instance.metadata.items}

        live_tags = []
        if live_instance.tags and live_instance.tags.items:
            live_tags = list(live_instance.tags.items)

        resource_snapshot = {
            "vm_name": environment.vm_name,
            "zone": environment.zone,
            "gcp_project_id": GCP_PROJECT_ID,
            "status": live_instance.status,
            "metadata": live_metadata,
            "tags": live_tags,
        }

        # Step 3: Validate each criterion against live state
        criteria_results = []
        total_earned = 0
        max_score = 0

        for criterion in mission.success_criteria:
            if not isinstance(criterion, dict):
                continue

            criterion_id = criterion.get("criterion_id")
            weight = criterion.get("weight", 0)
            expected_state = criterion.get("expected_state", {})

            max_score += weight

            # Validate this criterion
            passed = True
            details = []

            # Check 1: Metadata validation
            expected_metadata = expected_state.get("metadata")
            if expected_metadata is not None:
                if expected_metadata != live_metadata:
                    passed = False
                    details.append(
                        f"Metadata mismatch. Expected: {expected_metadata}, "
                        f"Got: {live_metadata}"
                    )

            # Check 2: VM status validation
            expected_status = expected_state.get("status")
            if expected_status is not None:
                if expected_status != live_instance.status:
                    passed = False
                    details.append(
                        f"Status mismatch. Expected: {expected_status}, "
                        f"Got: {live_instance.status}"
                    )

            # Check 3: Network tags validation
            expected_tags = expected_state.get("network_tags")
            if expected_tags is not None:
                expected_tags_set = set(expected_tags) if isinstance(expected_tags, list) else set()
                live_tags_set = set(live_tags)
                if expected_tags_set != live_tags_set:
                    passed = False
                    details.append(
                        f"Tags mismatch. Expected: {expected_tags_set}, "
                        f"Got: {live_tags_set}"
                    )

            # Record result for this criterion
            if passed:
                total_earned += weight

            details_str = " ".join(details) if details else "Criterion passed"

            criteria_results.append({
                "criterion_id": criterion_id,
                "passed": passed,
                "details": details_str,
                "weight": weight
            })

        # Step 4: Calculate weighted score
        if max_score > 0:
            score_percent = int((total_earned / max_score) * 100)
        else:
            score_percent = 0

        # Step 5: Determine status based on score
        if score_percent >= 80:
            status = "PASSED"
        elif score_percent >= 50:
            status = "PARTIAL"
        else:
            status = "FAILED"

        # Step 6: Persist evaluation result
        evaluation = Evaluation(
            evaluation_id=uuid4(),
            session_id=session_id,
            percentage=score_percent,
            criteria_results={
                "criteria": criteria_results
            },
            resource_snapshot=resource_snapshot,
            evaluated_at=datetime.now(timezone.utc)
        )

        db.add(evaluation)
        db.commit()
        db.refresh(evaluation)

        print(
            f"[EVALUATION] Session {session_id}: "
            f"Score {score_percent}% ({total_earned}/{max_score} weight), "
            f"Status: {status}"
        )

        return evaluation
