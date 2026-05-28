from __future__ import annotations

import asyncio
import json
import logging
import time
from datetime import datetime, timezone
from typing import AsyncGenerator, Dict

import httpx
try:
    import cv2
except Exception:  # noqa: BLE001
    cv2 = None
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse, JSONResponse, Response, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from .logging import setup_logging
from .state import LogBuffer, SimulatorState

setup_logging()
logger = logging.getLogger("goggle-simulator")

app = FastAPI(title="Smart Goggle Simulator")
app.mount("/static", StaticFiles(directory="static"), name="static")

state = SimulatorState()
logs = LogBuffer()

CAMERA_INDEX = 0
JPEG_QUALITY = 85


class CommandRequest(BaseModel):
    command: str = Field(..., examples=["haptic", "capture", "connect", "disconnect"])
    duration_ms: int | None = None
    payload: Dict[str, object] = Field(default_factory=dict)


class StateUpdate(BaseModel):
    connected: bool | None = None
    battery_level: int | None = Field(default=None, ge=0, le=100)
    ultrasonic_cm: float | None = Field(default=None, ge=0, le=1000)
    stream_fps: int | None = Field(default=None, ge=1, le=30)
    telemetry_hz: float | None = Field(default=None, ge=0.5, le=10.0)


class RegisterPhoneRequest(BaseModel):
    phone_ip: str
    port: int = 8080
    goggle_port: int = 9000
    device_id: str | None = None


class SosRequest(BaseModel):
    location: str | None = None
    idempotency_key: str | None = None


async def _notify_ultrasonic_event(distance_cm: float, detected: bool) -> None:
    if not state.phone_ip:
        return

    url = f"http://{state.phone_ip}:{state.phone_port}/events/ultrasonic"
    payload = {
        "device_id": state.device_id,
        "distance_cm": distance_cm,
        "detected": detected,
        "ts": time.time(),
    }

    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
        _log("ultrasonic.notify.phone", distance_cm=distance_cm, detected=detected)
    except Exception as exc:  # noqa: BLE001
        _log("ultrasonic.notify.phone.failed", error=str(exc), distance_cm=distance_cm)


async def _notify_sos_event(payload: dict) -> None:
    if not state.phone_ip:
        raise HTTPException(status_code=400, detail="Phone is not registered yet")

    url = f"http://{state.phone_ip}:{state.phone_port}/sos"
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
        _log("sos.notify.phone", payload=payload)
    except Exception as exc:  # noqa: BLE001
        _log("sos.notify.phone.failed", error=str(exc), payload=payload)
        raise HTTPException(status_code=502, detail={"message": str(exc)}) from exc


def _log(event: str, **fields: object) -> None:
    payload = {
        "timestamp": datetime.now(tz=timezone.utc).isoformat(),
        "event": event,
        "device_id": state.device_id,
        **fields,
    }
    logger.info(event, extra={"event": event, **fields})
    logs.add(payload)


def _jpeg_magic_ok(payload: bytes) -> bool:
    return len(payload) >= 2 and payload[0:2] == b"\xff\xd8"


def _request_id() -> str:
    return f"sim-{int(time.time() * 1000)}"


def _capture_webcam_jpeg(camera_index: int) -> bytes:
    if cv2 is None:
        raise RuntimeError("OpenCV not available. Run 'uv sync' to install opencv-python.")
    camera = cv2.VideoCapture(camera_index)
    if not camera.isOpened():
        camera.release()
        raise RuntimeError("Failed to open webcam")
    ok, frame = camera.read()
    camera.release()
    if not ok or frame is None:
        raise RuntimeError("Failed to read webcam frame")
    encode_ok, buffer = cv2.imencode(".jpg", frame, [int(cv2.IMWRITE_JPEG_QUALITY), JPEG_QUALITY])
    if not encode_ok:
        raise RuntimeError("Failed to encode webcam frame")
    return buffer.tobytes()


@app.get("/")
async def home() -> HTMLResponse:
    with open("static/index.html", "r", encoding="utf-8") as handle:
        return HTMLResponse(handle.read())


@app.get("/health")
async def health() -> dict:
    uptime_s = int((datetime.now(tz=timezone.utc) - state.started_at).total_seconds())
    return {
        "status": "ok",
        "device_id": state.device_id,
        "connected": state.connected,
        "uptime_s": uptime_s,
    }


@app.get("/state")
async def get_state() -> dict:
    return {
        "device_id": state.device_id,
        "connected": state.connected,
        "battery_level": state.battery_level,
        "ultrasonic_cm": state.ultrasonic_cm,
        "stream_fps": state.stream_fps,
        "telemetry_hz": state.telemetry_hz,
        "last_command": state.last_command,
    }


@app.post("/state")
async def update_state(update: StateUpdate) -> dict:
    if update.connected is not None:
        state.connected = update.connected
    if update.battery_level is not None:
        state.battery_level = update.battery_level
    if update.ultrasonic_cm is not None:
        state.ultrasonic_cm = update.ultrasonic_cm
        detected = state.ultrasonic_cm <= 120
        await _notify_ultrasonic_event(state.ultrasonic_cm, detected)
    if update.stream_fps is not None:
        state.stream_fps = update.stream_fps
    if update.telemetry_hz is not None:
        state.telemetry_hz = update.telemetry_hz

    _log("state.update", connected=state.connected, battery_level=state.battery_level, ultrasonic_cm=state.ultrasonic_cm)
    return await get_state()


@app.post("/command")
async def command(req: CommandRequest) -> JSONResponse:
    state.last_command = {
        "command": req.command,
        "duration_ms": req.duration_ms,
        "payload": req.payload,
        "received_at": datetime.now(tz=timezone.utc).isoformat(),
    }

    if req.command == "connect":
        state.connected = True
    elif req.command == "disconnect":
        state.connected = False
    elif req.command == "capture":
        _log("capture.command_rejected")
        raise HTTPException(status_code=400, detail="Use GET /capture for JPEG snapshot")


@app.api_route('/capture', methods=["GET", "POST"])
async def capture_raw(request: Request, camera_index: int = CAMERA_INDEX) -> Response:
    """Return a raw JPEG bytes payload for snapshot capture."""
    req_id = _request_id()
    client_host = request.client.host if request.client else "unknown"
    if camera_index < 0:
        raise HTTPException(status_code=422, detail="camera_index must be >= 0")
    try:
        payload = _capture_webcam_jpeg(camera_index)
    except Exception as exc:  # noqa: BLE001
        _log(
            "capture.raw.failed",
            request_id=req_id,
            client=client_host,
            method=request.method,
            camera_index=camera_index,
            error=str(exc),
        )
        raise HTTPException(status_code=503, detail=f"Webcam capture failed: {exc}") from exc
    _log(
        "capture.raw.requested",
        request_id=req_id,
        client=client_host,
        method=request.method,
        camera_index=camera_index,
        size=len(payload),
    )
    if not _jpeg_magic_ok(payload):
        _log("capture.raw.invalid", request_id=req_id, size=len(payload), hex_prefix=payload[:8].hex())
        raise HTTPException(status_code=500, detail="Invalid JPEG payload configured in simulator")
    hex_prefix = payload[:16].hex()
    logger.info(
        "capture.raw.respond",
        extra={
            "request_id": req_id,
            "size": len(payload),
            "hex_prefix": hex_prefix,
            "client": client_host,
            "camera_index": camera_index,
        },
    )
    headers = {
        "Cache-Control": "no-store",
        "Content-Length": str(len(payload)),
        "X-Image-Format": "jpeg",
        "X-Image-Bytes": str(len(payload)),
        "X-Request-Id": req_id,
    }
    return Response(content=payload, media_type="image/jpeg", headers=headers)


@app.post("/register-phone")
async def register_with_phone(req: RegisterPhoneRequest) -> JSONResponse:
    device_id = req.device_id or state.device_id
    phone_ip = req.phone_ip.strip().replace("http://", "").replace("https://", "")
    if "/" in phone_ip:
        phone_ip = phone_ip.split("/")[0]
    url = f"http://{phone_ip}:{req.port}/register"
    state.phone_ip = phone_ip
    state.phone_port = req.port
    payload = {
        "device_id": device_id,
        "device_type": "goggle",
        "port": req.goggle_port,
    }

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
        _log("register.phone", phone_ip=phone_ip, port=req.port, device_id=device_id)
        return JSONResponse({"status": "ok", "registered": True})
    except Exception as exc:  # noqa: BLE001
        _log("register.phone.failed", phone_ip=phone_ip, port=req.port, error=str(exc))
        raise HTTPException(status_code=502, detail={"message": str(exc)}) from exc


@app.post("/sos")
async def trigger_sos(req: SosRequest) -> JSONResponse:
    payload = {
        "device_id": state.device_id,
        "device_type": "goggle",
        "payload": {
            "location": req.location,
            "timestamp": datetime.now(tz=timezone.utc).isoformat(),
        },
    }
    if req.idempotency_key:
        payload["idempotency_key"] = req.idempotency_key

    await _notify_sos_event(payload)
    return JSONResponse({"status": "ok", "forwarded": True})


@app.get("/logs")
async def get_logs() -> dict:
    return {"items": logs.list()}


async def _frame_stream() -> AsyncGenerator[bytes, None]:
    frame_id = 0
    while True:
        frame_id += 1
        payload = {
            "event": "frame",
            "frame_id": frame_id,
            "ts": time.time(),
            # Use PNG data-url in frame stream to match binary /capture and
            # avoid JPEG decoder incompatibilities on some Android devices.
            "data_url": TINY_PNG_DATA_URL,
            "battery_level": state.battery_level,
        }
        yield f"data: {json.dumps(payload)}\n\n".encode("utf-8")
        await asyncio.sleep(max(0.1, 1.0 / max(1, state.stream_fps)))


@app.get("/stream")
async def stream_frames() -> StreamingResponse:
    return StreamingResponse(_frame_stream(), media_type="text/event-stream")


async def _telemetry_stream() -> AsyncGenerator[bytes, None]:
    while True:
        payload = {
            "event": "telemetry",
            "ts": time.time(),
            "battery_level": state.battery_level,
            "ultrasonic_cm": state.ultrasonic_cm,
            "connected": state.connected,
        }
        yield f"data: {json.dumps(payload)}\n\n".encode("utf-8")
        await asyncio.sleep(max(0.1, 1.0 / max(0.5, state.telemetry_hz)))


@app.get("/telemetry")
async def telemetry_stream() -> StreamingResponse:
    return StreamingResponse(_telemetry_stream(), media_type="text/event-stream")
