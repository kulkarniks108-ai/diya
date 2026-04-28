from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from uuid import uuid4

from fastapi import HTTPException, status
from jose import JWTError

from app.config.security import create_access_token, decode_access_token, hash_password, verify_password
from app.config.settings import settings
from app.schemas import LoginRequest, LogoutRequest, MeResponse, RefreshRequest, TokenPair, UserSummary


@dataclass
class DemoUser:
    id: str
    email: str
    password_hash: str
    roles: list[str]


@dataclass
class SessionRecord:
    session_id: str
    user_id: str
    refresh_token: str
    token_version: int
    revoked_at: datetime | None = None


class AuthService:
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

    def login(self, request: LoginRequest) -> TokenPair:
        user = self._users.get(request.email)
        if user is None or not verify_password(request.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"code": "AUTH.CREDENTIALS.INVALID", "message": "Invalid credentials"},
            )

        session = self._create_session(user)
        return self._build_token_pair(user, session)

    def refresh(self, request: RefreshRequest) -> TokenPair:
        session_id = self._refresh_index.get(request.refresh_token)
        if session_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"code": "AUTH.REFRESH.TOKEN.REUSE", "message": "Refresh token is invalid or reused"},
            )

        session = self._sessions_by_id.get(session_id)
        if session is None or session.revoked_at is not None or session.refresh_token != request.refresh_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"code": "AUTH.REFRESH.TOKEN.REUSE", "message": "Refresh token is invalid or reused"},
            )

        user = self._get_user(session.user_id)
        rotated_session = self._rotate_session(session, user)
        return self._build_token_pair(user, rotated_session)

    def logout(self, request: LogoutRequest | None, token: str | None = None) -> None:
        if request and request.session_id:
            session = self._sessions_by_id.get(request.session_id)
            if session is not None:
                session.revoked_at = datetime.now(tz=UTC)
                self._refresh_index.pop(session.refresh_token, None)
            return

        if token is None:
            return

        payload = decode_access_token(token)
        session = self._sessions_by_id.get(payload["session_id"])
        if session is not None:
            session.revoked_at = datetime.now(tz=UTC)
            self._refresh_index.pop(session.refresh_token, None)

    def me(self, token: str) -> MeResponse:
        try:
            payload = decode_access_token(token)
        except JWTError as error:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"code": "AUTH.TOKEN.INVALID", "message": str(error)},
            ) from error

        session = self._sessions_by_id.get(payload["session_id"])
        user = self._get_user(payload["sub"])
        if session is None or session.revoked_at is not None or session.token_version != payload["token_version"]:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"code": "AUTH.TOKEN.EXPIRED", "message": "Access token expired"},
            )

        return MeResponse(
            user=UserSummary(id=user.id, email=user.email, roles=user.roles),
            session_id=session.session_id,
            token_version=session.token_version,
        )

    def _create_session(self, user: DemoUser) -> SessionRecord:
        session = SessionRecord(
            session_id=str(uuid4()),
            user_id=user.id,
            refresh_token=str(uuid4()),
            token_version=1,
        )
        self._sessions_by_id[session.session_id] = session
        self._refresh_index[session.refresh_token] = session.session_id
        return session

    def _rotate_session(self, session: SessionRecord, user: DemoUser) -> SessionRecord:
        self._refresh_index.pop(session.refresh_token, None)
        session.refresh_token = str(uuid4())
        session.token_version += 1
        self._refresh_index[session.refresh_token] = session.session_id
        self._sessions_by_id[session.session_id] = session
        return session

    def _build_token_pair(self, user: DemoUser, session: SessionRecord) -> TokenPair:
        access_token = create_access_token(
            {
                "sub": user.id,
                "uid": user.id,
                "roles": user.roles,
                "permissions": ["auth:read", "auth:write"],
                "session_id": session.session_id,
                "token_version": session.token_version,
            }
        )
        return TokenPair(
            access_token=access_token,
            refresh_token=session.refresh_token,
            expires_in=settings.auth.access_token_expire_minutes * 60,
            session_id=session.session_id,
            token_version=session.token_version,
            user=UserSummary(id=user.id, email=user.email, roles=user.roles),
        )

    def _get_user(self, user_id: str) -> DemoUser:
        for user in self._users.values():
            if user.id == user_id:
                return user
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "AUTH.USER.NOT_FOUND", "message": "User not found"},
        )


auth_service = AuthService()
