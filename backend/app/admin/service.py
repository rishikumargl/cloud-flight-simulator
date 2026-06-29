"""Admin analytics service — system-wide insights."""

from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import text


class AdminService:
    """Service for administrative analytics and reporting."""

    @staticmethod
    def get_system_analytics(db: Session) -> dict:
        """Get system-wide analytics for admin dashboard.

        Returns: user counts, mission stats, score trends, skill distribution, etc.
        """
        try:
            # Total users
            users_query = text("SELECT COUNT(DISTINCT user_id) FROM users")
            total_users = db.execute(users_query).scalar() or 0

            # Total missions
            missions_query = text("SELECT COUNT(DISTINCT mission_id) FROM missions")
            total_missions = db.execute(missions_query).scalar() or 0

            # Completed missions
            completed_query = text("""
                SELECT COUNT(DISTINCT cs.session_id)
                FROM challenge_sessions cs
                WHERE cs.completed_at IS NOT NULL
            """)
            total_completed = db.execute(completed_query).scalar() or 0

            # Completion rate
            started_query = text("SELECT COUNT(DISTINCT session_id) FROM challenge_sessions")
            total_started = db.execute(started_query).scalar() or 1
            completion_rate = (total_completed / total_started * 100) if total_started > 0 else 0

            # Average score
            score_query = text("SELECT AVG(percentage)::FLOAT FROM evaluations")
            avg_score = float(db.execute(score_query).scalar() or 0)

            # Average completion time
            time_query = text("""
                SELECT AVG(EXTRACT(EPOCH FROM (cs.completed_at - cs.started_at))/60)::FLOAT
                FROM challenge_sessions cs
                WHERE cs.completed_at IS NOT NULL
            """)
            avg_time = float(db.execute(time_query).scalar() or 45)

            # Most attempted mission
            most_attempted_query = text("""
                SELECT m.title, COUNT(cs.session_id) as attempts
                FROM missions m
                JOIN challenge_sessions cs ON m.mission_id = cs.mission_id
                GROUP BY m.mission_id, m.title
                ORDER BY attempts DESC
                LIMIT 1
            """)
            most_attempted_result = db.execute(most_attempted_query).fetchone()
            most_attempted = most_attempted_result[0] if most_attempted_result else None

            # Most failed mission
            most_failed_query = text("""
                SELECT m.title, COUNT(cs.session_id) as failures
                FROM missions m
                JOIN challenge_sessions cs ON m.mission_id = cs.mission_id
                JOIN evaluations e ON cs.session_id = e.session_id
                WHERE e.percentage < 50
                GROUP BY m.mission_id, m.title
                ORDER BY failures DESC
                LIMIT 1
            """)
            most_failed_result = db.execute(most_failed_query).fetchone()
            most_failed = most_failed_result[0] if most_failed_result else None

            # Difficulty distribution
            difficulty_query = text("""
                SELECT difficulty, COUNT(*) as count
                FROM missions
                GROUP BY difficulty
            """)
            difficulty_dist = {}
            for row in db.execute(difficulty_query):
                difficulty_dist[row[0]] = row[1]

            # Track distribution
            track_query = text("""
                SELECT track, COUNT(*) as count
                FROM missions
                GROUP BY track
            """)
            track_dist = {}
            for row in db.execute(track_query):
                track_dist[row[0]] = row[1]

            return {
                "total_users": total_users,
                "total_missions_generated": total_missions,
                "total_missions_completed": total_completed,
                "average_completion_rate": round(completion_rate, 1),
                "average_score": round(avg_score, 1),
                "average_completion_time": round(avg_time, 1),
                "most_attempted_mission": most_attempted,
                "most_failed_mission": most_failed,
                "difficulty_distribution": difficulty_dist,
                "track_distribution": track_dist,
                "last_updated": datetime.utcnow().isoformat()
            }

        except Exception as e:
            print(f"[WARN] Failed to get system analytics: {e}")
            return {}
