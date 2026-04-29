from __future__ import annotations

from fastapi import APIRouter, Depends, Header

from app.api.deps import get_bearer_token
from app.schemas import LoginRequest, LogoutRequest, MeResponse, RefreshRequest, TokenPair

from .service import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login")
def login(request: LoginRequest, x_trace_id: str | None = Header(default=None)) -> dict:
    token_pair = auth_service.login(request)
    return {
        "success": True,
        "data": {
            "access_token": token_pair.access_token,
            "refresh_token": token_pair.refresh_token,
            "expires_in": token_pair.expires_in,
            "session_id": token_pair.session_id,
            "token_version": token_pair.token_version,
            "user": {
                "id": token_pair.user.id,
                "email": token_pair.user.email,
                "roles": token_pair.user.roles,
            },
        },
        "trace_id": x_trace_id or "trace-local-demo",
    }


@router.post("/refresh")
def refresh(request: RefreshRequest, x_trace_id: str | None = Header(default=None)) -> dict:
    token_pair = auth_service.refresh(request)
    return {
        "success": True,
        "data": {
            "access_token": token_pair.access_token,
            "refresh_token": token_pair.refresh_token,
            "expires_in": token_pair.expires_in,
            "session_id": token_pair.session_id,
            "token_version": token_pair.token_version,
            "user": {
                "id": token_pair.user.id,
                "email": token_pair.user.email,
                "roles": token_pair.user.roles,
            },
        },
        "trace_id": x_trace_id or "trace-local-demo",
    }


@router.post("/logout")
def logout(request: LogoutRequest | None = None, token: str = Depends(get_bearer_token), x_trace_id: str | None = Header(default=None)) -> dict:
    auth_service.logout(request, token)
    return {
        "success": True,
        "data": {"status": "logged_out"},
        "trace_id": x_trace_id or "trace-local-demo",
    }


@router.get("/me")
def me(token: str = Depends(get_bearer_token), x_trace_id: str | None = Header(default=None)) -> dict:
    me_response = auth_service.me(token)
    return {
        "success": True,
        "data": {
            "user": {
                "id": me_response.user.id,
                "email": me_response.user.email,
                "roles": me_response.user.roles,
            },
            "session_id": me_response.session_id,
            "token_version": me_response.token_version,
        },
        "trace_id": x_trace_id or "trace-local-demo",
    }
