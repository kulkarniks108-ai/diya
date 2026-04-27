# FastAPI Integration

This document defines how the Flutter app integrates with the FastAPI backend while staying backend-neutral at the architecture level.

## Goal

- Keep Flutter clean and modular
- Hide backend details behind repositories and datasources
- Support active realtime sessions and inactive push delivery
- Keep safety writes reliable through offline queues and idempotency keys

## Integration Boundaries

### Flutter Owns
- UI and user interaction
- Local state and queued safety actions
- Repository interfaces
- Device orchestration on the client side

### FastAPI Owns
- Auth and session verification
- Safety and SOS workflow state
- Realtime event fanout
- Push notification dispatch
- AI provider orchestration
- Device and telemetry persistence

## Data Flow

1. Flutter calls repository methods
2. Datasource translates requests into REST or websocket operations
3. Dio attaches access tokens and handles refresh
4. FastAPI validates request and role
5. FastAPI writes state and emits events
6. Flutter updates local cache from confirmed server state

## Realtime Rules

- WebSocket is used for active sessions
- Event streams include location, SOS state, and device connectivity state
- Resume cursor must be used for reconnect recovery
- Push notifications are used when the client is inactive or closed

## Offline Rules

- Safety-critical actions can be queued locally
- Queued actions must include idempotency keys
- On reconnect, Flutter syncs queued actions in priority order
- Backend truth wins after reconnect for shared state

## Error Handling

- Normalize backend errors into domain failures
- Retry only safe operations automatically
- Surface user actionable failures clearly

## Contract Alignment Rules

- Flutter error mapping should use hierarchical backend error codes
- Flutter should preserve and surface trace_id for support and diagnostics
- Response parsing should expect a single success and error envelope format across modules
- Authorization failures should map cleanly to role or permission UX paths without exposing backend policy internals

---

**Next:** See [backend-abstraction.md](backend-abstraction.md) for the repository and adapter contract model and [../backend/fastapi/error-catalog-and-handling.md](../backend/fastapi/error-catalog-and-handling.md) for backend error semantics.