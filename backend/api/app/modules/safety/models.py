from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Literal


@dataclass(slots=True)
class SafetyEvent:
    """Represents a safety/SOS event from the mobile app."""

    id: str
    user_id: str
    event_type: Literal["SOS"]
    payload: dict
    trace_id: str
    created_at: datetime
    idempotency_key: str | None = None
