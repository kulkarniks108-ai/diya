# API Contracts v1

This document defines the first REST contract set for the FastAPI backend.

## Contract Goals

- Keep Flutter integration stable
- Use explicit versioning
- Support idempotent safety actions
- Keep request and response shapes consistent
- Leave room for realtime and event extension later

## Core API Areas

### Auth
- Login
- Refresh token rotation
- Logout and session revocation
- Role and profile fetch

### Safety
- Create SOS event
- Escalate SOS event
- Resolve SOS event
- Fetch current safety state

### Family and Location
- Update live location
- Fetch live location timeline
- Notify trusted contacts
- Fetch family view state

### Device
- Register device
- Update device health
- Send telemetry events
- Fetch connected device state

### AI
- Submit AI request
- Check AI job status
- Fetch AI result

## Request and Response Rules

- Every endpoint returns a stable envelope
- Errors should include hierarchical machine-readable codes and clear user-safe messages
- Critical write endpoints must support idempotency keys
- Retryable operations must be safe to repeat
- Sequence ids should be used for ordered realtime event streams

## Success Envelope

- status: success
- data: endpoint result payload
- meta: optional metadata such as pagination and request timing
- trace_id: request correlation identifier

## Error Envelope

- status: error
- code: hierarchical code (for example AUTH.TOKEN.EXPIRED)
- type: domain or technical category
- message: frontend-safe message
- details: optional field-level or domain context details
- trace_id: backend correlation identifier for debugging

## Error Semantics

- Validation failures return deterministic field-level detail sets
- Permission failures never leak policy internals
- Not found responses avoid disclosing unrelated resource existence
- System failures return stable generic messages with trace_id for support

## Versioning Rules

- REST endpoints start at v1
- Breaking changes require a new major version
- Additive fields should remain backward compatible

## Contract Examples Required Per Endpoint Group

- success example
- validation error example
- permission error example
- conflict and idempotency error example
- internal failure example

---

**Next:** See [auth-and-roles.md](auth-and-roles.md) for identity and access planning.
