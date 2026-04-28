from __future__ import annotations

from datetime import UTC, datetime
from typing import Protocol
from uuid import uuid4

from app.config.security import hash_password

from .models import DemoUser, SessionRecord


class AuthRepository(Protocol):
    def seed_demo_users(self) -> None: ...

    def get_user_by_email(self, email: str) -> DemoUser | None: ...

    def get_user_by_id(self, user_id: str) -> DemoUser | None: ...

    def create_session(self, user: DemoUser) -> SessionRecord: ...

    def get_session_by_id(self, session_id: str) -> SessionRecord | None: ...

    def get_session_by_refresh_token(self, refresh_token: str) -> SessionRecord | None: ...

    def rotate_session(self, session: SessionRecord) -> SessionRecord: ...

    def revoke_session_by_id(self, session_id: str) -> None: ...


class InMemoryAuthRepository:
    def __init__(self) -> None:
        self._users: dict[str, DemoUser] = {}
        self._sessions_by_id: dict[str, SessionRecord] = {}
        self._refresh_index: dict[str, str] = {}
        self._demo_seeded = False

    def seed_demo_users(self) -> None:
        if self._demo_seeded:
            return

        self._users = {
            "blind@example.com": DemoUser(
                id="user-blind-001",
                email="blind@example.com",
                password_hash=hash_password("2ndeye-demo"),
                roles=["blind"],
            ),
            "family@example.com": DemoUser(
                id="user-family-001",
                email="family@example.com",
                password_hash=hash_password("2ndeye-demo"),
                roles=["family"],
            ),
        }
        self._demo_seeded = True

    def get_user_by_email(self, email: str) -> DemoUser | None:
        return self._users.get(email)

    def get_user_by_id(self, user_id: str) -> DemoUser | None:
        for user in self._users.values():
            if user.id == user_id:
                return user
        return None

    def create_session(self, user: DemoUser) -> SessionRecord:
        session = SessionRecord(
            session_id=str(uuid4()),
            user_id=user.id,
            refresh_token=str(uuid4()),
            token_version=1,
        )
        self._sessions_by_id[session.session_id] = session
        self._refresh_index[session.refresh_token] = session.session_id
        return session

    def get_session_by_id(self, session_id: str) -> SessionRecord | None:
        return self._sessions_by_id.get(session_id)

    def get_session_by_refresh_token(self, refresh_token: str) -> SessionRecord | None:
        session_id = self._refresh_index.get(refresh_token)
        if session_id is None:
            return None
        return self._sessions_by_id.get(session_id)

    def rotate_session(self, session: SessionRecord) -> SessionRecord:
        self._refresh_index.pop(session.refresh_token, None)
        session.refresh_token = str(uuid4())
        session.token_version += 1
        self._refresh_index[session.refresh_token] = session.session_id
        self._sessions_by_id[session.session_id] = session
        return session

    def revoke_session_by_id(self, session_id: str) -> None:
        session = self._sessions_by_id.get(session_id)
        if session is None:
            return

        self._refresh_index.pop(session.refresh_token, None)
        session.revoked_at = datetime.now(tz=UTC)
        self._sessions_by_id[session_id] = session


auth_repository = InMemoryAuthRepository()
