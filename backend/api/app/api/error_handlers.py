from __future__ import annotations

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(HTTPException)
    async def handle_http_exception(request: Request, exc: HTTPException) -> JSONResponse:
        detail = exc.detail if isinstance(exc.detail, dict) else {"code": "HTTP.ERROR", "message": str(exc.detail)}
        trace_id = request.headers.get("x-trace-id", "trace-local-demo")
        payload = {
            "success": False,
            "error": {
                "code": detail.get("code", "HTTP.ERROR"),
                "message": detail.get("message", "Request failed"),
                "details": detail.get("details"),
            },
            "trace_id": trace_id,
        }
        return JSONResponse(status_code=exc.status_code, content=payload)

    @app.exception_handler(Exception)
    async def handle_unhandled_exception(request: Request, exc: Exception) -> JSONResponse:
        trace_id = request.headers.get("x-trace-id", "trace-local-demo")
        payload = {
            "success": False,
            "error": {
                "code": "TECHNICAL.UNHANDLED",
                "message": str(exc),
            },
            "trace_id": trace_id,
        }
        return JSONResponse(status_code=500, content=payload)
