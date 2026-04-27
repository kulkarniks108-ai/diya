# Config and Environment Management

This document defines centralized configuration standards for the FastAPI backend.

## Goals

- Keep environment configuration typed and validated
- Minimize runtime misconfiguration risk
- Centralize config ownership for easier change management
- Keep secrets and operational values controlled

## Configuration Baseline

- Use Pydantic settings for typed configuration models
- Group settings by domain: app, auth, db, cache, queue, observability, providers
- Validate required variables at startup and fail fast on invalid config

## Environment Groups

### App
- environment name
- service name
- debug mode
- API version defaults

### Auth
- JWT issuer and audience
- access token ttl
- refresh token ttl
- signing keys and rotation config

### Data and Infrastructure
- PostgreSQL connection settings
- Redis connection settings
- queue and worker settings

### Observability
- log format mode (pretty in dev, JSON in production)
- trace export settings
- metrics enablement and endpoint options

### External Providers
- push provider keys
- AI provider credentials
- timeout and retry settings

## Secrets and Safety Rules

- Secrets must come from env or secret manager, never hardcoded
- Production must not run with default secret placeholders
- Sensitive values should never be printed in logs

## Override Policy

- Defaults allowed only for non-sensitive development settings
- Environment-specific overrides should be explicit
- Runtime overrides should be tracked and auditable

## Operational Guidance

- Keep one central settings entrypoint used by all modules
- Avoid ad hoc env reads outside the settings layer
- Document every required variable in env example files

---

**Next:** See [ops-reliability.md](ops-reliability.md) for logging and observability behavior tied to these settings.
