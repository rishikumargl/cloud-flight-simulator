"""FastAPI routes for scenarios domain — P3 owned."""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import Optional

from backend.app.dependencies import get_current_user, get_db
from backend.app.audit_dependency import audit_service

from .service import ScenarioService
from .schemas import MissionSchema

router = APIRouter(prefix="/scenarios", tags=["scenarios"])


def get_scenario_service(llm=Depends(lambda: None)) -> ScenarioService:
    """Dependency to inject ScenarioService with LLM."""
    # In production, llm would be injected from config
    return ScenarioService(llm=llm)


@router.post("/generate")
async def generate_scenario(
    request: dict,
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
    track = request.get("track")
    difficulty = request.get("difficulty")

    if not track or not difficulty:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content=error_response("MISSING_FIELDS", "Missing track or difficulty"),
        )

    try:
        # Generate mission via scenario-generation-v1 chain
        mission = scenario_service.generate(
            db=db,
            user_id=current_user.user_id,
            track=track,
            difficulty=difficulty,
            tags=[track, difficulty],
            metadata={
                "user_id": str(current_user.user_id),
                "project": "cloud-flight-simulator",
            },
        )

        # Write audit event after successful generation
        audit_service.write_event(
            db=db,
            event_type="MISSION_GENERATED",
            source="SCENARIO_SERVICE",
            user_id=current_user.user_id,
            payload={"mission_id": str(mission.mission_id)},
        )

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=success_response(mission.model_dump(mode="json")),
        )

    except ValueError as e:
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=error_response("VALIDATION_ERROR", str(e)),
        )
    except Exception as e:
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

    Path parameters:
    - mission_id: UUID of the mission

    Response: {"success": true, "data": MissionSchema}
    Authorization: User must have access to this mission
    """
    mission = scenario_service.get_mission(db, mission_id)

    if not mission:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content=error_response("NOT_FOUND", "Mission not found"),
        )

    # TODO: Implement authorization check
    # For now, assume all authenticated users can access all missions
    # In production, verify user has completed or is assigned this mission

    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content=success_response(mission.model_dump(mode="json")),
    )


def success_response(data):
    """Format successful response per CLAUDE.md contract."""
    return {"success": True, "data": data}


def error_response(code: str, message: str):
    """Format error response per CLAUDE.md contract."""
    return {"success": False, "error": {"code": code, "message": message}}
