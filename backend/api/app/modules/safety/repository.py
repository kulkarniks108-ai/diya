from __future__ import annotations

from datetime import UTC, datetime
from typing import Protocol
from uuid import uuid4

from .models import SafetyEvent


class SafetyEventRepository(Protocol):
    """Repository protocol for safety events."""

    def create_event(
        self,
        user_id: str,
        event_type: str,
        payload: dict,
        idempotency_key: str | None = None,
    ) -> SafetyEvent: ...

    def get_event_by_idempotency_key(self, idempotency_key: str) -> SafetyEvent | None: ...

    def get_events_by_user(self, user_id: str, limit: int = 100) -> list[SafetyEvent]: ...


class InMemorySafetyEventRepository:
    """In-memory implementation of SafetyEventRepository."""

    def __init__(self) -> None:
        self._events: dict[str, SafetyEvent] = {}
        self._idempotency_index: dict[str, str] = {}  # idempotency_key -> event_id

    def create_event(
        self,
        user_id: str,
        event_type: str,
        payload: dict,
        idempotency_key: str | None = None,
    ) -> SafetyEvent:
        # Check if we already have this idempotent request
        if idempotency_key and idempotency_key in self._idempotency_index:
            event_id = self._idempotency_index[idempotency_key]
            return self._events[event_id]

        # Create new event
        event_id = str(uuid4())
        trace_id = str(uuid4())
        event = SafetyEvent(
            id=event_id,
            user_id=user_id,
            event_type=event_type,
            payload=payload,
            trace_id=trace_id,
            created_at=datetime.now(tz=UTC),
            idempotency_key=idempotency_key,
        )

        self._events[event_id] = event
        if idempotency_key:
            self._idempotency_index[idempotency_key] = event_id

        return event

    def get_event_by_idempotency_key(self, idempotency_key: str) -> SafetyEvent | None:
        event_id = self._idempotency_index.get(idempotency_key)
        if event_id is None:
            return None
        return self._events.get(event_id)

    def get_events_by_user(self, user_id: str, limit: int = 100) -> list[SafetyEvent]:
        return [event for event in self._events.values() if event.user_id == user_id][:limit]
