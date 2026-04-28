# Observability Plan (Backend + Mobile Correlation)

Purpose: define logging, tracing, metrics, and alerting standards to support SRE, debugging, and product telemetry for safety-critical flows.

1) Logging
- Structured JSON logs in production; pretty logs in development.
- Required fields: `ts`, `level`, `service`, `module`, `trace_id`, `span_id` (if present), `user_id` (when available), `event`, `msg`, `event_id`, `source_device_id`, `env`.
- PII handling: redact or mask location and personal identifiers in operational logs. Use a `redacted` flag when sensitive fields are removed.

2) Tracing
- Use OpenTelemetry; propagate `trace_id` from mobile -> backend -> workers.
- Capture spans for request handling, DB calls, external AI calls, and notification fanout.
- Set sampling policy: 1% baseline with 100% sampling for errors and safety flows.

3) Metrics
- Core metrics (per-minute): `safety.sos.submitted`, `safety.sos.ack_latency_ms`, `ws.connections`, `ws.reconnects`, `device.reconnects`, `ai.job.latency_ms`, `push.delivery_rate`.
- Use Prometheus exposition and scrape these metrics; create dashboards in Grafana.

4) Alerts & SLOs
- Example SLOs:
  - SOS delivery p95 < 10s
  - Error rate < 0.5% per 5m window for safety endpoints
- Alerts:
  - SOS latency breach p95 > threshold
  - Websocket disconnect storm (> X reconnects per minute)
  - High rate of refresh token reuse (possible breach)

5) Correlation
- Mobile should send `X-Trace-Id` header when present; server returns `trace_id` in responses.
- Surface `trace_id` to support console and in-app diagnostics when user consents.

6) Retention and Storage
- Logs: 30 days hot, 365 days cold-archive (configurable).
- Traces: 90 days for sampled traces; full traces for safety incidents stored per incident retention policy.
- Metrics: store aggregates for 13 months.

7) Privacy
- Operational logs NEVER store raw precise location without explicit opt-in; use coarse location or masked values unless required for safety retention.

8) Tooling Recommendations
- Logging: structlog + JSON formatter (backend), slog or similar on mobile with mapping to backend fields.
- Tracing: OpenTelemetry collector -> OTLP -> observability backend (e.g., honeycomb/x-ray/tempo).
- Metrics: Prometheus + Grafana.

9) On-Call and Runbooks
- On-call schedule with severity classification.
- Runbooks for SOS latency, websocket storms, and refresh token abuse.
