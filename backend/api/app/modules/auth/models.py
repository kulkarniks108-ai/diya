from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime


@dataclass(slots=True)
class DemoUser:
    id: str
    email: str
    password_hash: str
    roles: list[str]


@dataclass(slots=True)
class SessionRecord:
    session_id: str
    user_id: str
    refresh_token: str
    token_version: int
    revoked_at: datetime | None = None
