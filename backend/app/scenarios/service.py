"""Scenario generation service — implements scenario-generation-v1 LangChain chain."""

import json
from typing import List, Optional
from uuid import uuid4
from datetime import datetime
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langsmith import traceable
from sqlalchemy.orm import Session
from sqlalchemy import desc

from .models import Mission
from .schemas import MissionSchema, SuccessCriteria


class ScenarioService:
    """Service for generating missions using LangChain."""

    def __init__(self):
        """Initialize service — LLM will be injected via get_llm() factory."""
        pass

    @traceable(
        name="scenario-generation-v1",
        tags=["scenario-generation"],
        metadata={"project": "cloud-flight-simulator"},
    )
    def generate(
        self,
        db: Session,
        user_id: str,
        track: str,
        difficulty: str,
    ) -> MissionSchema:
        import random

        # Randomly select one of the 3 free tier zones
        FREE_TIER_ZONES = ["us-west1-a", "us-central1-a", "us-east1-a"]
        selected_zone = random.choice(FREE_TIER_ZONES)
        """
        Generate a mission using the scenario-generation-v1 LangChain chain.

        Invoked by POST /scenarios/generate.
        Returns validated MissionSchema without persisting to database.
        Database persistence is handled by the API layer.

        Args:
            db: Database session for context queries only
            user_id: ID of learner requesting mission
            track: Track (COMPUTE, STORAGE)
            difficulty: Difficulty (BEGINNER, INTERMEDIATE, ADVANCED)

        Returns:
            MissionSchema: Validated generated mission
        """
        # Retrieve learner context for personalization
        previous_missions = self._get_learner_history(db, user_id)
        previous_performance = self._get_learner_performance(db, user_id)

        # Generate mission via LangChain chain
        mission_data = self._invoke_generation_chain(
            track=track,
            difficulty=difficulty,
            zone=selected_zone,
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

        # Add trace metadata
        # LangSmith will capture:
        # - user_id from context
        # - mission_id from generated mission
        # - track and difficulty from tags

        return mission

    def get_mission(self, db: Session, mission_id: str) -> Optional[MissionSchema]:
        """
        Retrieve a mission by mission_id from the missions table.

        Args:
            db: Database session
            mission_id: UUID of mission to retrieve

        Returns:
            MissionSchema if found, None otherwise
        """
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
        """
        Retrieve prior missions attempted by a learner for personalization context.

        READ-ONLY access to challenge_sessions table.
        """
        try:
            from sqlalchemy import text

            query = text("""
                SELECT m.*
                FROM missions m
                INNER JOIN (
                    SELECT DISTINCT ON (cs.mission_id)
                        cs.mission_id,
                        cs.created_at
                    FROM challenge_sessions cs
                    WHERE cs.user_id = :user_id
                    ORDER BY cs.mission_id, cs.created_at DESC
                ) recent ON recent.mission_id = m.mission_id
                ORDER BY recent.created_at DESC
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
        except Exception as e:
            # A failed read leaves the SQLAlchemy session in an aborted transaction
            # state on Postgres. Roll it back so mission generation can continue.
            db.rollback()
            print(f"[WARN] Failed to load learner mission history: {e}")
            return []

    def _get_learner_performance(self, db: Session, user_id: str) -> dict:
        """
        Retrieve prior performance metrics for a learner for personalization context.

        READ-ONLY access to evaluations and challenge_sessions tables.
        """
        try:
            from sqlalchemy import text

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
                    "success_rate": (successful_attempts / total_attempts * 100)
                    if total_attempts > 0
                    else 0,
                    "avg_score": float(avg_score),
                }

            return {
                "total_attempts": 0,
                "successful_attempts": 0,
                "success_rate": 0,
                "avg_score": 0.0,
            }
        except Exception as e:
            # Keep personalization failures from poisoning the session used for
            # the later mission insert.
            db.rollback()
            print(f"[WARN] Failed to load learner performance: {e}")
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
        zone: str,
        previous_missions: List[MissionSchema],
        previous_performance: dict,
    ) -> dict:
        """
        Invoke the scenario-generation-v1 LangChain chain.

        Uses OpenAI-compatible LLM via P2's factory.
        Returns structured JSON that maps directly to MissionSchema.
        Generates COMPUTE TRACK (Compute Engine) missions using e2-micro and free tier zones.

        Args:
            track: Track for mission (COMPUTE only)
            difficulty: Difficulty level (BEGINNER, INTERMEDIATE, ADVANCED)
            zone: GCP zone (randomly selected from free tier zones)
            previous_missions: Up to 5 prior missions for context
            previous_performance: Aggregated performance metrics

        Returns:
            dict with keys: track, difficulty, title, business_context, objectives,
                           success_criteria, time_limit_minutes
        """
        # Import LLM from P2's factory (provider-agnostic)
        try:
            from app.llm.factory import get_llm
        except ImportError:
            # Fallback if factory not yet available
            from app.llm.factory import get_llm

        # Build learner context for prompt
        prior_titles = [m.title for m in previous_missions[:3]]
        success_rate = previous_performance.get("success_rate", 0)
        avg_score = previous_performance.get("avg_score", 0)
        total_attempts = previous_performance.get("total_attempts", 0)

        # Define the prompt template for COMPUTE ENGINE ONLY (e2-micro, free tier zones)
        prompt_template = PromptTemplate(
            input_variables=["difficulty", "zone", "prior_missions", "success_rate", "avg_score", "total_attempts"],
            template="""You are an expert Google Cloud instructor specializing in Compute Engine. Generate a realistic, educational GCP Compute Engine mission using free tier resources only.

IMPORTANT:
- All missions MUST use ONLY Compute Engine (no other GCP services)
- Machine type is ALWAYS e2-micro (1 vCPU, 1GB RAM)
- Zone is ALWAYS {zone} (free tier zone)
- Only resource type allowed: compute_instance
- No networking, firewall, or other services

Learner Profile:
- Track: Compute Engine
- Difficulty Level: {difficulty}
- Zone: {zone}
- Prior Attempts: {total_attempts}
- Success Rate: {success_rate:.1f}%
- Average Score: {avg_score:.1f}%
- Recent Missions: {prior_missions}

Generate a NEW and UNIQUE Compute Engine mission that:
1. Teaches DIFFERENT practical e2-micro VM skills each time
2. Matches the {difficulty} level
3. AVOIDS these recent missions: {prior_missions}
4. Personalizes based on learner success rate: {success_rate:.1f}%
5. Includes hands-on GCP Console tasks
6. Uses ONLY e2-micro machine type (free tier)
7. Generates DYNAMIC success criteria based on the specific mission task

Return ONLY valid JSON (no markdown, no explanation) with this exact structure:
{{
  "track": "COMPUTE",
  "difficulty": "{difficulty}",
  "title": "UNIQUE mission title (e.g., 'Deploy Web Server', 'Configure SSH Access', 'Set Up Startup Script')",
  "business_context": "Specific real-world scenario explaining WHY learners need this Compute Engine skill",
  "objectives": [
    "1. First step to complete",
    "2. Second step to complete",
    "3. Third step to complete"
  ],
  "success_criteria": [
    {{
      "criterion_id": "unique-id-1",
      "description": "SPECIFIC criterion for this mission (e.g., 'VM created with correct labels', 'SSH configured', 'Web server running')",
      "resource_type": "compute_instance",
      "expected_state": {{
        "name_suffix": "descriptive-name-for-this-mission",
        "machine_type": "e2-micro"
      }},
      "weight": 34
    }},
    {{
      "criterion_id": "unique-id-2",
      "description": "SECOND specific criterion for this mission (testing different aspect)",
      "resource_type": "compute_instance",
      "expected_state": {{
        "name_suffix": "descriptive-name-for-this-mission",
        "machine_type": "e2-micro"
      }},
      "weight": 33
    }},
    {{
      "criterion_id": "unique-id-3",
      "description": "THIRD specific criterion for this mission (testing another aspect)",
      "resource_type": "compute_instance",
      "expected_state": {{
        "name_suffix": "descriptive-name-for-this-mission",
        "machine_type": "e2-micro"
      }},
      "weight": 33
    }}
  ],
  "time_limit_minutes": 45
}}

CRITICAL RULES:
- Track MUST be "COMPUTE"
- Weights MUST sum to exactly 100 (always 34, 33, 33)
- Use ONLY "name_suffix" in expected_state (never full resource names)
- Machine type MUST ALWAYS be "e2-micro"
- Zone MUST ALWAYS be {zone} (randomly selected from: us-west1-a, us-central1-a, us-east1-a)
- resource_type MUST be ONLY "compute_instance"
- Include EXACTLY 3 success criteria that test DIFFERENT aspects of THIS specific mission
- Each criterion description MUST be specific to the mission (not generic)
- time_limit_minutes: 30-45 for BEGINNER, 45-60 for INTERMEDIATE, 60-90 for ADVANCED
- objectives MUST be numbered steps specific to this mission (3 steps)
- business_context MUST be specific scenario, NOT generic VM management
- title MUST be unique and avoid: {prior_missions}
- Return ONLY JSON, no extra text
- ABSOLUTELY NO other GCP services (Compute Engine only)
- ABSOLUTELY NO other machine types (only e2-micro)
- ABSOLUTELY NO other zones (only us-west1-a, us-central1-a, or us-east1-a as provided)
- EVERY mission MUST be different - generate creative Compute Engine tasks
""",
        )

        # Create output parser for structured JSON
        json_parser = JsonOutputParser()

        # Get LLM from P2's factory (provider-agnostic)
        llm = get_llm()

        # Build and invoke the chain
        # Format: prompt -> llm -> parser
        chain = prompt_template | llm | json_parser

        # Invoke with learner context
        try:
            mission_data = chain.invoke(
                {
                    "difficulty": difficulty,
                    "zone": zone,
                    "prior_missions": json.dumps(prior_titles),
                    "success_rate": success_rate,
                    "avg_score": avg_score,
                    "total_attempts": total_attempts,
                }
            )

            # Validate response structure
            required_fields = [
                "track",
                "difficulty",
                "title",
                "business_context",
                "objectives",
                "success_criteria",
                "time_limit_minutes",
            ]
            for field in required_fields:
                if field not in mission_data:
                    raise ValueError(f"Missing required field: {field}")

            # Validate success_criteria weights sum to 100
            weights = [c.get("weight", 0) for c in mission_data.get("success_criteria", [])]
            if sum(weights) != 100:
                raise ValueError(f"Success criteria weights sum to {sum(weights)}, must be 100")

            # Validate track is COMPUTE
            if mission_data.get("track") != "COMPUTE":
                raise ValueError(
                    f"Track must be 'COMPUTE', got '{mission_data.get('track')}'"
                )

            # Validate ONLY compute_instance resource type (Compute Engine only, no networking)
            for criterion in mission_data.get("success_criteria", []):
                resource_type = criterion.get("resource_type")
                if resource_type != "compute_instance":
                    raise ValueError(
                        f"Only 'compute_instance' resource type allowed (Compute Engine only). "
                        f"Got '{resource_type}'. No networking or other services."
                    )

                # Validate machine_type is e2-micro (free tier)
                expected_state = criterion.get("expected_state", {})
                machine_type = expected_state.get("machine_type")
                if machine_type != "e2-micro":
                    raise ValueError(
                        f"Machine type must be 'e2-micro' (free tier), got '{machine_type}'"
                    )

            return mission_data

        except Exception as e:
            raise ValueError(f"LangChain chain invocation failed: {str(e)}")
