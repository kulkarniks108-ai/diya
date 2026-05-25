# Smart Goggle Simulator

A local FastAPI simulator that behaves like the Smart Goggles over Wi-Fi. It exposes
health, command, telemetry, and frame streaming endpoints plus a simple web UI.

## Run

```bash
cd hardware/smart-goggles/simulator
uv sync
uv run uvicorn app.main:app --host 0.0.0.0 --port 9000 --reload
```

Then open:
- http://localhost:9000

## Notes
- To register with the phone discovery server, use the UI "Register with Phone" action.
- The simulator emits SSE streams for frames and telemetry.
- Logging is structured and shown in the UI log pane.
- `/capture` returns a live webcam JPEG snapshot on each request. Use `?camera_index=1` to pick a different camera (default 0).
