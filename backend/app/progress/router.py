"""HTTP interface for learner progress read models."""

from uuid import UUID

from fastapi import APIRouter, Depends

from .service import ProgressHistoryItem, ProgressService, ProgressStats

router = APIRouter(prefix="/progress", tags=["progress"])


def get_progress_service() -> ProgressService:
    """Integration hook for P2/P4 once challenge persistence is available."""
    raise NotImplementedError("Configure the challenge-session reader dependency")


@router.get("/{user_id}/stats", response_model=ProgressStats)
def get_stats(
    user_id: UUID,
    service: ProgressService = Depends(get_progress_service),
) -> ProgressStats:
    return service.get_stats(user_id)


@router.get("/{user_id}/history", response_model=list[ProgressHistoryItem])
def get_history(
    user_id: UUID,
    service: ProgressService = Depends(get_progress_service),
) -> list[ProgressHistoryItem]:
    return service.get_history(user_id)
