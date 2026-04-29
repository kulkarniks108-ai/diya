from __future__ import annotations

from typing import Protocol
from uuid import UUID, uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .models import SafetyEvent


class SafetyEventRepository(Protocol):
    """Repository protocol for safety events."""

    async def create_event(
        self,
        user_id: UUID,
        event_type: str,
        payload: dict,
        trace_id: str,
        idempotency_key: str | None = None,
    ) -> SafetyEvent: ...

    async def get_event_by_idempotency_key(self, idempotency_key: str) -> SafetyEvent | None: ...

    async def get_events_by_user(self, user_id: UUID, limit: int = 100) -> list[SafetyEvent]: ...


class SqlAlchemySafetyEventRepository:
    """PostgreSQL implementation of SafetyEventRepository using SQLAlchemy async."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create_event(
        self,
        user_id: UUID,
        event_type: str,
        payload: dict,
        trace_id: str,
        idempotency_key: str | None = None,
    ) -> SafetyEvent:
        # Check if we already have this idempotent request
        if idempotency_key:
            existing = await self.get_event_by_idempotency_key(idempotency_key)
            if existing:
                return existing

        # Create new event
        event = SafetyEvent(
            id=uuid4(),
            user_id=user_id,
            event_type=event_type,
            payload=payload,
            trace_id=trace_id,
            idempotency_key=idempotency_key,
        )

        self._session.add(event)
        await self._session.commit()
        await self._session.refresh(event)
        return event

    async def get_event_by_idempotency_key(self, idempotency_key: str) -> SafetyEvent | None:
        query = select(SafetyEvent).where(SafetyEvent.idempotency_key == idempotency_key)
        result = await self._session.execute(query)
        return result.scalar_one_or_none()

    async def get_events_by_user(self, user_id: UUID, limit: int = 100) -> list[SafetyEvent]:
        query = select(SafetyEvent).where(SafetyEvent.user_id == user_id).limit(limit)
        result = await self._session.execute(query)
        return list(result.scalars().all())


class InMemorySafetyEventRepository:
    """Legacy in-memory repository for tests/prototyping (now async)."""

    def __init__(self) -> None:
        self._events: dict[UUID, SafetyEvent] = {}
        self._idempotency_index: dict[str, UUID] = {}  # idempotency_key -> event_id

    async def create_event(
        self,
        user_id: UUID,
        event_type: str,
        payload: dict,
        trace_id: str,
        idempotency_key: str | None = None,
    ) -> SafetyEvent:
        # Check if we already have this idempotent request
        if idempotency_key and idempotency_key in self._idempotency_index:
            event_id = self._idempotency_index[idempotency_key]
            return self._events[event_id]

        # Create new event
        event = SafetyEvent(
            id=uuid4(),
            user_id=user_id,
            event_type=event_type,
            payload=payload,
            trace_id=trace_id,
            idempotency_key=idempotency_key,
        )

        self._events[event.id] = event
        if idempotency_key:
            self._idempotency_index[idempotency_key] = event.id

        return event

    async def get_event_by_idempotency_key(self, idempotency_key: str) -> SafetyEvent | None:
        event_id = self._idempotency_index.get(idempotency_key)
        if event_id is None:
            return None
        return self._events.get(event_id)

    async def get_events_by_user(self, user_id: UUID, limit: int = 100) -> list[SafetyEvent]:
        return [event for event in self._events.values() if event.user_id == user_id][:limit]
