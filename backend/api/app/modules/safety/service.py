from __future__ import annotations

from .models import SafetyEvent
from .repository import SafetyEventRepository


class SafetyEventService:
    """Service layer for safety operations."""

    def __init__(self, repository: SafetyEventRepository) -> None:
        self._repository = repository

    def create_safety_event(
        self,
        user_id: str,
        event_type: str,
        payload: dict,
        idempotency_key: str | None = None,
    ) -> SafetyEvent:
        """
        Create a safety event.

        If idempotency_key is provided and a matching event already exists,
        return the existing event (idempotent behavior).
        """
        return self._repository.create_event(
            user_id=user_id,
            event_type=event_type,
            payload=payload,
            idempotency_key=idempotency_key,
        )

    def get_events_by_user(self, user_id: str, limit: int = 100) -> list[SafetyEvent]:
        """Retrieve all safety events for a user."""
        return self._repository.get_events_by_user(user_id, limit)
