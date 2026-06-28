"""FastAPI routes for scenarios domain — P3 owned."""

from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.dependencies.auth import get_current_user
from app.dependencies import get_db

from .service import ScenarioService
from .models import Mission
from .schemas import MissionSchema, GenerateScenarioRequest

router = APIRouter(prefix="/scenarios", tags=["scenarios"])


def get_scenario_service() -> ScenarioService:
    """Dependency to provide ScenarioService."""
    return ScenarioService()


@router.post("/generate")
async def generate_scenario(
    request: GenerateScenarioRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
    scenario_service: ScenarioService = Depends(get_scenario_service),
):
    """
    POST /scenarios/generate

    Generate a new mission for the authenticated user.

    Request body:
    {
        "track": "COMPUTE",
        "difficulty": "BEGINNER"
    }

    Response: {"success": true, "data": MissionSchema}
    """
    track = request.track
    difficulty = request.difficulty

    if not track or not difficulty:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content=error_response("MISSING_FIELDS", "Missing track or difficulty"),
        )

    # Frontend track/difficulty ids are lowercase; normalize at the API boundary
    # so the generation service receives the uppercase contract values it expects.
    track = str(track).strip().upper()
    difficulty = str(difficulty).strip().upper()

    try:
        # Generate mission via scenario-generation-v1 LangChain chain
        mission = scenario_service.generate(
            db=db,
            user_id=current_user.user_id,
            track=track,
            difficulty=difficulty,
        )

        # Persist mission to database
        mission_obj = Mission(
            mission_id=mission.mission_id,
            track=mission.track,
            difficulty=mission.difficulty,
            title=mission.title,
            business_context=mission.business_context,
            objectives=mission.objectives,
            success_criteria=[c.model_dump() for c in mission.success_criteria],
            time_limit_minutes=mission.time_limit_minutes,
            generated_by=mission.generated_by,
            created_at=mission.created_at,
        )
        db.add(mission_obj)
        db.commit()
        db.refresh(mission_obj)

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=success_response(mission.model_dump(mode="json")),
        )

    except ValueError as e:
        db.rollback()
        print(f"[VALIDATION_ERROR] {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=error_response("VALIDATION_ERROR", str(e)),
        )
    except Exception as e:
        db.rollback()
        print(f"[ERROR] generate_scenario failed: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=error_response("INTERNAL_ERROR", "Failed to generate scenario"),
        )


@router.get("/{mission_id}")
async def get_scenario(
    mission_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
    scenario_service: ScenarioService = Depends(get_scenario_service),
):
    """
    GET /scenarios/{mission_id}

    Retrieve a mission by mission_id.
    """
    mission = scenario_service.get_mission(db, mission_id)

    if not mission:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content=error_response("NOT_FOUND", "Mission not found"),
        )

    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content=success_response(mission.model_dump(mode="json")),
    )


def success_response(data):
    """Format successful response per contract."""
    return {"success": True, "data": data}


def error_response(code: str, message: str):
    """Format error response per contract."""
    return {"success": False, "error": {"code": code, "message": message}}
