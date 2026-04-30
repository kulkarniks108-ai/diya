from __future__ import annotations

from uuid import UUID

from fastapi import HTTPException, status
from jose import JWTError

from app.config.security import create_access_token, decode_access_token, verify_password, hash_password
from app.config.settings import settings
from app.schemas import LoginRequest, RegisterRequest, LogoutRequest, MeResponse, RefreshRequest, TokenPair, UserSummary

from .models import AuthSession, User
from .repository import AuthRepository


class AuthService:
    def __init__(self, repository: AuthRepository) -> None:
        self._repository = repository

    async def seed_demo_users(self) -> None:
        await self._repository.seed_demo_users()

    async def login(self, request: LoginRequest) -> TokenPair:
        user = await self._repository.get_user_by_email(request.email)
        if user is None or not verify_password(request.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"code": "AUTH.CREDENTIALS.INVALID", "message": "Invalid credentials"},
            )

        session = await self._repository.create_session(user)
        return self._build_token_pair(user, session)

    async def register(self, request: RegisterRequest) -> TokenPair:
        existing_user = await self._repository.get_user_by_email(request.email)
        if existing_user is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "AUTH.EMAIL.EXISTS", "message": "Email already registered"},
            )
            
        password_hash = hash_password(request.password)
        user = await self._repository.create_user(request.email, password_hash, request.roles)
        session = await self._repository.create_session(user)
        
        return self._build_token_pair(user, session)

    async def refresh(self, request: RefreshRequest) -> TokenPair:
        session = await self._repository.get_session_by_refresh_token(request.refresh_token)
        if session is None or session.revoked_at is not None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"code": "AUTH.REFRESH.TOKEN.REUSE", "message": "Refresh token is invalid or reused"},
            )

        user = await self._require_user(session.user_id)
        rotated_session = await self._repository.rotate_session(session)
        return self._build_token_pair(user, rotated_session)

    async def logout(self, request: LogoutRequest | None, token: str | None = None) -> None:
        if request and request.session_id:
            await self._repository.revoke_session_by_id(UUID(request.session_id))
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

        await self._repository.revoke_session_by_id(UUID(payload["session_id"]))

    async def me(self, token: str) -> MeResponse:
        try:
            payload = decode_access_token(token)
        except JWTError as error:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"code": "AUTH.TOKEN.INVALID", "message": str(error)},
            ) from error

        session = await self._repository.get_session_by_id(UUID(payload["session_id"]))
        user = await self._require_user(UUID(payload["sub"]))

        if session is None or session.revoked_at is not None or session.token_version != payload["token_version"]:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"code": "AUTH.TOKEN.EXPIRED", "message": "Access token expired"},
            )

        return MeResponse(
            user=UserSummary(id=str(user.id), email=user.email, roles=user.roles),
            session_id=str(session.id),
            token_version=session.token_version,
        )

    def _build_token_pair(self, user: User, session: AuthSession) -> TokenPair:
        access_token = create_access_token(
            {
                "sub": str(user.id),
                "uid": str(user.id),
                "roles": user.roles,
                "permissions": ["auth:read", "auth:write"],
                "session_id": str(session.id),
                "token_version": session.token_version,
            }
        )
        return TokenPair(
            access_token=access_token,
            refresh_token=session.refresh_token,
            expires_in=settings.auth.access_token_expire_minutes * 60,
            session_id=str(session.id),
            token_version=session.token_version,
            user=UserSummary(id=str(user.id), email=user.email, roles=user.roles),
        )

    async def _require_user(self, user_id: UUID) -> User:
        user = await self._repository.get_user_by_id(user_id)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "AUTH.USER.NOT_FOUND", "message": "User not found"},
            )
        return user
