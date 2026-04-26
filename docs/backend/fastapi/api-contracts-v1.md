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
- Errors should include a machine readable code and a human readable message
- Critical write endpoints must support idempotency keys
- Retryable operations must be safe to repeat
- Sequence ids should be used for ordered realtime event streams

## Versioning Rules

- REST endpoints start at v1
- Breaking changes require a new major version
- Additive fields should remain backward compatible

---

**Next:** See [auth-and-roles.md](auth-and-roles.md) for identity and access planning.
