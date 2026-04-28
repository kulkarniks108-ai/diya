# Device Arbitration Rules

This document defines the deterministic policy used when multiple accessories (Smart Cane, Wi‑Fi Smart Goggle, wearables) emit overlapping or conflicting events. The goal is predictable, safe behavior with clear client/server responsibilities and built-in observability for debugging.

1) Goals
- Prevent race conditions and duplicated user outcomes.
- Ensure safety-critical signals win and are acted upon immediately.
- Keep behavior deterministic and debuggable across reconnection and replay.

2) Priority Model (highest → lowest)
- Safety (SOS, escalation) — always highest priority.
- Immediate Assist (user-triggered guidance events such as camera-capture request).
- Local Commands (device button toggles that modify device-local state).
- Telemetry/Batched Events (battery, periodic sensor telemetry).

3) Source Authority
- Client-local authority: short-lived immediate actions that only affect the local device (e.g., short UI feedback) may be resolved locally for latency.
- Server authority: any action that affects shared state or other users (SOS, live location, trusted contacts) is finalized by the server. Client may optimistically show local state but must reconcile with server outcome.

4) Timestamps, Sequence, and Canonical Ordering
- All event frames MUST include an ISO8601 UTC timestamp and optionally a monotonic `seq` where available.
- Server orders events using (server_receive_time, provided_seq, provided_timestamp) to handle clock skew.
- Canonical ordering: server_receive_time is authoritative for ordering when conflicts matter.

5) Deduplication and Idempotency
- All critical events MUST include `Idempotency-Key` (UUIDv4 or ULID).
- Client dedup window: clients should treat duplicate logical events with same idempotency key as already sent and avoid re-sending within 5s unless ack not received.
- Server dedup scope: keys are scoped to (user_id, endpoint). Server stores idempotency results for at least 7 days.

6) Conflict Resolution Rules (tie-breakers)
- If multiple safety events arrive near-simultaneously: choose the first received by server, unless a later event has higher priority (e.g., an explicit override from a higher-trust device).
- Device trust score: paired devices marked `trusted=true` (established pairing + device age) are preferred over newly paired/untrusted devices.
- For simultaneous camera source selection: prefer device with `capability.camera:true` and `health:ready`; prefer goggle camera for image quality if health is good; otherwise prefer phone.

7) Time-to-Live (TTL) & Live Windows
- Button-press events: live window = 5 seconds for dedup and arbitration.
- Location updates: live window = 30 seconds for immediate safety decisions; older updates are considered stale.
- Event replay retention (server): default 24 hours; server exposes retention via `GET /meta`.

8) ACK / Retry Budgets
- Clients MUST expect ack pattern: client POST → server returns 2xx/202 + `event_id`. If no ack within 3s, client retries with exponential backoff; cap retries to 5 attempts.
- For safety writes, client MUST set `Idempotency-Key` and give visual/audio feedback that write is pending and show `trace_id` when available.

9) Observability & Test Hooks
- Required log fields: `trace_id`, `event_id`, `source_device_id`, `user_id`, `timestamp`, `resolved_by` (client|server), `resolved_reason` (priority|trust|latest).
- Emit explicit `conflict_resolved` events to WS and event logs when arbitration chooses one outcome over another.
- Provide test endpoints or toggles to simulate simultaneous device signals and validate arbitration.

10) Security & Trust
- Pairing level influences arbitration: devices with valid pairing and `trusted=true` take precedence for critical actions.
- Devices must present a pairing signature or server-validated token for sensitive actions.

11) Example Scenarios
- Scenario: Cane button and Goggle button pressed within 200ms: server receives cane first → SOS triggered; goggle press logged and de-duplicated.
- Scenario: Goggle camera returns higher-confidence scene while phone camera fails: prefer goggle camera result for assist output.

12) Test Matrix (minimum)
- Simultaneous button presses (cane+goggle) — verify single SOS and correct trace_id.
- Out-of-order events on reconnect — verify resume cursor replays and dedupe by idempotency key.
- Device trust change mid-session — verify priority updates and deterministic outcome.

---

Location in repo: this file should be referenced by `docs/flutter/device-orchestration.md` and `docs/backend/fastapi/api-contracts-freeze.md`.
