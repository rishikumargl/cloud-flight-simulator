"""Feedback service — P6 owned."""
import json
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.feedback.models import FeedbackReport
from app.feedback.schemas import FeedbackReportSchema, NextRecommendation
from app.feedback.chain import generate_feedback
from datetime import datetime, timezone


class FeedbackService:
    """Service for generating and retrieving feedback."""

    def generate(
        self,
        db: Session,
        user_id: UUID,
        session_id: UUID,
    ) -> FeedbackReportSchema:
        """
        Generate feedback for a challenge session.

        Args:
            db: Database session
            user_id: Authenticated user ID
            session_id: Challenge session ID

        Returns:
            FeedbackReportSchema

        Raises:
            ValueError: If no evaluation exists, user mismatch, or LLM fails
        """
        session_result = db.execute(
            text("""
                SELECT user_id, mission_id, created_at
                FROM challenge_sessions
                WHERE session_id = :session_id
            """),
            {"session_id": str(session_id)}
        ).first()

        if not session_result:
            raise ValueError(f"Challenge session {session_id} not found")

        session_user_id, mission_id, _ = session_result

        if UUID(str(session_user_id)) != user_id:
            raise PermissionError(
                f"User {user_id} does not have access to session {session_id}"
            )

        result = db.execute(
            text("""
                SELECT evaluation_id, session_id, percentage, criteria_results, resource_snapshot, evaluated_at
                FROM evaluations
                WHERE session_id = :session_id
                ORDER BY evaluated_at DESC
                LIMIT 1
            """),
            {"session_id": str(session_id)}
        ).first()

        if not result:
            raise ValueError(
                f"No evaluation found for session {session_id}. "
                "Cannot generate feedback without evaluation."
            )

        evaluation_result = {
            "evaluation_id": str(result[0]),
            "session_id": str(result[1]),
            "percentage": float(result[2]),
            "criteria_results": result[3] or [],
            "resource_snapshot": result[4] or {},
        }

        mission_result = db.execute(
            text("""
                SELECT mission_id, track, difficulty, title, business_context
                FROM missions
                WHERE mission_id = :mission_id
            """),
            {"mission_id": str(mission_id)}
        ).first()

        if not mission_result:
            raise ValueError(f"Mission {mission_id} not found")

        mission_mission_id, mission_track, mission_difficulty, mission_title, mission_context_text = mission_result

        mission_context = {
            "mission_id": str(mission_mission_id),
            "track": mission_track,
            "difficulty": mission_difficulty,
            "title": mission_title,
            "business_context": mission_context_text,
        }

        history_results = db.execute(
            text("""
                SELECT score
                FROM challenge_sessions
                WHERE user_id = :user_id
                AND session_id != :session_id
                AND score IS NOT NULL
            """),
            {"user_id": str(user_id), "session_id": str(session_id)}
        ).all()

        scores = [float(row[0]) for row in history_results if row[0] is not None]
        learner_history = {
            "num_attempts": len(history_results),
            "average_score": float(sum(scores) / len(scores)) if scores else 0,
            "max_score": float(max(scores)) if scores else 0,
            "min_score": float(min(scores)) if scores else 0,
        }

        feedback_output = generate_feedback(
            evaluation_result=evaluation_result,
            mission_context=mission_context,
            learner_history=learner_history,
        )

        next_rec = feedback_output.next_recommendation
        next_recommendation_obj = NextRecommendation(
            track=next_rec.get("track", mission_track),
            difficulty=next_rec.get("difficulty", "BEGINNER"),
            reason=next_rec.get("reason", "Continue practicing this track."),
        )

        feedback_report = FeedbackReport(
            session_id=session_id,
            summary=feedback_output.summary,
            strengths=feedback_output.strengths,
            mistakes=feedback_output.mistakes,
            improvements=feedback_output.improvements,
            next_recommendation=next_recommendation_obj.model_dump(),
            generated_at=datetime.now(timezone.utc),
        )

        db.add(feedback_report)
        db.commit()
        db.refresh(feedback_report)

        try:
            db.execute(
                text("""
                    INSERT INTO audit_events (user_id, session_id, event_type, source, payload, occurred_at)
                    VALUES (:user_id, :session_id, :event_type, :source, :payload, NOW())
                """),
                {
                    "user_id": str(user_id),
                    "session_id": str(session_id),
                    "event_type": "FEEDBACK_GENERATED",
                    "source": "FEEDBACK_SERVICE",
                    "payload": json.dumps({
                        "feedback_id": str(feedback_report.feedback_id),
                        "evaluation_id": evaluation_result["evaluation_id"],
                    }),
                }
            )
            db.commit()
        except Exception as e:
            print(f"[WARNING] Failed to write audit event: {e}")

        return FeedbackReportSchema(
            feedback_id=feedback_report.feedback_id,
            session_id=feedback_report.session_id,
            summary=feedback_report.summary,
            strengths=feedback_report.strengths or [],
            mistakes=feedback_report.mistakes or [],
            improvements=feedback_report.improvements or [],
            next_recommendation=next_recommendation_obj,
            generated_at=feedback_report.generated_at,
        )

    def get_feedback(
        self,
        db: Session,
        user_id: UUID,
        session_id: UUID,
    ) -> FeedbackReportSchema | None:
        """
        Retrieve feedback for a challenge session.

        Args:
            db: Database session
            user_id: Authenticated user ID
            session_id: Challenge session ID

        Returns:
            FeedbackReportSchema or None if not found

        Raises:
            PermissionError: If user does not own the session
        """
        session_result = db.execute(
            text("""
                SELECT user_id
                FROM challenge_sessions
                WHERE session_id = :session_id
            """),
            {"session_id": str(session_id)}
        ).first()

        if not session_result:
            return None

        session_user_id, = session_result

        if UUID(str(session_user_id)) != user_id:
            raise PermissionError(
                f"User {user_id} does not have access to session {session_id}"
            )

        feedback = db.query(FeedbackReport).filter(
            FeedbackReport.session_id == session_id
        ).first()

        if not feedback:
            return None

        next_rec = feedback.next_recommendation or {}
        next_recommendation_obj = NextRecommendation(
            track=next_rec.get("track", "COMPUTE"),
            difficulty=next_rec.get("difficulty", "BEGINNER"),
            reason=next_rec.get("reason", ""),
        )

        return FeedbackReportSchema(
            feedback_id=feedback.feedback_id,
            session_id=feedback.session_id,
            summary=feedback.summary,
            strengths=feedback.strengths or [],
            mistakes=feedback.mistakes or [],
            improvements=feedback.improvements or [],
            next_recommendation=next_recommendation_obj,
            generated_at=feedback.generated_at,
        )
