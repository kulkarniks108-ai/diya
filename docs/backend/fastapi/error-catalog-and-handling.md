# Error Catalog and Handling

This document defines backend error taxonomy, status enums, and response behavior for FastAPI modules.

## Goals

- Keep backend failures observable and diagnosable
- Return clear frontend-safe error responses
- Map every domain and technical failure to deterministic HTTP behavior
- Preserve traceability between API response and backend logs

## Error Categories

### Domain Errors
Used for expected business-rule failures.

Examples:
- AUTH.TOKEN.EXPIRED
- AUTH.SESSION.REVOKED
- SAFETY.SOS.ALREADY_ACTIVE
- SAFETY.SOS.NOT_ACTIVE
- DEVICE.REGISTRATION.CONFLICT
- LOCATION.UPDATE.INVALID_STATE

### Policy Errors
Used when role or permission checks fail.

Examples:
- AUTHZ.PERMISSION.DENIED
- AUTHZ.ROLE.REQUIRED

### Validation Errors
Used for request schema or semantic validation failures.

Examples:
- REQUEST.VALIDATION.FAILED
- REQUEST.FIELD.INVALID

### Technical Errors
Used for infrastructure and integration failures.

Examples:
- SYSTEM.DB.UNAVAILABLE
- SYSTEM.CACHE.UNAVAILABLE
- SYSTEM.PROVIDER.TIMEOUT
- SYSTEM.INTERNAL.UNEXPECTED

## Status Enums

Each module should define enums for state transitions and status signaling.

Examples:
- SafetyStatus: CREATED, ACTIVE, ESCALATED, RESOLVED, CLOSED
- DeviceHealthStatus: ONLINE, DEGRADED, OFFLINE
- LocationStreamStatus: STARTED, PAUSED, DEGRADED, STOPPED
- AuthSessionStatus: ACTIVE, ROTATED, REVOKED, EXPIRED

## HTTP Mapping Baseline

- Validation errors: 400
- Unauthorized token errors: 401
- Permission and role errors: 403
- Not found domain resources: 404
- Conflict and idempotency collisions: 409
- Semantic unprocessable cases: 422
- Rate limiting: 429
- Infrastructure transient failures: 503
- Unexpected internal failures: 500

## Standard Error Envelope

- status: error
- code: hierarchical error code
- type: domain, policy, validation, technical
- message: frontend-safe explanation
- details: optional structured error context
- trace_id: request correlation id for support and debugging

## Logging Requirements Per Error

- Every returned error must emit one backend log with matching trace_id
- Log must include module, operation, code, type, and status
- Sensitive fields must be redacted before write
- Location coordinates should be partially masked in operational logs

## Client Behavior Guidance

- Frontend should branch on code and type, not message text
- Trace id should be included in support surfaces for critical failures
- Retry behavior should follow error category and retry policy contracts

---

**Next:** See [api-contracts-v1.md](api-contracts-v1.md) for envelope usage in endpoint contracts.
