from uuid import UUID

from sqlalchemy import JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class SafetyEvent(Base):
    """
    Represents a safety/SOS event from the mobile app.

    Enforces strict idempotency via idempotency_key.
    """

    __tablename__ = "safety_events"

    user_id: Mapped[UUID] = mapped_column(index=True)
    event_type: Mapped[str] = mapped_column(String(50), default="SOS")
    payload: Mapped[dict] = mapped_column(JSON)
    trace_id: Mapped[str] = mapped_column(String(100), index=True)
    idempotency_key: Mapped[str | None] = mapped_column(String(100), unique=True, index=True)
