"""Challenge routes — P4 owned."""
from datetime import datetime, timedelta, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.config import GCP_PROJECT_ID
from app.dependencies import get_db
from app.dependencies.auth import get_current_user
from app.models.challenge_sessions import ChallengeSession
from app.models.environments import Environment
from app.challenges.schemas import (
    StartChallengeRequest,
    ChallengeSessionResponse,
    EnvironmentResponse,
)
from app.challenges.service import ChallengeService

router = APIRouter(prefix="/challenges", tags=["challenges"])


@router.post("/start")
async def start_challenge(
    request: StartChallengeRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    POST /challenges/start

    Start a challenge for the authenticated user.

    Request body:
    {
        "mission_id": "<uuid>"
    }

    Response:
    {
        "success": true,
        "data": {
            "session": ChallengeSessionSchema,
            "environment": EnvironmentSchema
        }
    }
    """
    try:
        # Load mission from database
        mission = ChallengeService.get_mission(db, request.mission_id)
        if not mission:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={
                    "success": False,
                    "error": {"code": "MISSION_NOT_FOUND", "message": "Mission not found"}
                }
            )

        # Extract provisioning parameters from mission
        provisioning_params = ChallengeService.extract_provisioning_params(mission)
        if not provisioning_params:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={
                    "success": False,
                    "error": {"code": "NO_COMPUTE_CRITERIA", "message": "Mission has no compute resources"}
                }
            )

        # Create challenge session (before provisioning)
        session = ChallengeSession(
            session_id=uuid4(),
            user_id=current_user.user_id,
            mission_id=request.mission_id,
            status="ACTIVE",
            started_at=datetime.now(timezone.utc),
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=mission.time_limit_minutes),
        )
        db.add(session)
        db.flush()  # Get session_id without committing

        # Create environment record (before provisioning)
        environment = Environment(
            env_id=uuid4(),
            session_id=session.session_id,
            gcp_project_id=GCP_PROJECT_ID,
            scoped_sa_email=current_user.email,
            # The DB schema currently caps resource_prefix at VARCHAR(20).
            resource_prefix=f"lab-{str(session.session_id)[:8]}-{str(current_user.user_id)[:4]}",
            status="PROVISIONING",
            expires_at=session.expires_at,
        )
        db.add(environment)

        gcp_result = None
        try:
            # Provision GCP environment
            gcp_result = ChallengeService.provision_gcp_environment(
                user_email=current_user.email,
                provisioning_params=provisioning_params
            )

            # Update environment with VM details BEFORE commit
            environment.vm_name = gcp_result["vm_name"]
            environment.zone = gcp_result["zone"]
            environment.status = "READY"

            # Commit both session and environment to database
            db.commit()
            db.refresh(session)
            db.refresh(environment)

            # Schedule cleanup after time limit (only if commit succeeded)
            ChallengeService.schedule_cleanup(
                user_email=current_user.email,
                vm_name=gcp_result["vm_name"],
                zone=gcp_result["zone"],
                time_limit_minutes=mission.time_limit_minutes,
            )

        except Exception as e:
            # Rollback on any failure (including provisioning failure)
            db.rollback()
            if gcp_result and gcp_result.get("vm_name") and gcp_result.get("zone"):
                try:
                    ChallengeService.cleanup_environment(
                        user_email=current_user.email,
                        vm_name=gcp_result["vm_name"],
                        zone=gcp_result["zone"],
                    )
                except Exception as cleanup_error:
                    print(f"[ROLLBACK-CLEANUP-ERROR] {cleanup_error}")
            # Cleanup will be handled by expires_at if VM was created
            print(f"[ROLLBACK] Challenge start failed, rolling back: {str(e)}")
            raise

        # Build response
        session_response = ChallengeSessionResponse(
            session_id=session.session_id,
            user_id=session.user_id,
            mission_id=session.mission_id,
            status=session.status,
            started_at=session.started_at,
            completed_at=session.completed_at,
            expires_at=session.expires_at,
            score=session.score,
            created_at=session.created_at,
        )

        environment_response = EnvironmentResponse(
            env_id=environment.env_id,
            session_id=environment.session_id,
            gcp_project_id=environment.gcp_project_id,
            resource_prefix=environment.resource_prefix,
            status=environment.status,
            expires_at=environment.expires_at,
            created_at=environment.created_at,
        )

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "success": True,
                "data": {
                    "session": session_response.model_dump(mode="json"),
                    "environment": environment_response.model_dump(mode="json"),
                    "gcp_console_url": gcp_result["gcp_console_url"],
                }
            }
        )

    except FileNotFoundError as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "error": {"code": "GCP_CONFIG_ERROR", "message": str(e)}
            }
        )
    except Exception as e:
        print(f"[ERROR] Challenge start failed: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "error": {"code": "PROVISION_ERROR", "message": str(e)}
            }
        )


@router.get("/{session_id}/status")
async def get_challenge_status(
    session_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    GET /challenges/{session_id}/status

    Get current status of a challenge session.

    Path parameters:
    - session_id: UUID of the session

    Response:
    {
        "success": true,
        "data": {
            "session": ChallengeSessionSchema,
            "environment": EnvironmentSchema
        }
    }
    """
    try:
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

        # Verify authorization
        if session.user_id != current_user.user_id:
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={
                    "success": False,
                    "error": {"code": "FORBIDDEN", "message": "Access denied"}
                }
            )

        environment = db.query(Environment).filter(
            Environment.session_id == session.session_id
        ).first()

        if not environment:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={
                    "success": False,
                    "error": {"code": "ENVIRONMENT_NOT_FOUND", "message": "Environment not found"}
                }
            )

        session_response = ChallengeSessionResponse(
            session_id=session.session_id,
            user_id=session.user_id,
            mission_id=session.mission_id,
            status=session.status,
            started_at=session.started_at,
            completed_at=session.completed_at,
            expires_at=session.expires_at,
            score=session.score,
            created_at=session.created_at,
        )

        environment_response = EnvironmentResponse(
            env_id=environment.env_id,
            session_id=environment.session_id,
            gcp_project_id=environment.gcp_project_id,
            resource_prefix=environment.resource_prefix,
            status=environment.status,
            expires_at=environment.expires_at,
            created_at=environment.created_at,
        )

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "success": True,
                "data": {
                    "session": session_response.model_dump(mode="json"),
                    "environment": environment_response.model_dump(mode="json"),
                }
            }
        )

    except Exception as e:
        print(f"[ERROR] Get status failed: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "error": {"code": "INTERNAL_ERROR", "message": str(e)}
            }
        )


@router.post("/{session_id}/stop")
async def stop_challenge(
    session_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    POST /challenges/{session_id}/stop

    Stop a challenge and clean up resources.

    Path parameters:
    - session_id: UUID of the session to stop

    Response:
    {
        "success": true,
        "data": {
            "session": ChallengeSessionSchema
        }
    }
    """
    try:
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

        # Verify authorization
        if session.user_id != current_user.user_id:
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={
                    "success": False,
                    "error": {"code": "FORBIDDEN", "message": "Access denied"}
                }
            )

        # Get environment to retrieve VM details
        environment = db.query(Environment).filter(
            Environment.session_id == session.session_id
        ).first()

        if environment:
            # Delete VM if details are available
            if environment.vm_name and environment.zone:
                try:
                    ChallengeService.cleanup_environment(
                        user_email=current_user.email,
                        vm_name=environment.vm_name,
                        zone=environment.zone,
                    )
                except Exception as e:
                    print(f"[STOP-ERROR] Cleanup failed for {environment.vm_name}: {str(e)}")
                    # Continue anyway — mark as destroyed even if cleanup fails

            environment.status = "DESTROYED"
            environment.destroyed_at = datetime.now(timezone.utc)

        # Update session status
        session.status = "COMPLETED"
        session.completed_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(session)

        session_response = ChallengeSessionResponse(
            session_id=session.session_id,
            user_id=session.user_id,
            mission_id=session.mission_id,
            status=session.status,
            started_at=session.started_at,
            completed_at=session.completed_at,
            expires_at=session.expires_at,
            score=session.score,
            created_at=session.created_at,
        )

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "success": True,
                "data": {
                    "session": session_response.model_dump(mode="json"),
                }
            }
        )

    except Exception as e:
        print(f"[ERROR] Stop challenge failed: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "error": {"code": "INTERNAL_ERROR", "message": str(e)}
            }
        )


# ── Admin routes ────────────────────────────────────────────────────────────

@router.get("/admin/sessions")
async def admin_list_sessions(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    GET /challenges/admin/sessions

    Admin only: list all active challenge sessions and their environments.
    """
    if current_user.role not in ("ADMIN", "admin"):
        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content={"success": False, "error": {"code": "FORBIDDEN", "message": "Admin only"}}
        )

    sessions = db.query(ChallengeSession).filter(
        ChallengeSession.status == "ACTIVE"
    ).order_by(ChallengeSession.started_at.desc()).all()

    result = []
    for s in sessions:
        env = db.query(Environment).filter(Environment.session_id == s.session_id).first()
        result.append({
            "session_id": str(s.session_id),
            "user_id": str(s.user_id),
            "mission_id": str(s.mission_id),
            "status": s.status,
            "started_at": s.started_at.isoformat() if s.started_at else None,
            "expires_at": s.expires_at.isoformat() if s.expires_at else None,
            "environment": {
                "env_id": str(env.env_id),
                "vm_name": env.vm_name,
                "zone": env.zone,
                "status": env.status,
                "gcp_project_id": env.gcp_project_id,
            } if env else None,
        })

    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={"success": True, "data": result}
    )


@router.post("/admin/sessions/{session_id}/clear")
async def admin_clear_session(
    session_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    POST /challenges/admin/sessions/{session_id}/clear

    Admin only: force-terminate a session and clean up GCP resources.
    """
    if current_user.role not in ("ADMIN", "admin"):
        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content={"success": False, "error": {"code": "FORBIDDEN", "message": "Admin only"}}
        )

    session = db.query(ChallengeSession).filter(
        ChallengeSession.session_id == session_id
    ).first()

    if not session:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"success": False, "error": {"code": "SESSION_NOT_FOUND", "message": "Session not found"}}
        )

    environment = db.query(Environment).filter(
        Environment.session_id == session.session_id
    ).first()

    # Look up user email for IAM cleanup
    from app.models.users import User
    user = db.query(User).filter(User.user_id == session.user_id).first()
    user_email = user.email if user else None

    cleanup_errors = []
    if environment and environment.vm_name and environment.zone and user_email:
        try:
            ChallengeService.cleanup_environment(
                user_email=user_email,
                vm_name=environment.vm_name,
                zone=environment.zone,
            )
        except Exception as e:
            cleanup_errors.append(str(e))
            print(f"[ADMIN-CLEAR] Cleanup error: {e}")

    if environment:
        environment.status = "DESTROYED"
        environment.destroyed_at = datetime.now(timezone.utc)

    session.status = "EXPIRED"
    session.completed_at = datetime.now(timezone.utc)
    db.commit()

    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "data": {
                "session_id": session_id,
                "status": "EXPIRED",
                "cleanup_errors": cleanup_errors,
            }
        }
    )
