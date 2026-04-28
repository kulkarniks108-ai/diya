# API Contracts Freeze — v1 (Draft)

This document freezes the minimal, explicit API surface and contract expectations that `Flutter` will depend on for the first production release. It is purposely pragmatic: clear endpoints, example payloads, idempotency rules, resume-cursor format, and the JWT claim schema.

All endpoints MUST use the shared success/error envelope form shown below and should accept and return `trace_id` for support correlation.

---

## Shared envelopes

Success envelope

```json
{
  "success": true,
  "data": { /* resource-specific */ },
  "meta": { "pagination": { "cursor": "..." } },
  "trace_id": "<uuid>"
}
```

Error envelope

```json
{
  "success": false,
  "error": {
    "code": "AUTH.TOKEN.EXPIRED",
    "type": "DOMAIN", /* DOMAIN | VALIDATION | TECHNICAL | POLICY */
    "message": "Access token expired",
    "details": { /* optional */ }
  },
  "trace_id": "<uuid>"
}
```

Trace ID handling: server accepts `X-Trace-Id` header (optional) and returns `trace_id` in responses. If client not provided, server generates one.

---

## Headers & Common Patterns

- `Authorization: Bearer <access_token>` for authenticated endpoints.
- `Idempotency-Key: <ULID|UUIDv4>` — required for safety-critical write endpoints (see list below).
- `X-Trace-Id: <uuid>` optional correlation header.
- `Accept: application/json` and `Content-Type: application/json`.
- Rate limiting headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After` where applicable.

Idempotency key rules:

- Format: UUIDv4 or ULID recommended. Prefer ULID for lexicographic ordering but UUIDv4 is acceptable.
- Scope: server SHOULD scope keys to (user_id, endpoint path). Keys must be unique per user+endpoint.
- TTL: server stores idempotency records for at least 7 days (configurable).
- Semantics: repeated request with same key returns the original response (including status and body).

---

## Auth & Session

POST /auth/login

Request

```json
{ "email": "user@example.com", "password": "..." }
```

Response (200)

```json
{
  "success": true,
  "data": {
    "access_token": "<jwt>",
    "refresh_token": "<rotating-refresh-token>",
    "expires_in": 1800,
    "user": { "id": "<uuid>", "roles": ["blind"] }
  },
  "trace_id": "..."
}
```

POST /auth/refresh

Request

```json
{ "refresh_token": "<rotating-refresh-token>" }
```

Response (200)

```json
{ "success": true, "data": { "access_token": "<jwt>", "refresh_token": "<new-refresh-token>" }, "trace_id": "..." }
```

Notes (refresh rotation): server rotates refresh tokens on every successful refresh. The server associates refresh tokens with `session_id` and `jti`. Concurrent refresh attempts that reuse the same refresh token must be treated as follows: accept the first, reject subsequent attempts with `401` and error code `AUTH.REFRESH.TOKEN.REUSE`.

POST /auth/logout

Request: Authorization header required; optional body { "session_id": "..." }

Response: 200 success. Server invalidates session and refresh tokens for the session.

GET /auth/me

Response returns `user` object and `effective_permissions` (optionally limited list of permission strings for quick client-side checks).

---

## Devices

GET /devices

Response: list of devices for the user; include `id`, `type` (cane|goggle|wearable), `transport` (ble|wifi|usb), `health`, `capabilities`, `last_seen`.

POST /devices

Register device (pairing initiation). Body includes `device_identifier`, `transport`, `model`, `metadata`. This call returns a `device_id` and pairing instructions (if any).

PATCH /devices/{device_id}

Update device metadata or health (server-validated).

POST /devices/{device_id}/events

Telemetry and event ingestion (button press, battery, sensor bursts). Idempotency-Key recommended for important events. Accepts batch arrays for telemetry; server returns `202 Accepted` for async ingestion.

Event envelope example

```json
{ "events": [ { "event_type": "button_press", "timestamp":"...", "payload":{ "pattern": "double" } } ] }
```

---

## Safety / SOS

POST /safety/sos

Headers: `Idempotency-Key` REQUIRED

Request

```json
{
  "location": { "lat": 12.34, "lon": 56.78, "accuracy_m": 8, "provider":"gps" },
  "meta": { "trigger_source":"cane_button" },
  "contacts": ["user_uuid1","user_uuid2"]
}
```

Response (202 or 200 depending on sync):

```json
{ "success": true, "data": { "sos_id": "<uuid>", "status":"received" }, "trace_id":"..." }
```

Server guarantees: dedupe by `Idempotency-Key` for duplicate submissions. Server emits realtime events and push notifications to contacts. Client should surface `trace_id` and `sos_id` for support.

GET /safety/{sos_id}

Returns current SOS status, participants, and latest location.

---

## Realtime (WebSocket)

Connection: `wss://api.example.com/ws?access_token=<jwt>`

Auth: server MUST validate the access token at handshake.

Frames: Each message is a JSON envelope with `event_id`, `seq`, `type`, `payload`.

Resume protocol:

Client sends on reconnect:

```json
{ "type":"resume", "cursor":"<base64url>" }
```

Cursor format (opaque base64url of the JSON):

```json
{ "last_event_id":"<uuid>", "seq": 123, "server_time":"2026-04-28T12:34:56Z" }
```

Server SHOULD accept the cursor and replay events after `last_event_id`/`seq` subject to retention window. Documented retention window: default 24 hours — server must expose its accepted `since` limit in the `meta` of WS welcome message.

Heartbeat: ping/pong every 30s; client reconnect with exponential backoff capped at 60s.

---

## Events API (REST)

GET /events?cursor=<cursor>&limit=50

Returns a page of events with `meta.cursor` for the next page. Cursor uses same opaque format as WS resume cursor.

---

## AI Jobs (Async)

POST /ai/jobs

Request: job request with `source` (camera|goggle|upload), `model_hint`, `priority`.

Response: 202 with `job_id`. Worker processes job and updates status.

GET /ai/jobs/{job_id}

Returns `status: queued|running|done|failed`, `result` when done, and `trace_id`.

Notifications: server emits a realtime `ai.result` event when job completes.

---

## Pagination and Filtering Conventions

- Pagination uses opaque cursor in `meta.pagination.cursor`.
- Filtering uses query params, and the server returns allowed filter fields in the endpoint metadata.

---

## Error Codes (example slice)

- `AUTH.TOKEN.EXPIRED` -> 401
- `AUTH.REFRESH.TOKEN.REUSE` -> 401
- `PERMISSION.DENIED` -> 403
- `VALIDATION.MISSING_FIELD` -> 400
- `RATE.LIMITED` -> 429
- `SENTRY.PROCESSING_ERROR` -> 503

Full error catalog lives in `docs/backend/fastapi/error-catalog-and-handling.md`.

---

## JWT Claim Schema (access token)

Access tokens are JWT (HS256 or RS256 depending on deployment). Required claims:

- `sub` (string): subject / user id (UUID)
- `uid` (string): same as `sub` (redundant for convenience)
- `roles` (array[string]): high-level roles e.g., `["blind","family","admin"]`
- `permissions` (array[string], optional): permission strings for quick client checks (e.g., `safety:sos:create`)
- `session_id` (string): session identifier used to correlate refresh tokens
- `token_version` (int): increments when server-side session revocations happen
- `exp`, `iat`, `nbf` standard claims
- `jti` (string): token unique id used for revocation lookup if applicable

Access token lifetime SHOULD be short (e.g., 15–30 minutes). Refresh tokens are opaque strings stored server-side and rotated on use.

Example access token payload

```json
{
  "sub":"user-uuid",
  "uid":"user-uuid",
  "roles":["blind"],
  "permissions":["safety:sos:create"],
  "session_id":"session-uuid",
  "token_version":1,
  "jti":"token-uuid",
  "iat":1650000000,
  "exp":1650001800
}
```

---

## Telemetry and Privacy Notes

- Location precision: backend stores full location for safety flows but operational logs must be partially masked for non-essential contexts (round to 3 decimals if logged or use noise injection).
- Telemetry sample rates and retention should be declared in endpoint metadata and comply with privacy/regulatory requirements.

---

## Operational Notes

- All write endpoints affecting safety must support idempotency and return consistent responses when retried.
- Server must surface its retention windows for WS replay and event log TTL via a `GET /meta` endpoint.
- The API must include a `/health` endpoint for readiness and liveness probes.

---

## Next steps (for API freeze)

1. Review this document and confirm semantics for `Idempotency-Key` scope and TTL.
2. Confirm WS event retention window (24 hours default) or provide a longer SLA if needed.
3. Confirm refresh token rotation policy and storage TTL for revocation list.
4. Add exact endpoint schemas (full OpenAPI spec) — this doc is the behavioral freeze; OpenAPI will be produced next.
