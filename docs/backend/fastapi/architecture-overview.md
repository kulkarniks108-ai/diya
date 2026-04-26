# Architecture Overview

This document describes the FastAPI backend architecture for 2ndEye.

## Objectives

- Support reliable assistive and safety workflows
- Keep API boundaries stable for Flutter clients
- Separate business logic from transport and infrastructure concerns
- Scale cleanly as more devices, users, and AI workflows are added

## Proposed Service Shape

### API Layer
- FastAPI routes expose versioned REST endpoints
- WebSocket endpoints handle active realtime sessions
- Request validation uses explicit schema models

### Domain Layer
- Auth and roles
- SOS and safety workflows
- Live location and family notifications
- Device state and telemetry handling
- AI orchestration and result normalization

### Infrastructure Layer
- Database access
- Notification providers
- Token issuance and refresh
- External AI provider adapters
- Logging and metrics exporters

## Dependency Direction

- Routes depend on services and schemas
- Services depend on domain interfaces
- Infrastructure implements domain interfaces
- Flutter depends only on contracts, not backend internals

## Service Boundaries

- Identity service
- Safety service
- Realtime delivery service
- Device registry service
- AI orchestration service
- Observability service

## Implementation Principles

- Keep critical workflows idempotent
- Prefer explicit state transitions over implicit side effects
- Make failure states observable
- Keep backend behavior compatible with offline Flutter retries

---

**Next:** See [api-contracts-v1.md](api-contracts-v1.md) for endpoint and schema planning.
