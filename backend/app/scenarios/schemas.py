"""MissionSchema — contract produced by P3, consumed by P1, P4, P5."""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field, field_validator
from uuid import UUID
from datetime import datetime


class FaultConfiguration(BaseModel):
    """Fault configuration for incident-response missions.

    Defines a deliberate flaw injected into the provisioned VM.
    Learner must repair the fault to pass the criterion.
    """

    type: str = Field(
        ...,
        description="Fault type: STARTUP_SCRIPT_CRASH, CORRUPT_METADATA, MISCONFIGURED_TAGS"
    )
    payload: Optional[Dict[str, Any] | list | str] = Field(
        default=None,
        description="Fault-specific payload (dict for CORRUPT_METADATA, list for MISCONFIGURED_TAGS, str for STARTUP_SCRIPT_CRASH)"
    )
    description: Optional[str] = Field(
        default=None,
        description="Human-readable explanation of the fault"
    )

    @field_validator("type")
    def validate_type(cls, v):
        """Ensure fault type is supported."""
        allowed = ["STARTUP_SCRIPT_CRASH", "CORRUPT_METADATA", "MISCONFIGURED_TAGS"]
        if v not in allowed:
            raise ValueError(f"Unsupported fault type: {v}. Must be one of {allowed}")
        return v


class SuccessCriteria(BaseModel):
    """Individual success criterion for a mission."""

    criterion_id: str = Field(..., description="UUID for this criterion")
    description: str = Field(..., description="Human-readable description")
    resource_type: str = Field(
        ..., description="GCP resource type (e.g., compute_instance, storage_bucket)"
    )
    expected_state: Dict[str, Any] = Field(
        ...,
        description="Expected state with name_suffix ONLY, never full resource names",
    )
    weight: int = Field(..., description="Weight of this criterion (0-100)")
    fault_configuration: Optional[FaultConfiguration] = Field(
        default=None,
        description="Optional fault configuration for incident-response missions"
    )

    @field_validator("expected_state")
    def validate_no_full_names(cls, v):
        """Ensure expected_state uses name_suffix, never full resource names."""
        for key in v:
            if "name" in key.lower() and key != "name_suffix":
                raise ValueError(
                    f"Field '{key}' is forbidden. Use 'name_suffix' only, never full resource names."
                )
        return v


class MissionSchema(BaseModel):
    """MissionSchema — frozen contract. Produced by P3."""

    mission_id: str = Field(..., description="UUID of this mission")
    track: str = Field(
        ..., description="Track (COMPUTE, STORAGE, or generation-only track)"
    )
    difficulty: str = Field(
        ..., description="Difficulty level (BEGINNER, INTERMEDIATE, ADVANCED)"
    )
    title: str = Field(..., description="Mission title")
    business_context: str = Field(..., description="Business context for learner")
    objectives: List[str] = Field(..., description="List of objectives")
    success_criteria: List[SuccessCriteria] = Field(
        ..., description="Success criteria with weights"
    )
    time_limit_minutes: int = Field(..., description="Time limit in minutes")
    generated_by: str = Field(
        default="scenario-generator", description="Generator identifier"
    )
    created_at: datetime = Field(..., description="Timestamp of creation")

    @field_validator("track")
    def validate_track(cls, v):
        allowed_tracks = [
            "COMPUTE",
            "STORAGE",
        ]  # Add other generation-only tracks as needed
        if v not in allowed_tracks:
            raise ValueError(f"Invalid track: {v}. Must be one of {allowed_tracks}")
        return v

    @field_validator("difficulty")
    def validate_difficulty(cls, v):
        allowed = ["BEGINNER", "INTERMEDIATE", "ADVANCED"]
        if v not in allowed:
            raise ValueError(f"Invalid difficulty: {v}. Must be one of {allowed}")
        return v

    @field_validator("success_criteria")
    def validate_weights_sum(cls, v):
        """Validate that all weights sum to 100."""
        total_weight = sum(c.weight for c in v)
        if total_weight != 100:
            raise ValueError(f"Success criteria weights must sum to 100, got {total_weight}")
        return v

    @field_validator("generated_by")
    def validate_generated_by(cls, v):
        if v != "scenario-generator":
            raise ValueError(f"generated_by must be 'scenario-generator', got {v}")
        return v

    class Config:
        """Pydantic config."""

        json_schema_extra = {
            "example": {
                "mission_id": "123e4567-e89b-12d3-a456-426614174000",
                "track": "COMPUTE",
                "difficulty": "BEGINNER",
                "title": "Fix the Misconfigured Web Server",
                "business_context": "The production web server is unavailable due to incorrect metadata configuration. Investigate the GCP instance and restore the correct settings.",
                "objectives": ["Identify the metadata issue", "Restore the correct app_tier value"],
                "success_criteria": [
                    {
                        "criterion_id": "123e4567-e89b-12d3-a456-426614174001",
                        "description": "Repair the web server metadata",
                        "resource_type": "compute_instance",
                        "expected_state": {
                            "name_suffix": "web-01",
                            "machine_type": "e2-micro",
                            "metadata": {"app_tier": "frontend", "environment": "production"},
                            "status": "RUNNING"
                        },
                        "weight": 100,
                        "fault_configuration": {
                            "type": "CORRUPT_METADATA",
                            "payload": {"app_tier": "backend"},
                            "description": "Metadata has incorrect app_tier value"
                        }
                    }
                ],
                "time_limit_minutes": 45,
                "generated_by": "scenario-generator",
                "created_at": "2026-06-22T10:30:00Z",
            }
        }
