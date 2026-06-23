"""Request and response schemas for authentication endpoints."""
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class UserResponse(BaseModel):
    """Schema for user response (from Keycloak JWT)."""
    user_id: UUID = Field(..., description="User ID (application-generated UUID)")
    email: str = Field(..., description="User email address")
    full_name: str = Field(..., description="User full name")
    role: str = Field(..., description="User role (LEARNER, ADMIN, or PLATFORM_ADMIN)")
    created_at: datetime = Field(..., description="User creation timestamp")

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "user_id": "550e8400-e29b-41d4-a716-446655440000",
                "email": "learner@example.com",
                "full_name": "John Doe",
                "role": "LEARNER",
                "created_at": "2026-06-22T12:00:00+00:00"
            }
        }
