from __future__ import annotations

from fastapi import HTTPException, status
from jose import JWTError

from app.config.security import create_access_token, decode_access_token, verify_password
from app.config.settings import settings
from app.schemas import LoginRequest, LogoutRequest, MeResponse, RefreshRequest, TokenPair, UserSummary

from .models import DemoUser, SessionRecord
from .repository import AuthRepository, auth_repository


class AuthService:
    def __init__(self, repository: AuthRepository) -> None:
        self._repository = repository

    def seed_demo_users(self) -> None:
        self._repository.seed_demo_users()

    def login(self, request: LoginRequest) -> TokenPair:
        user = self._repository.get_user_by_email(request.email)
        if user is None or not verify_password(request.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"code": "AUTH.CREDENTIALS.INVALID", "message": "Invalid credentials"},
            )

        session = self._repository.create_session(user)
        return self._build_token_pair(user, session)

    def refresh(self, request: RefreshRequest) -> TokenPair:
        session = self._repository.get_session_by_refresh_token(request.refresh_token)
        if session is None or session.revoked_at is not None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"code": "AUTH.REFRESH.TOKEN.REUSE", "message": "Refresh token is invalid or reused"},
            )

        user = self._require_user(session.user_id)
        rotated_session = self._repository.rotate_session(session)
        return self._build_token_pair(user, rotated_session)

    def logout(self, request: LogoutRequest | None, token: str | None = None) -> None:
        if request and request.session_id:
            self._repository.revoke_session_by_id(request.session_id)
            return

        if token is None:
            return

        try:
            payload = decode_access_token(token)
        except JWTError as error:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"code": "AUTH.TOKEN.INVALID", "message": str(error)},
            ) from error

        self._repository.revoke_session_by_id(payload["session_id"])

    def me(self, token: str) -> MeResponse:
        try:
            payload = decode_access_token(token)
        except JWTError as error:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"code": "AUTH.TOKEN.INVALID", "message": str(error)},
            ) from error

        session = self._repository.get_session_by_id(payload["session_id"])
        user = self._require_user(payload["sub"])

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

    def _require_user(self, user_id: str) -> DemoUser:
        user = self._repository.get_user_by_id(user_id)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "AUTH.USER.NOT_FOUND", "message": "User not found"},
            )
        return user


auth_service = AuthService(auth_repository)
