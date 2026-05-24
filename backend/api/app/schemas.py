from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, EmailStr, field_validator


class UserSummary(BaseModel):
    id: str
    email: str
    roles: list[str] = Field(default_factory=list)


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    roles: list[str] = Field(default_factory=lambda: ["blind"])

    @field_validator("roles")
    @classmethod
    def validate_roles(cls, roles: list[str]) -> list[str]:
        allowed = {"blind", "family"}
        if not roles:
            return ["blind"]
        invalid = [role for role in roles if role not in allowed]
        if invalid:
            raise ValueError("Unsupported role(s): " + ", ".join(invalid))
        return roles


class RefreshRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    session_id: str | None = None


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    expires_in: int
    session_id: str
    token_version: int
    user: UserSummary


class MeResponse(BaseModel):
    user: UserSummary
    session_id: str
    token_version: int


class AccessoryEventInput(BaseModel):
    event_id: str
    source_device_id: str
    accessory: Literal["cane", "goggle", "wearable"]
    event_type: Literal["safety", "assist", "command", "telemetry"]
    priority: int = 0
    trusted: bool = False
    received_at: datetime
    payload: dict = Field(default_factory=dict)


class ArbitrationRequest(BaseModel):
    events: list[AccessoryEventInput]


class ArbitrationOutcome(BaseModel):
    winner_event_id: str | None = None
    winner_source_device_id: str | None = None
    reason: str
    suppressed_event_ids: list[str] = Field(default_factory=list)


class ArbitrationResponse(BaseModel):
    outcome: ArbitrationOutcome
    trace_id: str


class SafetyEventCreateRequest(BaseModel):
    """Request schema for creating a safety event (SOS)."""
    type: str = Field(default="SOS")
    payload: dict = Field(default_factory=dict)
    idempotency_key: str | None = None
