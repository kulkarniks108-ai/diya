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

### Logging Format Policy
- Development: pretty human-readable logs for local debugging
- Production: JSON structured logs for ingestion and query

### Required Log Fields
- trace_id
- request_id
- user_id when available
- module
- operation
- result_status
- error_code when failures occur

### Redaction Policy
- PII and secrets must be removed before log write
- Location data must be partially masked in operational logs
- Full precision location should only appear in tightly controlled audit channels

## Metrics

- SOS fanout latency
- Notification delivery success rate
- WebSocket reconnect latency
- Retry counts by endpoint
- Error rate by service and route

### Tracing and Metrics Baseline
- OpenTelemetry trace instrumentation for REST, websocket, repository, and provider calls
- Prometheus metrics for latency, throughput, error rate, and retry volume
- Trace and metric labels should align with module and operation names

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

## Backend Terminal Behavior

- Backend terminal output in development should show pretty logs with trace and error code context
- Production runtime should emit JSON logs only
- Every returned API error must have a matching backend log entry that includes the same trace_id

---

**Next:** Cross link Flutter integration docs with these backend contracts.
