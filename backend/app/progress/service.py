"""Progress projections over authoritative challenge-session data."""

from __future__ import annotations

from datetime import datetime
from typing import Protocol, Sequence
from uuid import UUID

from pydantic import BaseModel


class ChallengeSessionView(Protocol):
    session_id: UUID
    user_id: UUID
    status: str
    score: float | None
    completed_at: datetime | None
    mission_title: str


class ChallengeSessionReader(Protocol):
    def list_for_user(self, user_id: UUID) -> Sequence[ChallengeSessionView]: ...


class ProgressStats(BaseModel):
    total_challenges: int
    completed_challenges: int
    average_score: float
    success_rate: float


class ProgressHistoryItem(BaseModel):
    session_id: UUID
    mission_title: str
    score: float | None
    completed_at: datetime | None


class ProgressService:
    """Build read models without owning challenge or scoring state."""

    def __init__(self, sessions: ChallengeSessionReader) -> None:
        self._sessions = sessions

    def get_stats(self, user_id: UUID) -> ProgressStats:
        records = list(self._sessions.list_for_user(user_id))
        completed = [record for record in records if record.status == "COMPLETED"]
        scores = [record.score for record in completed if record.score is not None]
        total = len(records)
        return ProgressStats(
            total_challenges=total,
            completed_challenges=len(completed),
            average_score=sum(scores) / len(scores) if scores else 0,
            success_rate=(len(completed) / total * 100) if total else 0,
        )

    def get_history(self, user_id: UUID) -> list[ProgressHistoryItem]:
        records = self._sessions.list_for_user(user_id)
        history = [
            ProgressHistoryItem(
                session_id=record.session_id,
                mission_title=record.mission_title,
                score=record.score,
                completed_at=record.completed_at,
            )
            for record in records
            if record.status == "COMPLETED"
        ]
        return sorted(
            history,
            key=lambda item: (
                item.completed_at.timestamp()
                if item.completed_at is not None
                else float("-inf")
            ),
            reverse=True,
        )
