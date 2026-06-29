"""LearnerProfileEngine — builds comprehensive learner profiles from mission history.

This is NOT a service. It is a reusable internal component used by:
- ScenarioService (adaptive generation)
- EvaluationService (context-aware coaching)
- FeedbackService (history-aware feedback)
- Progress endpoint (avoid duplicate calculations)

Single responsibility: Build an accurate learner profile from existing data.
"""

from typing import Dict, List, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import text


class LearnerProfile:
    """Comprehensive learner profile derived from mission history."""

    def __init__(
        self,
        user_id: str,
        overall_level: str,
        average_score: float,
        average_completion_minutes: float,
        learning_velocity: str,
        confidence: int,
        strengths: List[str],
        weaknesses: List[str],
        recent_failures: List[Dict],
        recommended_focus: str,
        total_missions: int,
        completion_rate: float,
        improvement_trend: str,
        last_three_scores: List[int],
        skill_breakdown: Dict[str, float],
    ):
        self.user_id = user_id
        self.overall_level = overall_level
        self.average_score = average_score
        self.average_completion_minutes = average_completion_minutes
        self.learning_velocity = learning_velocity
        self.confidence = confidence
        self.strengths = strengths
        self.weaknesses = weaknesses
        self.recent_failures = recent_failures
        self.recommended_focus = recommended_focus
        self.total_missions = total_missions
        self.completion_rate = completion_rate
        self.improvement_trend = improvement_trend
        self.last_three_scores = last_three_scores
        self.skill_breakdown = skill_breakdown

    def to_dict(self) -> dict:
        """Convert to dictionary for API responses."""
        return {
            "user_id": self.user_id,
            "overall_level": self.overall_level,
            "average_score": round(self.average_score, 1),
            "average_completion_minutes": round(self.average_completion_minutes, 1),
            "learning_velocity": self.learning_velocity,
            "confidence": self.confidence,
            "strengths": self.strengths,
            "weaknesses": self.weaknesses,
            "recent_failures": self.recent_failures,
            "recommended_focus": self.recommended_focus,
            "total_missions": self.total_missions,
            "completion_rate": round(self.completion_rate, 1),
            "improvement_trend": self.improvement_trend,
            "last_three_scores": self.last_three_scores,
            "skill_breakdown": {k: round(v, 1) for k, v in self.skill_breakdown.items()},
        }


class LearnerProfileEngine:
    """Builds learner profiles from mission history without creating new storage."""

    @staticmethod
    def build(user_id: str, db: Session) -> LearnerProfile:
        """Build complete learner profile from mission history.

        Uses only existing tables: challenge_sessions, missions, evaluations.
        All values are derived dynamically. No new persistence.

        Args:
            user_id: User UUID
            db: Database session

        Returns:
            LearnerProfile with complete learner context
        """
        try:
            # Get evaluation history
            history = LearnerProfileEngine._get_evaluation_history(user_id, db)

            if not history:
                # New learner
                return LearnerProfileEngine._create_new_learner_profile(user_id)

            # Analyze history
            overall_level = LearnerProfileEngine._determine_level(history)
            learning_velocity = LearnerProfileEngine._determine_velocity(history)
            improvement_trend = LearnerProfileEngine._determine_trend(history)
            strengths, weaknesses = LearnerProfileEngine._identify_strengths_weaknesses(
                history
            )
            recommended_focus = weaknesses[0] if weaknesses else "General Practice"

            # Calculate metrics
            average_score = sum(h["score"] for h in history) / len(history)
            average_completion = sum(h["duration"] for h in history if h["duration"]) / len(
                [h for h in history if h["duration"]]
            )
            completion_rate = (
                sum(1 for h in history if h["score"] >= 50) / len(history) * 100
            )
            last_three_scores = [h["score"] for h in history[:3]]
            recent_failures = [
                {
                    "mission_title": h["mission_title"],
                    "score": h["score"],
                    "failed_criteria": h["failed_criteria"][:2],  # Top 2 failures
                }
                for h in history
                if h["score"] < 50
            ][:3]

            # Skill breakdown
            skill_breakdown = LearnerProfileEngine._calculate_skill_breakdown(history)

            # Confidence (increases with attempts)
            confidence = min(100, 30 + len(history) * 8)

            return LearnerProfile(
                user_id=user_id,
                overall_level=overall_level,
                average_score=average_score,
                average_completion_minutes=average_completion,
                learning_velocity=learning_velocity,
                confidence=confidence,
                strengths=strengths,
                weaknesses=weaknesses,
                recent_failures=recent_failures,
                recommended_focus=recommended_focus,
                total_missions=len(history),
                completion_rate=completion_rate,
                improvement_trend=improvement_trend,
                last_three_scores=last_three_scores,
                skill_breakdown=skill_breakdown,
            )

        except Exception as e:
            print(f"[WARN] Failed to build learner profile: {e}")
            return LearnerProfileEngine._create_new_learner_profile(user_id)

    @staticmethod
    def _get_evaluation_history(user_id: str, db: Session) -> List[Dict]:
        """Get learner's evaluation history ordered by recency."""
        try:
            query = text("""
                SELECT
                    m.mission_id,
                    m.title,
                    m.difficulty,
                    e.percentage as score,
                    EXTRACT(EPOCH FROM (cs.completed_at - cs.started_at))/60 as duration,
                    e.criteria_results,
                    cs.completed_at
                FROM evaluations e
                INNER JOIN challenge_sessions cs ON e.session_id = cs.session_id
                INNER JOIN missions m ON cs.mission_id = m.mission_id
                WHERE cs.user_id = :user_id AND cs.completed_at IS NOT NULL
                ORDER BY cs.completed_at DESC
                LIMIT 20
            """)

            results = db.execute(query, {"user_id": user_id}).fetchall()
            history = []

            for row in results:
                mission_id, title, difficulty, score, duration, criteria_results, completed = row

                # Extract failed criteria
                failed_criteria = []
                if criteria_results:
                    criteria_data = criteria_results.get("criteria", [])
                    failed_criteria = [
                        c.get("details", "Unknown") for c in criteria_data if not c.get("passed")
                    ]

                history.append(
                    {
                        "mission_id": str(mission_id) if mission_id else "",
                        "mission_title": title or "Unknown",
                        "difficulty": difficulty or "BEGINNER",
                        "score": int(score) if score else 0,
                        "duration": float(duration) if duration else None,
                        "failed_criteria": failed_criteria,
                        "completed_at": completed,
                    }
                )

            return history

        except Exception as e:
            print(f"[WARN] Failed to get evaluation history: {e}")
            return []

    @staticmethod
    def _determine_level(history: List[Dict]) -> str:
        """Determine current proficiency level from history."""
        if not history:
            return "BEGINNER"

        # Group by difficulty
        by_difficulty = {}
        for h in history:
            diff = h["difficulty"]
            if diff not in by_difficulty:
                by_difficulty[diff] = []
            by_difficulty[diff].append(h["score"])

        # Determine level by success at each difficulty
        if by_difficulty.get("ADVANCED"):
            avg_advanced = sum(by_difficulty["ADVANCED"]) / len(by_difficulty["ADVANCED"])
            if avg_advanced >= 75:
                return "ADVANCED"

        if by_difficulty.get("INTERMEDIATE"):
            avg_intermediate = sum(by_difficulty["INTERMEDIATE"]) / len(
                by_difficulty["INTERMEDIATE"]
            )
            if avg_intermediate >= 75:
                return "INTERMEDIATE"

        return "BEGINNER"

    @staticmethod
    def _determine_velocity(history: List[Dict]) -> str:
        """Determine learning velocity from completion time trend."""
        if len(history) < 3:
            return "MODERATE"

        # Compare early vs recent completion times
        early_times = [h["duration"] for h in history[-5:] if h["duration"]]
        recent_times = [h["duration"] for h in history[:3] if h["duration"]]

        if not early_times or not recent_times:
            return "MODERATE"

        avg_early = sum(early_times) / len(early_times)
        avg_recent = sum(recent_times) / len(recent_times)

        # Faster = FAST velocity
        if avg_recent < avg_early * 0.8:
            return "FAST"
        elif avg_recent > avg_early * 1.2:
            return "SLOW"
        else:
            return "MODERATE"

    @staticmethod
    def _determine_trend(history: List[Dict]) -> str:
        """Determine improvement trend from recent scores."""
        if len(history) < 2:
            return "New"

        recent_scores = [h["score"] for h in history[:5]]

        if len(recent_scores) < 2:
            return "New"

        # Calculate trend
        early_avg = sum(recent_scores[2:]) / len(recent_scores[2:]) if len(recent_scores) > 2 else recent_scores[-1]
        recent_avg = sum(recent_scores[:2]) / 2

        if recent_avg > early_avg + 10:
            return "Improving"
        elif recent_avg < early_avg - 10:
            return "Declining"
        else:
            return "Stable"

    @staticmethod
    def _identify_strengths_weaknesses(history: List[Dict]) -> tuple:
        """Identify strength and weakness areas from failed criteria."""
        if not history:
            return [], []

        # Track failure frequency by topic
        failure_topics = {}
        for h in history:
            for criterion in h["failed_criteria"]:
                # Extract topic from criterion (e.g., "Metadata issue" -> "Metadata")
                topic = criterion.split()[0] if criterion else "Unknown"
                failure_topics[topic] = failure_topics.get(topic, 0) + 1

        # Topics with most failures = weaknesses
        sorted_topics = sorted(failure_topics.items(), key=lambda x: x[1], reverse=True)
        weaknesses = [t[0] for t in sorted_topics[:2]]

        # Strengths = topics where learner consistently scores high
        if history:
            avg_score = sum(h["score"] for h in history) / len(history)
            high_performers = [h["difficulty"] for h in history if h["score"] >= avg_score + 15]
            strengths = list(set(high_performers))[:2]

        return strengths or ["Compute"], weaknesses or ["IAM"]

    @staticmethod
    def _calculate_skill_breakdown(history: List[Dict]) -> Dict[str, float]:
        """Calculate proficiency by skill category."""
        skills = {
            "COMPUTE": [],
            "IAM": [],
            "NETWORKING": [],
            "STORAGE": [],
            "MONITORING": [],
            "SECURITY": [],
            "DEVOPS": [],
        }

        for h in history:
            # Map difficulty and score to skill proficiency
            # For now, all missions are COMPUTE-focused, so map score to all skills
            # Future: analyze mission details to break down by skill
            score = h["score"]
            for skill in skills:
                skills[skill].append(score)

        # Average per skill
        skill_breakdown = {}
        for skill, scores in skills.items():
            skill_breakdown[skill] = sum(scores) / len(scores) if scores else 0

        return skill_breakdown

    @staticmethod
    def _create_new_learner_profile(user_id: str) -> LearnerProfile:
        """Create default profile for new learner."""
        return LearnerProfile(
            user_id=user_id,
            overall_level="BEGINNER",
            average_score=0,
            average_completion_minutes=45,
            learning_velocity="MODERATE",
            confidence=30,
            strengths=[],
            weaknesses=["All topics - start with basics"],
            recent_failures=[],
            recommended_focus="General Practice",
            total_missions=0,
            completion_rate=0,
            improvement_trend="New",
            last_three_scores=[],
            skill_breakdown={
                "COMPUTE": 0,
                "IAM": 0,
                "NETWORKING": 0,
                "STORAGE": 0,
                "MONITORING": 0,
                "SECURITY": 0,
                "DEVOPS": 0,
            },
        )
