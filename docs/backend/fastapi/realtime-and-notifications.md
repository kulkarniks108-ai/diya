# Realtime and Notifications

This document defines how FastAPI delivers live updates to Flutter, web, and inactive family users.

## Delivery Model

- WebSocket for active sessions
- Push notifications for inactive app or web sessions
- Resume cursor for ordered event streams
- Push fallback when realtime connection is unavailable

## Event Types

- Live location updates
- SOS trigger
- SOS escalation
- Emergency status change
- Device connectivity state change
- Device health degraded

## Reliability Rules

- Active sessions should receive ordered events
- Every event stream should support resume cursor recovery
- Critical push events must be delivered even when the client is closed
- SOS delivery should target under 5 seconds p95
- Notification fanout must be idempotent

## Family User Experience

- If the app or website is open, the user sees realtime updates
- If the app or website is closed, the user still receives push notifications
- If both are unavailable, the backend keeps retrying delivery within policy

---

**Next:** See [data-model-and-events.md](data-model-and-events.md) for shared entities and domain events.
