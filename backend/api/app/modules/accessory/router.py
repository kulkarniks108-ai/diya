from __future__ import annotations

from fastapi import APIRouter, Header

from app.schemas import ArbitrationRequest, ArbitrationResponse

from .service import accessory_event_arbitrator

router = APIRouter(prefix="/accessory-events", tags=["accessory-events"])


@router.post("/arbitrate", response_model=ArbitrationResponse)
def arbitrate_events(request: ArbitrationRequest, x_trace_id: str | None = Header(default=None)) -> ArbitrationResponse:
    outcome = accessory_event_arbitrator.resolve(request)
    return ArbitrationResponse(outcome=outcome, trace_id=x_trace_id or "trace-local-demo")
