from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.deps import get_bearer_token
from app.schemas import LoginRequest, LogoutRequest, MeResponse, RefreshRequest, TokenPair

from .service import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenPair)
def login(request: LoginRequest) -> TokenPair:
    return auth_service.login(request)


@router.post("/refresh", response_model=TokenPair)
def refresh(request: RefreshRequest) -> TokenPair:
    return auth_service.refresh(request)


@router.post("/logout")
def logout(request: LogoutRequest | None = None, token: str = Depends(get_bearer_token)) -> dict[str, str]:
    auth_service.logout(request, token)
    return {"status": "logged_out"}


@router.get("/me", response_model=MeResponse)
def me(token: str = Depends(get_bearer_token)) -> MeResponse:
    return auth_service.me(token)
