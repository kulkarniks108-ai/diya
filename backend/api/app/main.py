from __future__ import annotations

import logging

from fastapi import Depends, FastAPI, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config.logging import setup_logging
from app.config.settings import settings
from app.schemas import ArbitrationRequest, ArbitrationResponse, LoginRequest, LogoutRequest, MeResponse, RefreshRequest, TokenPair
from app.services.accessory_arbitrator import accessory_event_arbitrator
from app.services.auth_service import auth_service

setup_logging()

logger = logging.getLogger(__name__)
security = HTTPBearer(auto_error=False)

app = FastAPI(title=settings.app.app_name)


def get_bearer_token(credentials: HTTPAuthorizationCredentials | None = Depends(security)) -> str:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "AUTH.TOKEN.MISSING", "message": "Bearer token is required"},
        )
    return credentials.credentials


@app.get("/")
def root() -> dict[str, str]:
    logger.info("Root endpoint called")
    return {"message": settings.app.app_name}


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": settings.app.app_name}


@app.post(f"{settings.app.api_v1_prefix}/auth/login", response_model=TokenPair)
def login(request: LoginRequest) -> TokenPair:
    return auth_service.login(request)


@app.post(f"{settings.app.api_v1_prefix}/auth/refresh", response_model=TokenPair)
def refresh(request: RefreshRequest) -> TokenPair:
    return auth_service.refresh(request)


@app.post(f"{settings.app.api_v1_prefix}/auth/logout")
def logout(request: LogoutRequest | None = None, token: str = Depends(get_bearer_token)) -> dict[str, str]:
    auth_service.logout(request, token)
    return {"status": "logged_out"}


@app.get(f"{settings.app.api_v1_prefix}/auth/me", response_model=MeResponse)
def me(token: str = Depends(get_bearer_token)) -> MeResponse:
    return auth_service.me(token)


@app.post(f"{settings.app.api_v1_prefix}/accessory-events/arbitrate", response_model=ArbitrationResponse)
def arbitrate_events(request: ArbitrationRequest, x_trace_id: str | None = Header(default=None)) -> ArbitrationResponse:
    outcome = accessory_event_arbitrator.resolve(request)
    return ArbitrationResponse(outcome=outcome, trace_id=x_trace_id or "trace-local-demo")
