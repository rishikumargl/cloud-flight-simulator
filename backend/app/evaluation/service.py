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
    def evaluate(session_id: str, db: Session, solution_description: str = None) -> Evaluation:
        """Evaluate whether learner has successfully repaired infrastructure.

        Flow:
        1. Load mission, session, environment from database
        2. Fetch live VM state from GCP API
        3. For each criterion, validate: metadata, status, tags
        4. Calculate weighted score (80% deterministic, 20% explanation quality)
        5. Generate AI coaching feedback based on solution explanation
        6. Generate skill assessment and recommendation
        7. Persist evaluation result
        8. Return evaluation

        Args:
            session_id: UUID of challenge session
            db: Database session
            solution_description: Learner's explanation of their solution

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
                # Verify all expected keys are present with correct values
                # Extra keys in live_metadata are allowed
                metadata_mismatch = any(
                    live_metadata.get(key) != value
                    for key, value in expected_metadata.items()
                )
                if metadata_mismatch:
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

        # Step 6: Evaluate explanation quality (20% of final score)
        explanation_score = EvaluationService._evaluate_explanation(solution_description, mission, criteria_results)
        adjusted_percentage = int((score_percent * 0.8) + (explanation_score * 0.2))

        # Step 7: Generate coaching feedback
        coach_feedback = EvaluationService._generate_coaching_feedback(
            solution_description, explanation_score, criteria_results, mission
        )

        # Step 8: Generate skill breakdown
        skill_breakdown = EvaluationService._generate_skill_breakdown(mission, criteria_results, explanation_score)

        # Step 9: Generate recommendation
        recommendation = EvaluationService._generate_recommendation(mission, adjusted_percentage, skill_breakdown)

        # Step 10: Generate overall summary
        overall_summary = EvaluationService._generate_summary(mission, adjusted_percentage, status)

        # Step 11: Persist evaluation result with coaching data
        evaluation = Evaluation(
            evaluation_id=uuid4(),
            session_id=session_id,
            percentage=adjusted_percentage,
            criteria_results={
                "criteria": criteria_results
            },
            resource_snapshot=resource_snapshot,
            evaluated_at=datetime.now(timezone.utc),
            solution_description=solution_description,
            explanation_score=explanation_score,
            coach_feedback_json=coach_feedback,
            analytics_json=EvaluationService.get_mission_analytics(session_id, db),
            technical_skill_breakdown_json=skill_breakdown,
            recommendation_json=recommendation,
            overall_feedback_summary=overall_summary
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

    @staticmethod
    def get_mission_analytics(session_id: str, db: Session) -> dict:
        """Calculate analytics for a mission attempt.

        Returns: completion_time, expected_time, efficiency, retry_count, etc.
        """
        from sqlalchemy import text

        try:
            query = text("""
                SELECT
                    cs.session_id,
                    cs.mission_id,
                    m.title,
                    m.difficulty,
                    m.time_limit_minutes,
                    e.percentage,
                    EXTRACT(EPOCH FROM (cs.completed_at - cs.started_at))/60 as duration_minutes,
                    EXTRACT(EPOCH FROM (cs.started_at - cs.created_at))/60 as provisioning_minutes
                FROM challenge_sessions cs
                LEFT JOIN evaluations e ON cs.session_id = e.session_id
                LEFT JOIN missions m ON cs.mission_id = m.mission_id
                WHERE cs.session_id = :session_id
            """)

            result = db.execute(query, {"session_id": session_id}).fetchone()

            if not result:
                return {}

            duration = float(result[6]) if result[6] else 45
            provisioning = float(result[7]) if result[7] else 5
            expected = {
                "BEGINNER": 30,
                "INTERMEDIATE": 45,
                "ADVANCED": 60
            }.get(result[3], 45)

            efficiency = duration / expected if expected > 0 else 1.0

            return {
                "session_id": str(result[0]),
                "mission_id": str(result[1]),
                "mission_title": result[2],
                "difficulty": result[3],
                "score": int(result[5]) if result[5] else 0,
                "completion_time_minutes": int(duration),
                "expected_time_minutes": expected,
                "time_efficiency": round(efficiency, 2),
                "provisioning_minutes": int(provisioning),
                "verification_minutes": int(duration - provisioning) if duration > provisioning else 0,
            }

        except Exception as e:
            print(f"[WARN] Failed to calculate mission analytics: {e}")
            return {}

    @staticmethod
    def derive_skill_matrix(user_id: str, db: Session) -> dict:
        """Derive skill proficiency matrix from mission history.

        Analyzes completed missions to estimate proficiency in:
        - COMPUTE (VMs, instances)
        - IAM (permissions, roles)
        - NETWORKING (firewall, VPCs)
        - STORAGE (buckets, data)
        - MONITORING (logging, observability)
        - SECURITY (encryption, compliance)
        - DEVOPS (CI/CD, automation)

        Returns: {skill_category: {proficiency, confidence, missions_attempted, success_rate}}
        """
        from sqlalchemy import text

        try:
            query = text("""
                SELECT
                    COUNT(DISTINCT cs.session_id) as total_attempts,
                    COUNT(DISTINCT CASE WHEN e.percentage >= 80 THEN cs.session_id END) as passed,
                    AVG(e.percentage)::FLOAT as avg_score
                FROM challenge_sessions cs
                LEFT JOIN evaluations e ON cs.session_id = e.session_id
                LEFT JOIN missions m ON cs.mission_id = m.mission_id
                WHERE cs.user_id = :user_id AND cs.completed_at IS NOT NULL
            """)

            result = db.execute(query, {"user_id": user_id}).fetchone()

            if not result or result[0] == 0:
                # No history - return default profile
                return {
                    category: {
                        "category": category,
                        "proficiency": 30,
                        "confidence": 20,
                        "missions_attempted": 0,
                        "success_rate": 0.0
                    }
                    for category in ["COMPUTE", "IAM", "NETWORKING", "STORAGE", "MONITORING", "SECURITY", "DEVOPS"]
                }

            total = result[0]
            passed = result[1] if result[1] else 0
            avg_score = float(result[2]) if result[2] else 30

            success_rate = (passed / total * 100) if total > 0 else 0
            confidence = min(100, 20 + (total * 5))

            # For now, all skills get same score (future: analyze specific topics)
            base_proficiency = int(avg_score)

            return {
                category: {
                    "category": category,
                    "proficiency": base_proficiency,
                    "confidence": confidence,
                    "missions_attempted": total,
                    "success_rate": success_rate
                }
                for category in ["COMPUTE", "IAM", "NETWORKING", "STORAGE", "MONITORING", "SECURITY", "DEVOPS"]
            }

        except Exception as e:
            print(f"[WARN] Failed to derive skill matrix: {e}")
            # Return safe defaults
            return {
                category: {
                    "category": category,
                    "proficiency": 0,
                    "confidence": 0,
                    "missions_attempted": 0,
                    "success_rate": 0.0
                }
                for category in ["COMPUTE", "IAM", "NETWORKING", "STORAGE", "MONITORING", "SECURITY", "DEVOPS"]
            }

    @staticmethod
    def get_mission_insights(mission_id: str, current_user_session_id: str, db: Session) -> dict:
        """Get insights about a mission's performance across learners.

        Shows: average score, average time, learner's percentile, etc.
        """
        from sqlalchemy import text

        try:
            # Get aggregate stats for mission
            agg_query = text("""
                SELECT
                    COUNT(DISTINCT cs.session_id) as total_attempts,
                    AVG(e.percentage)::FLOAT as avg_score,
                    AVG(EXTRACT(EPOCH FROM (cs.completed_at - cs.started_at))/60)::FLOAT as avg_time
                FROM challenge_sessions cs
                LEFT JOIN evaluations e ON cs.session_id = e.session_id
                LEFT JOIN missions m ON cs.mission_id = m.mission_id
                WHERE m.mission_id = :mission_id AND cs.completed_at IS NOT NULL
            """)

            agg_result = db.execute(agg_query, {"mission_id": mission_id}).fetchone()

            # Get current user's stats
            user_query = text("""
                SELECT
                    e.percentage,
                    EXTRACT(EPOCH FROM (cs.completed_at - cs.started_at))/60 as duration
                FROM challenge_sessions cs
                LEFT JOIN evaluations e ON cs.session_id = e.session_id
                WHERE cs.session_id = :session_id
            """)

            user_result = db.execute(user_query, {"session_id": current_user_session_id}).fetchone()

            # Get mission info
            mission = db.query(Mission).filter(Mission.mission_id == mission_id).first()

            total_attempts = int(agg_result[0]) if agg_result[0] else 0
            avg_score = float(agg_result[1]) if agg_result[1] else 0
            avg_time = float(agg_result[2]) if agg_result[2] else 45

            user_score = int(user_result[0]) if user_result and user_result[0] else None
            user_time = float(user_result[1]) if user_result and user_result[1] else None

            # Calculate percentile (simplified: score-based)
            percentile = None
            if user_score is not None and avg_score > 0:
                percentile = min(100, int((user_score / max(avg_score, 1)) * 100))

            # Determine improvement potential
            improvement = None
            if user_time and avg_time > 0:
                if user_time < (avg_time * 0.7):
                    improvement = "FAST_SOLVER"
                elif user_time > (avg_time * 1.5):
                    improvement = "SLOW_START"
                else:
                    improvement = "AVERAGE"

            return {
                "mission_id": str(mission_id),
                "mission_title": mission.title if mission else "Unknown",
                "total_attempts": total_attempts,
                "average_score": round(avg_score, 1),
                "average_completion_time": round(avg_time, 1),
                "current_learner_time": round(user_time, 1) if user_time else None,
                "current_learner_score": user_score,
                "time_percentile": percentile,
                "improvement_potential": improvement
            }

        except Exception as e:
            print(f"[WARN] Failed to get mission insights: {e}")
            return {}

    @staticmethod
    def _evaluate_explanation(solution_description: str, mission: "Mission", criteria_results: list) -> int:
        """Evaluate quality of learner's solution explanation (0-100).

        Scores based on:
        - Presence of explanation (empty = 0)
        - Mentions investigation/diagnosis
        - Mentions root cause
        - Explains why fix worked
        - Shows technical understanding
        """
        if not solution_description or not solution_description.strip():
            return 0

        text_lower = solution_description.lower()
        score = 50  # Base score for providing an explanation

        # Check for investigation keywords
        investigation_keywords = ["checked", "looked", "investigated", "found", "discovered", "noticed", "identified"]
        if any(kw in text_lower for kw in investigation_keywords):
            score += 10

        # Check for root cause mention
        cause_keywords = ["cause", "reason", "because", "resulted in", "was due to", "led to"]
        if any(kw in text_lower for kw in cause_keywords):
            score += 15

        # Check for solution explanation
        solution_keywords = ["fixed", "corrected", "repaired", "changed", "updated", "restarted", "redeployed"]
        if any(kw in text_lower for kw in solution_keywords):
            score += 15

        # Check for technical depth
        technical_keywords = ["permissions", "script", "metadata", "tags", "status", "health", "logs", "startup"]
        technical_count = sum(1 for kw in technical_keywords if kw in text_lower)
        score += min(technical_count * 3, 10)

        # Check if explanation shows understanding vs just listing commands
        if len(solution_description.split()) > 20:  # More than 20 words indicates depth
            score += 5

        return min(score, 100)

    @staticmethod
    def _generate_coaching_feedback(solution_description: str, explanation_score: int, criteria_results: list, mission: "Mission") -> dict:
        """Generate AI coaching feedback based on solution and evaluation."""
        strengths = []
        improvements = []

        if explanation_score >= 80:
            strengths.append("Clear explanation of investigation steps")
            strengths.append("Strong technical understanding demonstrated")
        elif explanation_score >= 60:
            strengths.append("Good attempt at explaining the solution")
            improvements.append("Next time, explain your reasoning more thoroughly")
        else:
            improvements.append("Include more detail about how you diagnosed the issue")
            improvements.append("Explain why your fix actually resolved the problem")

        # Check what criteria passed
        passed_criteria = [c for c in criteria_results if c.get("passed")]
        if len(passed_criteria) > len(criteria_results) / 2:
            strengths.append("Systematic approach to validation")
        else:
            improvements.append("Double-check all success criteria before concluding")

        return {
            "strengths": strengths if strengths else ["You completed the mission"],
            "improvements": improvements if improvements else ["You did well - keep practicing"],
            "next_focus": "Practice explaining your debugging process" if explanation_score < 70 else "Great work!"
        }

    @staticmethod
    def _generate_skill_breakdown(mission: "Mission", criteria_results: list, explanation_score: int) -> dict:
        """Generate skill assessment breakdown from mission type."""
        # Map mission track to skills
        track_skills = {
            "COMPUTE": {"compute": 40, "debugging": 30, "operations": 30},
            "STORAGE": {"storage": 50, "operations": 50},
            "NETWORKING": {"networking": 50, "security": 25, "operations": 25},
            "SECURITY": {"security": 60, "iam": 40},
            "DEVOPS": {"devops": 50, "operations": 50},
            "ARCHITECTURE": {"architecture": 100}
        }

        mission_track = getattr(mission, 'track', 'COMPUTE').upper()
        skills = track_skills.get(mission_track, {"compute": 100})

        # Adjust scores based on performance
        passed = sum(1 for c in criteria_results if c.get("passed"))
        total = len(criteria_results) if criteria_results else 1
        success_rate = (passed / total * 100) if total > 0 else 0

        breakdown = {}
        for skill, weight in skills.items():
            skill_score = int(success_rate * 0.7 + explanation_score * 0.3)
            breakdown[skill] = {
                "proficiency": min(skill_score, 100),
                "weight": weight
            }

        return breakdown

    @staticmethod
    def _generate_recommendation(mission: "Mission", score: int, skill_breakdown: dict) -> dict:
        """Generate next mission recommendation."""
        current_track = getattr(mission, 'track', 'COMPUTE')
        current_difficulty = getattr(mission, 'difficulty', 'BEGINNER')

        # Recommend next difficulty based on score
        difficulty_map = {
            "BEGINNER": "INTERMEDIATE" if score >= 75 else "BEGINNER",
            "INTERMEDIATE": "ADVANCED" if score >= 80 else "INTERMEDIATE",
            "ADVANCED": "ADVANCED"
        }
        next_difficulty = difficulty_map.get(current_difficulty, current_difficulty)

        # Find weakest skill for next track
        weakest_skill = min(skill_breakdown.items(), key=lambda x: x[1]["proficiency"])

        skill_track_map = {
            "networking": "NETWORKING",
            "security": "SECURITY",
            "iam": "SECURITY",
            "devops": "DEVOPS",
            "storage": "STORAGE",
            "architecture": "ARCHITECTURE"
        }
        next_track = skill_track_map.get(weakest_skill[0], current_track)

        return {
            "track": next_track,
            "difficulty": next_difficulty,
            "reason": f"You showed strong {list(skill_breakdown.keys())[0]} skills. "
                     f"Next, let's strengthen {weakest_skill[0]}."
        }

    @staticmethod
    def _generate_summary(mission: "Mission", score: int, status: str) -> str:
        """Generate overall mission summary."""
        mission_title = getattr(mission, 'title', 'Mission')

        if status == "PASSED":
            if score >= 90:
                return f"Excellent work on {mission_title}! You demonstrated strong technical understanding and execution."
            else:
                return f"Good job completing {mission_title}. You successfully met all the objectives."
        elif status == "PARTIAL":
            return f"You made progress on {mission_title}, but some objectives remain. Review the failed criteria and try again."
        else:
            return f"You attempted {mission_title}, but the mission wasn't completed. Review the success criteria and try again."
