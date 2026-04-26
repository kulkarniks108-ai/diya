# Ops Reliability

This document defines operational and observability expectations for the FastAPI backend.

## Goals

- Make safety workflows observable
- Support debugging without exposing sensitive data
- Keep retries and background delivery predictable
- Help the backend stay reliable under load and failure

## Logging

- Structured logs with request id and correlation id
- Separate audit logs for safety actions
- Redaction for personal and sensitive data
- Event logs for delivery and device health transitions

## Metrics

- SOS fanout latency
- Notification delivery success rate
- WebSocket reconnect latency
- Retry counts by endpoint
- Error rate by service and route

## Failure Handling

- Retry transient delivery failures
- Use dead letter handling for unrecoverable notification work
- Keep idempotent writes safe to repeat
- Surface degraded service state in ops dashboards

## Runbook Focus

- Auth failures
- Token refresh failures
- Push delivery delays
- WebSocket disconnect loops
- AI provider failures
- Device telemetry backlog

---

**Next:** Cross link Flutter integration docs with these backend contracts.
