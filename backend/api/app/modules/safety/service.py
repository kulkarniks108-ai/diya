from __future__ import annotations

from uuid import UUID

from .models import SafetyEvent
from .repository import SafetyEventRepository


class SafetyEventService:
    """Service layer for safety operations."""

    def __init__(self, repository: SafetyEventRepository) -> None:
        self._repository = repository

    async def create_safety_event(
        self,
        user_id: str,
        event_type: str,
        payload: dict,
        trace_id: str,
        idempotency_key: str | None = None,
    ) -> SafetyEvent:
        """
        Create a safety event.

        If idempotency_key is provided and a matching event already exists,
        return the existing event (idempotent behavior).
        """
        return await self._repository.create_event(
            user_id=UUID(user_id),
            event_type=event_type,
            payload=payload,
            trace_id=trace_id,
            idempotency_key=idempotency_key,
        )

    async def get_events_by_user(self, user_id: str, limit: int = 100) -> list[SafetyEvent]:
        """Retrieve all safety events for a user."""
        return await self._repository.get_events_by_user(UUID(user_id), limit)
