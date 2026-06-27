"""Evaluation API routes — P5 owned.

Routes:
- GET /evaluate/{session_id} — Retrieve cached evaluation result
- POST /evaluate/{session_id}/run — Trigger live evaluation + return enriched response
- GET /progress/me — Get current learner progress (skills, achievements, stats)
"""

from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime

from app.dependencies import get_db
from app.dependencies.auth import get_current_user
from app.models.challenge_sessions import ChallengeSession
from app.evaluation.service import EvaluationService
from app.evaluation.models import Evaluation
from app.evaluation.schemas import EvaluationResponse, DeterministicCheck, RunEvaluationRequest

router = APIRouter(tags=["evaluation"])


def _build_response(evaluation: Evaluation) -> dict:
    """Convert Evaluation ORM to EvaluationResponse schema.

    Maps database percentage to contract score (0-100).
    Converts criteria_results to deterministic_checks format.
    """
    # Determine status from score
    score = int(evaluation.percentage)
    if score >= 80:
        status_val = "PASSED"
    elif score >= 50:
        status_val = "PARTIAL"
    else:
        status_val = "FAILED"

    # Extract criteria results
    criteria_data = evaluation.criteria_results.get("criteria", [])

    passed_checks = []
    failed_checks = []

    for criterion in criteria_data:
        check = DeterministicCheck(
            criterion_id=criterion.get("criterion_id"),
            passed=criterion.get("passed", False),
            details=criterion.get("details", ""),
            weight=criterion.get("weight", 0)
        )

        if criterion.get("passed"):
            passed_checks.append(check)
        else:
            failed_checks.append(check)

    response_data = EvaluationResponse(
        evaluation_id=str(evaluation.evaluation_id),
        session_id=str(evaluation.session_id),
        status=status_val,
        score=score,
        deterministic_checks={
            "passed": passed_checks,
            "failed": failed_checks
        },
        evaluated_at=evaluation.evaluated_at.isoformat()
    ).model_dump(mode="json")

    # Add coaching and recommendation data from evaluation
    response_data["explanation_score"] = evaluation.explanation_score
    response_data["coach_feedback"] = evaluation.coach_feedback_json or {}
    response_data["technical_skills"] = evaluation.technical_skill_breakdown_json or {}
    response_data["recommendation"] = evaluation.recommendation_json or {}
    response_data["summary"] = evaluation.overall_feedback_summary or ""
    response_data["solution_description"] = evaluation.solution_description

    return response_data


@router.get("/evaluate/{session_id}")
async def get_evaluation(
    session_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """GET /evaluate/{session_id}

    Retrieve cached evaluation result for a session, or None if not yet evaluated.

    Constraint: Returns cached result only. To trigger live evaluation, use POST /run.

    Response:
    {
        "success": true,
        "data": EvaluationResponse or null
    }
    """
    try:
        # Load session to verify ownership
        session = db.query(ChallengeSession).filter(
            ChallengeSession.session_id == session_id
        ).first()

        if not session:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={
                    "success": False,
                    "error": {"code": "SESSION_NOT_FOUND", "message": "Session not found"}
                }
            )

        # Verify user owns this session
        if session.user_id != current_user.user_id:
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={
                    "success": False,
                    "error": {"code": "FORBIDDEN", "message": "Access denied"}
                }
            )

        # Query for cached evaluation
        evaluation = db.query(Evaluation).filter(
            Evaluation.session_id == session_id
        ).first()

        # Return cached result (or null if not evaluated yet)
        if evaluation:
            return JSONResponse(
                status_code=status.HTTP_200_OK,
                content={
                    "success": True,
                    "data": _build_response(evaluation)
                }
            )
        else:
            return JSONResponse(
                status_code=status.HTTP_200_OK,
                content={
                    "success": True,
                    "data": None
                }
            )

    except Exception as e:
        print(f"[ERROR] GET /evaluate/{session_id}: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "error": {"code": "INTERNAL_ERROR", "message": "Failed to retrieve evaluation"}
            }
        )


@router.post("/evaluate/{session_id}/run")
async def run_evaluation(
    session_id: str,
    request: RunEvaluationRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """POST /evaluate/{session_id}/run

    Trigger live evaluation against GCP resource state.

    Always evaluates against live GCP state, never cached results.
    Fetches VM metadata, status, and tags from Compute API.
    Validates against mission success criteria expected_state.

    Returns enriched response with:
    - evaluation (score, status, deterministic checks)
    - analytics (completion_time, efficiency)
    - coach (strengths, weaknesses, recommendation)
    - recommendation (next difficulty, topic)

    Response:
    {
        "success": true,
        "data": {
            "evaluation": {...},
            "analytics": {...},
            "coach": {...},
            "recommendation": {...}
        }
    }
    """
    try:
        # Load session to verify ownership
        session = db.query(ChallengeSession).filter(
            ChallengeSession.session_id == session_id
        ).first()

        if not session:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={
                    "success": False,
                    "error": {"code": "SESSION_NOT_FOUND", "message": "Session not found"}
                }
            )

        # Verify user owns this session
        if session.user_id != current_user.user_id:
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={
                    "success": False,
                    "error": {"code": "FORBIDDEN", "message": "Access denied"}
                }
            )

        # Trigger live evaluation with learner's solution explanation
        service = EvaluationService()
        evaluation = service.evaluate(session_id, db, solution_description=request.solution_description)

        # Build enriched response
        eval_response = _build_response(evaluation)

        # Calculate analytics from session + evaluation
        analytics = EvaluationService.get_mission_analytics(session_id, db)

        # Generate coaching insights (internal FeedbackService call)
        from app.feedback.service import FeedbackService
        from app.scenarios.models import Mission

        mission = db.query(Mission).filter(Mission.mission_id == session.mission_id).first()
        if mission:
            coaching = FeedbackService().generate_feedback(
                evaluation=evaluation,
                mission=mission,
                session=session,
                user_id=current_user.user_id
            )
            coach_data = coaching.model_dump(mode="json")
        else:
            coach_data = {
                "strengths": [],
                "weaknesses": [],
                "biggest_mistake": "Unable to analyze",
                "recommendation": "Review the mission details",
                "cloud_concept": "GCP best practices",
                "estimated_readiness": "REPEAT_THIS_LEVEL"
            }

        # Generate recommendation (internal ScenarioService call)
        from app.scenarios.service import ScenarioService
        recommendation = ScenarioService().get_recommendation(db, str(current_user.user_id))
        recommendation_data = recommendation if isinstance(recommendation, dict) else recommendation.model_dump(mode="json")

        # Return enriched response
        enriched_response = {
            "evaluation": eval_response,
            "analytics": analytics,
            "coach": coach_data,
            "recommendation": recommendation_data
        }

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "success": True,
                "data": enriched_response
            }
        )

    except ValueError as e:
        print(f"[ERROR] POST /evaluate/{session_id}/run validation: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "success": False,
                "error": {"code": "VALIDATION_ERROR", "message": str(e)}
            }
        )

    except FileNotFoundError as e:
        print(f"[ERROR] POST /evaluate/{session_id}/run GCP auth: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "error": {"code": "GCP_AUTH_ERROR", "message": "GCP authentication failed"}
            }
        )

    except Exception as e:
        print(f"[ERROR] POST /evaluate/{session_id}/run: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "error": {"code": "INTERNAL_ERROR", "message": "Evaluation failed"}
            }
        )


@router.get("/progress/me")
async def get_progress_me(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """GET /progress/me

    Get current learner's progress profile with learning journey data.

    Returns: skill matrix, achievements, statistics, learner level, streak, recent missions.

    All values derived dynamically from mission history and evaluations.

    Response:
    {
        "success": true,
        "data": {
            "current_level": "Cloud Associate",
            "level_progress_pct": 82,
            "next_level": "Cloud Engineer",
            "learning_streak": {
                "current": 4,
                "longest": 7,
                "missions_this_week": 3
            },
            "skill_matrix": {
                "COMPUTE": { proficiency, confidence, missions_attempted, success_rate },
                ...7 skills total
            },
            "overall_proficiency": 0-100,
            "achievements": [
                { id, name, earned_at },
                ...
            ],
            "stats": {
                "total_missions": N,
                "completed_missions": N,
                "completion_rate": 0-100,
                "average_score": 0-100,
                "total_attempts": N,
                "current_streak": N
            },
            "recent_missions": [
                { mission_id, title, difficulty, track, score, explanation_score, status, summary, completed_at, evaluation_id },
                ...
            ]
        }
    }
    """
    try:
        # Derive skill matrix
        skills_dict = EvaluationService.derive_skill_matrix(str(current_user.user_id), db)

        # Derive achievements
        achievements = _derive_achievements(str(current_user.user_id), db)

        # Calculate statistics
        stats = _calculate_stats(str(current_user.user_id), db)

        # Get recent missions with evaluation details
        recent_missions = _get_recent_missions_detailed(str(current_user.user_id), db)

        # Calculate overall proficiency
        overall = sum(s["proficiency"] for s in skills_dict.values()) / len(skills_dict) if skills_dict else 0

        # Calculate learner level and progress
        level_info = _calculate_learner_level(float(overall), stats["total_missions"])

        # Calculate learning streak
        streak_info = _calculate_learning_streak(str(current_user.user_id), db)

        progress_data = {
            "current_level": level_info["current_level"],
            "level_progress_pct": level_info["progress_pct"],
            "next_level": level_info["next_level"],
            "learning_streak": streak_info,
            "skill_matrix": skills_dict,
            "overall_proficiency": int(overall),
            "achievements": achievements,
            "stats": stats,
            "recent_missions": recent_missions
        }

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "success": True,
                "data": progress_data
            }
        )

    except Exception as e:
        print(f"[ERROR] GET /progress/me: {e}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "error": {"code": "INTERNAL_ERROR", "message": "Failed to get progress"}
            }
        )


def _derive_achievements(user_id: str, db: Session) -> list:
    """Derive earned achievements from mission history and skill mastery."""
    try:
        query = text("""
            SELECT
                COUNT(DISTINCT cs.session_id) as total_completed,
                COUNT(DISTINCT CASE WHEN e.percentage >= 100 THEN cs.session_id END) as perfect_scores,
                COUNT(DISTINCT CASE WHEN e.percentage >= 80 THEN cs.session_id END) as successful,
                COUNT(DISTINCT CASE WHEN e.explanation_score >= 90 THEN cs.session_id END) as excellent_explanations,
                MIN(EXTRACT(EPOCH FROM (cs.completed_at - cs.started_at))/60) as fastest_time
            FROM challenge_sessions cs
            LEFT JOIN evaluations e ON cs.session_id = e.session_id
            WHERE cs.user_id = :user_id AND cs.completed_at IS NOT NULL
        """)

        result = db.execute(query, {"user_id": user_id}).fetchone()
        achievements = []

        if result and result[0] > 0:
            total_completed = result[0]
            perfect_scores = result[1] if result[1] else 0
            successful = result[2] if result[2] else 0
            excellent_explanations = result[3] if result[3] else 0

            # First Mission
            achievements.append({
                "id": "first-mission",
                "name": "First Mission",
                "earned_at": datetime.utcnow().isoformat()
            })

            # Five Missions
            if total_completed >= 5:
                achievements.append({
                    "id": "five-missions",
                    "name": "Five Successful Labs",
                    "earned_at": datetime.utcnow().isoformat()
                })

            # Perfect Infrastructure Score
            if perfect_scores > 0:
                achievements.append({
                    "id": "perfect-infrastructure",
                    "name": "Perfect Infrastructure",
                    "earned_at": datetime.utcnow().isoformat()
                })

            # Excellent Explanation (5+ excellent explanations)
            if excellent_explanations >= 5:
                achievements.append({
                    "id": "explanation-master",
                    "name": "Explanation Master",
                    "earned_at": datetime.utcnow().isoformat()
                })

            # Five Consecutive Passes
            consecutive = _count_consecutive_passes(user_id, db)
            if consecutive >= 5:
                achievements.append({
                    "id": "unstoppable",
                    "name": "Five Consecutive Passes",
                    "earned_at": datetime.utcnow().isoformat()
                })

            # Fast Resolver
            if result[4] and result[4] < 20:
                achievements.append({
                    "id": "fast-resolver",
                    "name": "Speed Runner",
                    "earned_at": datetime.utcnow().isoformat()
                })

        # Skill-based achievements
        skill_achievements = _derive_skill_achievements(user_id, db)
        achievements.extend(skill_achievements)

        return achievements

    except Exception as e:
        print(f"[WARN] Failed to derive achievements: {e}")
        return []


def _count_consecutive_passes(user_id: str, db: Session) -> int:
    """Count maximum consecutive PASSED evaluations."""
    try:
        query = text("""
            SELECT
                e.percentage
            FROM challenge_sessions cs
            LEFT JOIN evaluations e ON cs.session_id = e.session_id
            WHERE cs.user_id = :user_id AND cs.completed_at IS NOT NULL
            ORDER BY cs.completed_at DESC
            LIMIT 10
        """)

        results = db.execute(query, {"user_id": user_id}).fetchall()

        consecutive = 0
        for row in results:
            if row[0] and row[0] >= 80:
                consecutive += 1
            else:
                break

        return consecutive

    except Exception as e:
        print(f"[WARN] Failed to count consecutive passes: {e}")
        return 0


def _derive_skill_achievements(user_id: str, db: Session) -> list:
    """Derive skill-based achievements from technical skill breakdown."""
    try:
        query = text("""
            SELECT
                e.technical_skill_breakdown_json
            FROM evaluations e
            JOIN challenge_sessions cs ON e.session_id = cs.session_id
            WHERE cs.user_id = :user_id
            AND e.technical_skill_breakdown_json IS NOT NULL
            ORDER BY e.evaluated_at DESC
            LIMIT 10
        """)

        results = db.execute(query, {"user_id": user_id}).fetchall()

        skill_achievements = []
        skill_scores = {}

        # Aggregate skill proficiencies from recent evaluations
        for row in results:
            if row[0]:
                skills = row[0]
                for skill_name, skill_data in skills.items():
                    if skill_name not in skill_scores:
                        skill_scores[skill_name] = []
                    proficiency = skill_data.get("proficiency", 0)
                    if isinstance(proficiency, dict):
                        proficiency = proficiency.get("proficiency", 0)
                    skill_scores[skill_name].append(proficiency)

        # Check for skill mastery (avg >= 85)
        skill_name_map = {
            "compute": "Cloud Compute Expert",
            "networking": "Networking Specialist",
            "storage": "Storage Architect",
            "iam": "IAM Authority",
            "linux": "Linux Guru",
            "devops": "DevOps Pro",
            "cloud_ops": "Cloud Operations Master"
        }

        for skill_name, scores in skill_scores.items():
            avg_score = sum(scores) / len(scores) if scores else 0
            if avg_score >= 85:
                achievement_name = skill_name_map.get(skill_name.lower(), f"{skill_name} Specialist")
                skill_achievements.append({
                    "id": f"skill-{skill_name.lower()}",
                    "name": achievement_name,
                    "earned_at": datetime.utcnow().isoformat()
                })

        return skill_achievements

    except Exception as e:
        print(f"[WARN] Failed to derive skill achievements: {e}")
        return []


def _calculate_stats(user_id: str, db: Session) -> dict:
    """Calculate learner statistics."""
    try:
        query = text("""
            SELECT
                COUNT(DISTINCT cs.session_id) as total_missions,
                COUNT(DISTINCT CASE WHEN cs.completed_at IS NOT NULL THEN cs.session_id END) as completed,
                COUNT(DISTINCT CASE WHEN e.percentage >= 80 THEN cs.session_id END) as successful,
                AVG(e.percentage)::FLOAT as avg_score,
                COUNT(DISTINCT e.evaluation_id) as total_evals
            FROM challenge_sessions cs
            LEFT JOIN evaluations e ON cs.session_id = e.session_id
            WHERE cs.user_id = :user_id
        """)

        result = db.execute(query, {"user_id": user_id}).fetchone()

        if not result or result[0] == 0:
            return {
                "total_missions": 0,
                "completed_missions": 0,
                "completion_rate": 0.0,
                "average_score": 0.0,
                "total_attempts": 0,
                "current_streak": 0
            }

        total = result[0]
        completed = result[1] if result[1] else 0
        successful = result[2] if result[2] else 0
        avg_score = float(result[3]) if result[3] else 0
        total_evals = result[4] if result[4] else 0

        completion_rate = (completed / total * 100) if total > 0 else 0

        # Calculate streak
        streak_query = text("""
            SELECT COUNT(*) as streak
            FROM (
                SELECT DISTINCT ON (cs.session_id) e.percentage
                FROM challenge_sessions cs
                LEFT JOIN evaluations e ON cs.session_id = e.session_id
                WHERE cs.user_id = :user_id AND cs.completed_at IS NOT NULL
                ORDER BY cs.session_id, e.evaluated_at DESC
                LIMIT 5
            ) recent
            WHERE percentage >= 80
        """)

        streak_result = db.execute(streak_query, {"user_id": user_id}).scalar()
        streak = streak_result if streak_result else 0

        return {
            "total_missions": total,
            "completed_missions": completed,
            "completion_rate": round(completion_rate, 1),
            "average_score": round(avg_score, 1),
            "total_attempts": total_evals,
            "current_streak": streak
        }

    except Exception as e:
        print(f"[WARN] Failed to calculate stats: {e}")
        return {
            "total_missions": 0,
            "completed_missions": 0,
            "completion_rate": 0.0,
            "average_score": 0.0,
            "total_attempts": 0,
            "current_streak": 0
        }


def _get_recent_missions(user_id: str, db: Session) -> list:
    """Get last 5 completed missions."""
    try:
        query = text("""
            SELECT
                m.mission_id,
                m.title,
                m.difficulty,
                e.percentage,
                CASE
                    WHEN e.percentage >= 80 THEN 'PASSED'
                    WHEN e.percentage >= 50 THEN 'PARTIAL'
                    ELSE 'FAILED'
                END as status,
                cs.completed_at
            FROM challenge_sessions cs
            LEFT JOIN missions m ON cs.mission_id = m.mission_id
            LEFT JOIN evaluations e ON cs.session_id = e.session_id
            WHERE cs.user_id = :user_id AND cs.completed_at IS NOT NULL
            ORDER BY cs.completed_at DESC
            LIMIT 5
        """)

        results = db.execute(query, {"user_id": user_id}).fetchall()

        recent = []
        for row in results:
            if row:
                recent.append({
                    "mission_id": str(row[0]) if row[0] else "",
                    "title": row[1] or "Unknown Mission",
                    "difficulty": row[2] or "BEGINNER",
                    "score": int(row[3]) if row[3] else 0,
                    "status": row[4] or "FAILED",
                    "completed_at": row[5].isoformat() if row[5] else datetime.utcnow().isoformat()
                })

        return recent

    except Exception as e:
        print(f"[WARN] Failed to get recent missions: {e}")
        return []


def _get_recent_missions_detailed(user_id: str, db: Session) -> list:
    """Get last 10 completed missions with full evaluation details for learning journal."""
    try:
        query = text("""
            SELECT
                m.mission_id,
                m.title,
                m.difficulty,
                m.track,
                e.percentage,
                e.explanation_score,
                CASE
                    WHEN e.percentage >= 80 THEN 'PASSED'
                    WHEN e.percentage >= 50 THEN 'PARTIAL'
                    ELSE 'FAILED'
                END as status,
                e.overall_feedback_summary,
                cs.completed_at,
                e.evaluation_id
            FROM challenge_sessions cs
            LEFT JOIN missions m ON cs.mission_id = m.mission_id
            LEFT JOIN evaluations e ON cs.session_id = e.session_id
            WHERE cs.user_id = :user_id AND cs.completed_at IS NOT NULL
            ORDER BY cs.completed_at DESC
            LIMIT 10
        """)

        results = db.execute(query, {"user_id": user_id}).fetchall()

        recent = []
        for row in results:
            if row:
                recent.append({
                    "mission_id": str(row[0]) if row[0] else "",
                    "title": row[1] or "Unknown Mission",
                    "difficulty": row[2] or "BEGINNER",
                    "track": row[3] or "General",
                    "score": int(row[4]) if row[4] else 0,
                    "explanation_score": int(row[5]) if row[5] else None,
                    "status": row[6] or "FAILED",
                    "summary": row[7] or "",
                    "completed_at": row[8].isoformat() if row[8] else datetime.utcnow().isoformat(),
                    "evaluation_id": str(row[9]) if row[9] else ""
                })

        return recent

    except Exception as e:
        print(f"[WARN] Failed to get recent missions detailed: {e}")
        return []


def _calculate_learner_level(avg_score: float, total_missions: int) -> dict:
    """Calculate learner level (Apprentice/Associate/Engineer/Specialist) and progress.

    Level progression:
    - Apprentice: <50% avg score or <3 missions
    - Associate: 50-75% avg score, ≥3 missions
    - Engineer: 75-90% avg score, ≥7 missions
    - Specialist: ≥90% avg score, ≥12 missions
    """
    if total_missions < 3 or avg_score < 50:
        return {
            "current_level": "Cloud Apprentice",
            "next_level": "Cloud Associate",
            "progress_pct": min(int((total_missions / 3) * 100), 99),
        }
    elif avg_score < 75 or total_missions < 7:
        progress = int(((avg_score - 50) / 25) * 100) if avg_score >= 50 else 0
        return {
            "current_level": "Cloud Associate",
            "next_level": "Cloud Engineer",
            "progress_pct": min(progress, 99),
        }
    elif avg_score < 90 or total_missions < 12:
        progress = int(((avg_score - 75) / 15) * 100) if avg_score >= 75 else 0
        return {
            "current_level": "Cloud Engineer",
            "next_level": "Cloud Specialist",
            "progress_pct": min(progress, 99),
        }
    else:
        return {
            "current_level": "Cloud Specialist",
            "next_level": "Mastery",
            "progress_pct": min(int((avg_score - 90) / 10 * 100), 100),
        }


def _calculate_learning_streak(user_id: str, db: Session) -> dict:
    """Calculate current streak, longest streak, and missions this week."""
    try:
        # Get all completed evaluations for this user, ordered by date
        query = text("""
            SELECT
                cs.completed_at,
                CASE
                    WHEN e.percentage >= 80 THEN 'PASSED'
                    WHEN e.percentage >= 50 THEN 'PARTIAL'
                    ELSE 'FAILED'
                END as status
            FROM challenge_sessions cs
            LEFT JOIN evaluations e ON cs.session_id = e.session_id
            WHERE cs.user_id = :user_id AND cs.completed_at IS NOT NULL
            ORDER BY cs.completed_at DESC
        """)

        results = db.execute(query, {"user_id": user_id}).fetchall()

        if not results:
            return {
                "current": 0,
                "longest": 0,
                "missions_this_week": 0
            }

        # Calculate current streak (consecutive PASSED from most recent)
        current_streak = 0
        for row in results:
            if row[1] == "PASSED":
                current_streak += 1
            else:
                break

        # Calculate longest streak
        longest_streak = 0
        temp_streak = 0
        for row in results:
            if row[1] == "PASSED":
                temp_streak += 1
                longest_streak = max(longest_streak, temp_streak)
            else:
                temp_streak = 0

        # Count missions completed this week
        week_query = text("""
            SELECT COUNT(DISTINCT cs.session_id)
            FROM challenge_sessions cs
            WHERE cs.user_id = :user_id
            AND cs.completed_at IS NOT NULL
            AND cs.completed_at >= NOW() - INTERVAL '7 days'
        """)

        week_result = db.execute(week_query, {"user_id": user_id}).scalar()
        missions_this_week = week_result if week_result else 0

        return {
            "current": current_streak,
            "longest": longest_streak,
            "missions_this_week": missions_this_week
        }

    except Exception as e:
        print(f"[WARN] Failed to calculate learning streak: {e}")
        return {
            "current": 0,
            "longest": 0,
            "missions_this_week": 0
        }
