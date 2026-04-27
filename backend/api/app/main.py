from fastapi import FastAPI
from app.config.settings import settings
from app.config.logging import setup_logging
import logging

setup_logging()

logger = logging.getLogger(__name__)

app = FastAPI(title=settings.app_name)

@app.get("/")
def root():
    logger.info("Root endpoint called")
    return {"message": settings.app_name}