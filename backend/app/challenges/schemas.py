"""Pydantic schemas for challenges domain."""
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field


class StartChallengeRequest(BaseModel):
    """Request to start a challenge."""
    mission_id: str = Field(..., description="UUID of the mission to start")


class ChallengeSessionResponse(BaseModel):
    """Challenge session response schema."""
    session_id: UUID = Field(..., description="Unique session identifier")
    user_id: UUID = Field(..., description="User attempting the challenge")
    mission_id: UUID = Field(..., description="Mission being challenged")
    status: str = Field(..., description="Current session status")
    started_at: datetime = Field(..., description="When challenge was started")
    completed_at: Optional[datetime] = Field(None, description="When challenge was completed")
    expires_at: Optional[datetime] = Field(None, description="When session expires")
    score: Optional[float] = Field(None, description="Challenge score (if evaluated)")
    created_at: datetime = Field(..., description="When session was created")

    class Config:
        from_attributes = True


class EnvironmentResponse(BaseModel):
    """Environment response schema."""
    env_id: UUID = Field(..., description="Environment ID")
    session_id: UUID = Field(..., description="Associated session ID")
    gcp_project_id: str = Field(..., description="GCP project ID")
    resource_prefix: str = Field(..., description="Resource prefix for naming")
    status: str = Field(..., description="Environment status")
    expires_at: datetime = Field(..., description="Environment expiration time")
    created_at: datetime = Field(..., description="Creation timestamp")

    class Config:
        from_attributes = True


class StartChallengeResponse(BaseModel):
    """Response when starting a challenge."""
    success: bool = Field(..., description="Whether operation succeeded")
    data: Optional[dict] = Field(None, description="Response data containing session and environment")

    class Config:
        from_attributes = True
