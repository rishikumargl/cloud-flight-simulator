"""Progress service — calculate learner stats, streaks, achievements from evaluation records."""

from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from app.evaluation.models import Evaluation
from app.models.challenge_sessions import ChallengeSession
from app.scenarios.models import Mission


class ProgressService:
    """Calculate progress metrics from evaluation records."""

    @staticmethod
    def get_user_stats(user_id: str, db: Session):
        """Get enriched user stats: level, streak, achievements, skill matrix."""
        try:
            evaluations = (
                db.query(Evaluation)
                .join(ChallengeSession, Evaluation.session_id == ChallengeSession.session_id)
                .filter(ChallengeSession.user_id == user_id)
                .order_by(desc(Evaluation.evaluated_at))
                .all()
            )
        except Exception as e:
            print(f"[WARN] Failed to query evaluations for user {user_id}: {str(e)}")
            evaluations = []

        if not evaluations:
            return {
                "overall_proficiency": 0,
                "current_level": "Apprentice",
                "level_progress_pct": 0,
                "next_level": "Associate",
                "stats": {
                    "total_missions": 0,
                    "completed_missions": 0,
                    "completion_rate": 0,
                    "average_score": 0,
                    "total_attempts": 0,
                    "current_streak": 0,
                },
                "learning_streak": {
                    "current": 0,
                    "longest": 0,
                    "missions_this_week": 0,
                },
                "achievements": [],
                "skill_matrix": {},
                "recent_missions": [],
            }

        # Calculate status from percentage score
        def get_status(percentage):
            if percentage >= 80:
                return "PASSED"
            elif percentage >= 50:
                return "PARTIAL"
            else:
                return "FAILED"

        # Calculate stats
        completed = [
            e for e in evaluations if get_status(e.percentage) == "PASSED"
        ]
        total_score = sum(e.percentage for e in evaluations)
        avg_score = int(total_score / len(evaluations)) if evaluations else 0

        # Calculate streak
        current_streak = 0
        longest_streak = 0
        streak_counter = 0
        for e in evaluations:  # sorted by recent first
            if get_status(e.percentage) == "PASSED":
                streak_counter += 1
                longest_streak = max(longest_streak, streak_counter)
            else:
                streak_counter = 0
        current_streak = streak_counter

        # Calculate missions this week
        week_ago = datetime.utcnow() - timedelta(days=7)
        missions_this_week = sum(
            1 for e in evaluations
            if e.evaluated_at and e.evaluated_at >= week_ago and get_status(e.percentage) == "PASSED"
        )

        # Calculate level based on average score and mission count
        level = ProgressService._calculate_user_level(avg_score, len(completed))
        level_progress = ProgressService._calculate_level_progress(
            avg_score, len(completed)
        )

        # Build achievement list
        achievements = ProgressService._derive_achievements(evaluations)

        # Build skill matrix from evaluations
        skill_matrix = ProgressService._build_skill_matrix(evaluations)

        return {
            "overall_proficiency": avg_score,
            "current_level": level,
            "level_progress_pct": level_progress,
            "next_level": ProgressService._get_next_level(level),
            "stats": {
                "total_missions": len(evaluations),
                "completed_missions": len(completed),
                "completion_rate": int(
                    (len(completed) / len(evaluations) * 100) if evaluations else 0
                ),
                "average_score": avg_score,
                "total_attempts": len(evaluations),
                "current_streak": current_streak,
            },
            "learning_streak": {
                "current": current_streak,
                "longest": longest_streak,
                "missions_this_week": missions_this_week,
            },
            "achievements": achievements,
            "skill_matrix": skill_matrix,
            "recent_missions": ProgressService._build_recent_missions(
                evaluations[:10], db
            ),
        }

    @staticmethod
    def get_user_history(user_id: str, db: Session):
        """Get full mission history with evaluation details."""
        evaluations = (
            db.query(Evaluation)
            .join(ChallengeSession, Evaluation.session_id == ChallengeSession.session_id)
            .filter(ChallengeSession.user_id == user_id)
            .order_by(desc(Evaluation.evaluated_at))
            .all()
        )

        return {
            "missions": ProgressService._build_recent_missions(evaluations, db),
            "total": len(evaluations),
        }

    @staticmethod
    def _calculate_user_level(avg_score: int, missions_completed: int) -> str:
        """Determine level: Apprentice, Associate, Engineer, Specialist."""
        if avg_score >= 90 and missions_completed >= 12:
            return "Specialist"
        elif avg_score >= 75 and missions_completed >= 7:
            return "Engineer"
        elif avg_score >= 50 and missions_completed >= 3:
            return "Associate"
        else:
            return "Apprentice"

    @staticmethod
    def _get_next_level(current: str) -> str:
        """Get next level after current."""
        levels = ["Apprentice", "Associate", "Engineer", "Specialist"]
        idx = levels.index(current) if current in levels else 0
        return levels[min(idx + 1, len(levels) - 1)]

    @staticmethod
    def _calculate_level_progress(avg_score: int, missions_completed: int) -> int:
        """Calculate progress toward next level (0-100%)."""
        if avg_score < 50:
            # Progress toward Associate (need 50% score)
            return int((avg_score / 50) * 100)
        elif avg_score < 75:
            # Progress toward Engineer (need 75% score, 7 missions)
            score_pct = ((avg_score - 50) / (75 - 50)) * 50
            mission_pct = min(missions_completed / 7, 1) * 50
            return int(score_pct + mission_pct)
        elif avg_score < 90:
            # Progress toward Specialist (need 90% score, 12 missions)
            score_pct = ((avg_score - 75) / (90 - 75)) * 50
            mission_pct = min(missions_completed / 12, 1) * 50
            return int(score_pct + mission_pct)
        else:
            # At max level
            return 100

    @staticmethod
    def _derive_achievements(evaluations):
        """Derive achievement badges from evaluation history."""
        achievements = []

        if len(evaluations) >= 1:
            achievements.append(
                {"id": "first_mission", "name": "First Mission", "earned_at": None}
            )

        if len(evaluations) >= 5:
            achievements.append(
                {"id": "five_missions", "name": "Five Missions", "earned_at": None}
            )

        passed = [e for e in evaluations if e.status == "PASSED"]
        if len(passed) >= 5:
            achievements.append(
                {"id": "five_passed", "name": "Five Victories", "earned_at": None}
            )

        if any(e.percentage == 100 for e in evaluations):
            achievements.append(
                {"id": "perfect_score", "name": "Perfect Infrastructure", "earned_at": None}
            )

        if any(
            e.explanation_score and e.explanation_score >= 90
            for e in evaluations
        ):
            achievements.append(
                {"id": "excellent_explanation", "name": "Clear Communicator", "earned_at": None}
            )

        # Check for consecutive passes (last 5)
        if len(passed) >= 5:
            recent_5_passed = all(
                e.status == "PASSED" for e in evaluations[:5]
            )
            if recent_5_passed:
                achievements.append(
                    {
                        "id": "hot_streak",
                        "name": "🔥 Hot Streak",
                        "earned_at": None,
                    }
                )

        return achievements

    @staticmethod
    def _build_skill_matrix(evaluations):
        """Build skill proficiency matrix from evaluations."""
        skill_scores = {}
        skill_counts = {}

        for e in evaluations:
            if e.technical_skill_breakdown_json:
                skills = e.technical_skill_breakdown_json
                if isinstance(skills, dict):
                    for skill, score in skills.items():
                        if skill not in skill_scores:
                            skill_scores[skill] = []
                            skill_counts[skill] = 0
                        skill_scores[skill].append(score)
                        skill_counts[skill] += 1

        # Calculate average proficiency per skill
        skill_matrix = {}
        for skill, scores in skill_scores.items():
            avg = int(sum(scores) / len(scores)) if scores else 0
            skill_matrix[skill] = {
                "proficiency": avg,
                "confidence": 0.85,
                "missions_attempted": skill_counts.get(skill, 0),
                "success_rate": avg / 100 if avg > 0 else 0,
            }

        # Ensure common skills exist with defaults
        default_skills = [
            "compute",
            "networking",
            "iam",
            "storage",
            "monitoring",
            "security",
        ]
        for skill in default_skills:
            if skill not in skill_matrix:
                skill_matrix[skill] = {
                    "proficiency": 0,
                    "confidence": 0,
                    "missions_attempted": 0,
                    "success_rate": 0,
                }

        return skill_matrix

    @staticmethod
    def _build_recent_missions(evaluations, db):
        """Build recent mission list with metadata."""
        def get_status(percentage):
            if percentage >= 80:
                return "PASSED"
            elif percentage >= 50:
                return "PARTIAL"
            else:
                return "FAILED"

        missions = []
        for e in evaluations:
            session = (
                db.query(ChallengeSession)
                .filter(ChallengeSession.session_id == e.session_id)
                .first()
            )
            mission = None
            if session:
                mission = (
                    db.query(Mission).filter(Mission.mission_id == session.mission_id).first()
                )

            missions.append(
                {
                    "mission_id": str(session.mission_id) if session else "",
                    "evaluation_id": str(e.evaluation_id) if e.evaluation_id else "",
                    "title": mission.title if mission else "Unknown Mission",
                    "track": mission.track if mission else "Unknown",
                    "difficulty": mission.difficulty if mission else "BEGINNER",
                    "score": int(e.percentage),
                    "explanation_score": e.explanation_score or 0,
                    "status": get_status(e.percentage),
                    "summary": e.overall_feedback_summary or "",
                    "completed_at": e.evaluated_at.isoformat()
                    if e.evaluated_at
                    else datetime.utcnow().isoformat(),
                }
            )

        return missions
