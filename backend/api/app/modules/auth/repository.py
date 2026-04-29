from __future__ import annotations

from datetime import UTC, datetime
from typing import Protocol
from uuid import UUID, uuid4

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.security import hash_password

from .models import AuthSession, User


class AuthRepository(Protocol):
    async def seed_demo_users(self) -> None: ...

    async def get_user_by_email(self, email: str) -> User | None: ...

    async def get_user_by_id(self, user_id: UUID) -> User | None: ...

    async def create_session(self, user: User) -> AuthSession: ...

    async def get_session_by_id(self, session_id: UUID) -> AuthSession | None: ...

    async def get_session_by_refresh_token(self, refresh_token: str) -> AuthSession | None: ...

    async def rotate_session(self, session: AuthSession) -> AuthSession: ...

    async def revoke_session_by_id(self, session_id: UUID) -> None: ...


class SqlAlchemyAuthRepository:
    """PostgreSQL implementation of AuthRepository using SQLAlchemy async."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def seed_demo_users(self) -> None:
        # Check if users already exist
        query = select(User).where(User.email.in_(["blind@example.com", "family@example.com"]))
        result = await self._session.execute(query)
        if result.scalars().first():
            return

        users = [
            User(
                id=uuid4(),
                email="blind@example.com",
                password_hash=hash_password("2ndeye-demo"),
                roles=["blind"],
            ),
            User(
                id=uuid4(),
                email="family@example.com",
                password_hash=hash_password("2ndeye-demo"),
                roles=["family"],
            ),
        ]
        self._session.add_all(users)
        await self._session.commit()

    async def get_user_by_email(self, email: str) -> User | None:
        query = select(User).where(User.email == email)
        result = await self._session.execute(query)
        return result.scalar_one_or_none()

    async def get_user_by_id(self, user_id: UUID) -> User | None:
        return await self._session.get(User, user_id)

    async def create_session(self, user: User) -> AuthSession:
        session = AuthSession(
            id=uuid4(),
            user_id=user.id,
            refresh_token=str(uuid4()),
            token_version=1,
        )
        self._session.add(session)
        await self._session.commit()
        await self._session.refresh(session)
        return session

    async def get_session_by_id(self, session_id: UUID) -> AuthSession | None:
        return await self._session.get(AuthSession, session_id)

    async def get_session_by_refresh_token(self, refresh_token: str) -> AuthSession | None:
        query = select(AuthSession).where(AuthSession.refresh_token == refresh_token)
        result = await self._session.execute(query)
        return result.scalar_one_or_none()

    async def rotate_session(self, session: AuthSession) -> AuthSession:
        session.refresh_token = str(uuid4())
        session.token_version += 1
        await self._session.commit()
        await self._session.refresh(session)
        return session

    async def revoke_session_by_id(self, session_id: UUID) -> None:
        stmt = (
            update(AuthSession)
            .where(AuthSession.id == session_id)
            .values(revoked_at=datetime.now(tz=UTC))
        )
        await self._session.execute(stmt)
        await self._session.commit()


class InMemoryAuthRepository:
    """Legacy in-memory repository for tests/prototyping (now async)."""

    def __init__(self) -> None:
        self._users: dict[str, User] = {}
        self._sessions_by_id: dict[UUID, AuthSession] = {}
        self._refresh_index: dict[str, UUID] = {}
        self._demo_seeded = False

    async def seed_demo_users(self) -> None:
        if self._demo_seeded:
            return

        self._users = {
            "blind@example.com": User(
                id=uuid4(),
                email="blind@example.com",
                password_hash=hash_password("2ndeye-demo"),
                roles=["blind"],
            ),
            "family@example.com": User(
                id=uuid4(),
                email="family@example.com",
                password_hash=hash_password("2ndeye-demo"),
                roles=["family"],
            ),
        }
        self._demo_seeded = True

    async def get_user_by_email(self, email: str) -> User | None:
        return self._users.get(email)

    async def get_user_by_id(self, user_id: UUID) -> User | None:
        for user in self._users.values():
            if user.id == user_id:
                return user
        return None

    async def create_session(self, user: User) -> AuthSession:
        session = AuthSession(
            id=uuid4(),
            user_id=user.id,
            refresh_token=str(uuid4()),
            token_version=1,
        )
        self._sessions_by_id[session.id] = session
        self._refresh_index[session.refresh_token] = session.id
        return session

    async def get_session_by_id(self, session_id: UUID) -> AuthSession | None:
        return self._sessions_by_id.get(session_id)

    async def get_session_by_refresh_token(self, refresh_token: str) -> AuthSession | None:
        session_id = self._refresh_index.get(refresh_token)
        if session_id is None:
            return None
        return self._sessions_by_id.get(session_id)

    async def rotate_session(self, session: AuthSession) -> AuthSession:
        self._refresh_index.pop(session.refresh_token, None)
        session.refresh_token = str(uuid4())
        session.token_version += 1
        self._refresh_index[session.refresh_token] = session.id
        self._sessions_by_id[session.id] = session
        return session

    async def revoke_session_by_id(self, session_id: UUID) -> None:
        session = self._sessions_by_id.get(session_id)
        if session is None:
            return

        self._refresh_index.pop(session.refresh_token, None)
        session.revoked_at = datetime.now(tz=UTC)
        self._sessions_by_id[session_id] = session


# Default instance (can be overridden in startup)
auth_repository = InMemoryAuthRepository()
