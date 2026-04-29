from __future__ import annotations

from fastapi import APIRouter, Depends, Header, HTTPException, status
from jose import JWTError

from app.api.deps import get_bearer_token
from app.config.security import decode_access_token

from .repository import InMemorySafetyEventRepository
from .service import SafetyEventService

# Global repository and service instances
_repository = InMemorySafetyEventRepository()
safety_service = SafetyEventService(_repository)

router = APIRouter(prefix="/safety", tags=["safety"])


class SafetyEventRequest:
    """Request model for creating a safety event."""

    def __init__(self, type: str, payload: dict):
        self.type = type
        self.payload = payload


class SafetyEventCreateResponse:
    """Response model for creating a safety event."""

    def __init__(self, id: str, trace_id: str, timestamp: str):
        self.id = id
        self.trace_id = trace_id
        self.timestamp = timestamp

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "trace_id": self.trace_id,
            "timestamp": self.timestamp,
        }


@router.post("/events")
def create_safety_event(
    type: str,
    payload: dict,
    token: str = Depends(get_bearer_token),
    idempotency_key: str | None = Header(default=None),
) -> dict:
    """
    Create a safety event (e.g., SOS).

    Requires:
    - Authorization header with valid access token
    - Idempotency-Key header (for idempotent processing)

    Returns:
    - {success: true, data: {id, trace_id, timestamp}, trace_id}
    """
    # Decode token to get user_id
    try:
        payload_decoded = decode_access_token(token)
    except JWTError as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "AUTH.TOKEN.INVALID", "message": str(error)},
        ) from error

    user_id = payload_decoded.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "AUTH.TOKEN.INVALID", "message": "User ID not found in token"},
        )

    # Create safety event
    event = safety_service.create_safety_event(
        user_id=user_id,
        event_type=type,
        payload=payload,
        idempotency_key=idempotency_key,
    )

    # Return success response with envelope
    return {
        "success": True,
        "data": {
            "id": event.id,
            "trace_id": event.trace_id,
            "timestamp": event.created_at.isoformat(),
        },
        "trace_id": event.trace_id,
    }
