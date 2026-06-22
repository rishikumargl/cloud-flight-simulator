"""Scenario generation service — implements scenario-generation-v1 LangChain chain."""

from typing import List, Optional
from uuid import uuid4
from datetime import datetime
from langchain_core.language_model import BaseLanguageModel
from langsmith import traceable
from sqlalchemy.orm import Session
from sqlalchemy import desc

from .models import Mission
from .schemas import MissionSchema, SuccessCriteria


class ScenarioService:
    """Service for generating and retrieving missions."""

    def __init__(self, llm: BaseLanguageModel):
        """Initialize service with LLM provider."""
        self.llm = llm

    @traceable(name="scenario-generation-v1")
    def generate(
        self,
        db: Session,
        user_id: str,
        track: str,
        difficulty: str,
        tags: Optional[List[str]] = None,
        metadata: Optional[dict] = None,
    ) -> MissionSchema:
        """
        Generate a mission using the scenario-generation-v1 chain.

        Invoked by POST /scenarios/generate.
        Traces to LangSmith with tags [track, difficulty] and metadata.
        """
        # Retrieve learner history for personalization context
        previous_missions = self._get_learner_history(db, user_id)
        previous_performance = self._get_learner_performance(db, user_id)

        # Generate mission via LLM (simplified prompt for now)
        # In production, this would be a full LangChain chain with:
        # - Prompt template with learner context
        # - LLM call
        # - Output parser
        mission_data = self._invoke_generation_chain(
            track=track,
            difficulty=difficulty,
            previous_missions=previous_missions,
            previous_performance=previous_performance,
        )

        # Validate and create MissionSchema
        mission = MissionSchema(
            mission_id=str(uuid4()),
            track=mission_data["track"],
            difficulty=mission_data["difficulty"],
            title=mission_data["title"],
            business_context=mission_data["business_context"],
            objectives=mission_data["objectives"],
            success_criteria=[
                SuccessCriteria(**c) for c in mission_data["success_criteria"]
            ],
            time_limit_minutes=mission_data["time_limit_minutes"],
            generated_by="scenario-generator",
            created_at=datetime.utcnow(),
        )

        # Persist to missions table
        self._persist_mission(db, mission)

        # LangSmith trace metadata (set by @traceable decorator context)
        # Tags: [track, difficulty]
        # Metadata: {user_id, mission_id, project: "cloud-flight-simulator"}

        return mission

    def get_mission(self, db: Session, mission_id: str) -> Optional[MissionSchema]:
        """Retrieve a mission by mission_id from the missions table."""
        mission = db.query(Mission).filter(Mission.mission_id == mission_id).first()

        if not mission:
            return None

        return MissionSchema(
            mission_id=str(mission.mission_id),
            track=mission.track,
            difficulty=mission.difficulty,
            title=mission.title,
            business_context=mission.business_context,
            objectives=mission.objectives,
            success_criteria=[
                SuccessCriteria(**c) for c in mission.success_criteria
            ],
            time_limit_minutes=mission.time_limit_minutes,
            generated_by=mission.generated_by,
            created_at=mission.created_at,
        )

    def _get_learner_history(self, db: Session, user_id: str) -> List[MissionSchema]:
        """Retrieve prior missions attempted by a learner for personalization context."""
        try:
            from sqlalchemy import text

            # Query: get missions from challenge_sessions where user_id matches
            # This allows us to personalize based on what they've already attempted
            query = text("""
                SELECT DISTINCT m.* FROM missions m
                INNER JOIN challenge_sessions cs ON m.mission_id = cs.mission_id
                WHERE cs.user_id = :user_id
                ORDER BY cs.created_at DESC
                LIMIT 5
            """)

            results = db.execute(query, {"user_id": user_id}).fetchall()

            prior_missions = []
            for row in results:
                if row:
                    mission = MissionSchema(
                        mission_id=str(row[0]),
                        track=row[1],
                        difficulty=row[2],
                        title=row[3],
                        business_context=row[4],
                        objectives=row[5],
                        success_criteria=[
                            SuccessCriteria(**c) for c in row[6]
                        ],
                        time_limit_minutes=row[7],
                        generated_by=row[8],
                        created_at=row[9],
                    )
                    prior_missions.append(mission)

            return prior_missions
        except Exception:
            # If query fails, return empty list (learner has no prior missions)
            return []

    def _get_learner_performance(self, db: Session, user_id: str) -> dict:
        """Retrieve prior performance metrics for a learner for personalization context."""
        try:
            from sqlalchemy import text

            # Query: aggregate performance from evaluations for this user
            # This allows us to adjust difficulty based on prior success rates
            query = text("""
                SELECT
                    COUNT(DISTINCT e.evaluation_id) as total_attempts,
                    COUNT(DISTINCT CASE WHEN e.percentage >= 80 THEN e.evaluation_id END) as successful_attempts,
                    AVG(e.percentage)::FLOAT as avg_score
                FROM evaluations e
                INNER JOIN challenge_sessions cs ON e.session_id = cs.session_id
                WHERE cs.user_id = :user_id
            """)

            result = db.execute(query, {"user_id": user_id}).fetchone()

            if result and result[0] is not None:
                total_attempts = result[0]
                successful_attempts = result[1] if result[1] else 0
                avg_score = result[2] if result[2] else 0.0

                return {
                    "total_attempts": total_attempts,
                    "successful_attempts": successful_attempts,
                    "success_rate": (successful_attempts / total_attempts * 100) if total_attempts > 0 else 0,
                    "avg_score": float(avg_score),
                }

            return {
                "total_attempts": 0,
                "successful_attempts": 0,
                "success_rate": 0,
                "avg_score": 0.0,
            }
        except Exception:
            # If query fails, return empty metrics
            return {
                "total_attempts": 0,
                "successful_attempts": 0,
                "success_rate": 0,
                "avg_score": 0.0,
            }

    def _invoke_generation_chain(
        self,
        track: str,
        difficulty: str,
        previous_missions: List[MissionSchema],
        previous_performance: dict,
    ) -> dict:
        """
        Invoke the LangChain generation chain.

        In production:
        - Build prompt with learner context
        - Call LLM
        - Parse structured output to dict
        """
        # Simplified mock generation for now
        # Production chain would be more sophisticated

        mission_id = str(uuid4())
        return {
            "track": track,
            "difficulty": difficulty,
            "title": f"Learn {track} on {difficulty} Level",
            "business_context": "A learner is working on a cloud challenge.",
            "objectives": ["Complete the challenge", "Learn GCP concepts"],
            "success_criteria": [
                {
                    "criterion_id": str(uuid4()),
                    "description": f"Complete {track} task",
                    "resource_type": "compute_instance"
                    if track == "COMPUTE"
                    else "storage_bucket",
                    "expected_state": {"name_suffix": "resource-01"},
                    "weight": 100,
                }
            ],
            "time_limit_minutes": 45 if difficulty == "BEGINNER" else 60,
        }

    def _persist_mission(self, db: Session, mission: MissionSchema) -> None:
        """Persist mission to missions table."""
        mission_obj = Mission(
            mission_id=mission.mission_id,
            track=mission.track,
            difficulty=mission.difficulty,
            title=mission.title,
            business_context=mission.business_context,
            objectives=mission.objectives,
            success_criteria=[c.dict() for c in mission.success_criteria],
            time_limit_minutes=mission.time_limit_minutes,
            generated_by=mission.generated_by,
            created_at=mission.created_at,
        )
        db.add(mission_obj)
        db.commit()
        db.refresh(mission_obj)
