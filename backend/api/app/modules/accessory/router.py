from __future__ import annotations

from fastapi import APIRouter, Header

from app.schemas import ArbitrationRequest, ArbitrationResponse

from .service import accessory_event_arbitrator

router = APIRouter(prefix="/accessory-events", tags=["accessory-events"])


@router.post("/arbitrate")
def arbitrate_events(request: ArbitrationRequest, x_trace_id: str | None = Header(default=None)) -> dict:
    outcome = accessory_event_arbitrator.resolve(request)
    trace_id = x_trace_id or "trace-local-demo"
    return {
        "success": True,
        "data": {
            "outcome": {
                "winner_event_id": outcome.winner_event_id,
                "winner_source_device_id": outcome.winner_source_device_id,
                "reason": outcome.reason,
                "suppressed_event_ids": outcome.suppressed_event_ids,
            }
        },
        "trace_id": trace_id,
    }
