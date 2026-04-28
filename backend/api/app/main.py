from __future__ import annotations

import logging

from fastapi import FastAPI

from app.api.error_handlers import register_error_handlers
from app.api.router import api_router
from app.config.logging import setup_logging
from app.config.settings import settings
from app.modules.auth.service import auth_service

setup_logging()

logger = logging.getLogger(__name__)

app = FastAPI(title=settings.app.app_name)
register_error_handlers(app)
app.include_router(api_router)


@app.on_event("startup")
def seed_demo_data() -> None:
    auth_service.seed_demo_users()


@app.get("/")
def root() -> dict[str, str]:
    logger.info("Root endpoint called")
    return {"message": settings.app.app_name}


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": settings.app.app_name}
