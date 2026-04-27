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
- Route handlers delegate to controllers only

### Controller Layer
- Orchestrates request and response mapping
- Calls service methods and translates domain outcomes into API envelopes
- Converts domain and technical errors into standardized HTTP responses
- Must not contain persistence logic

### Domain Layer
- Auth and roles
- SOS and safety workflows
- Live location and family notifications
- Device state and telemetry handling
- AI orchestration and result normalization

### Service Layer
- Implements business rules and workflow transitions
- Enforces policy checks where domain context is required
- Coordinates idempotency, transaction boundaries, and side effect sequencing
- Calls repository interfaces, never concrete infrastructure classes

### Repository Layer
- Defines data access interfaces per module
- Provides concrete adapters for SQLAlchemy async and PostgreSQL
- Handles query, persistence, and transaction participation only
- Must not contain domain workflow logic

### Infrastructure Layer
- Database access
- Notification providers
- Token issuance and refresh
- External AI provider adapters
- Logging and metrics exporters

## Dependency Direction

- Routes depend on controllers and schemas
- Controllers depend on services and response contracts
- Services depend on repository and policy interfaces
- Repository adapters depend on infrastructure clients
- Infrastructure implements repository and provider interfaces
- Flutter depends only on contracts, not backend internals

## Layer Anti-Patterns

- Route calling repositories directly
- Controller performing business validation and state transitions
- Service constructing HTTP responses or status codes
- Repository making authorization or policy decisions
- Shared utility modules holding module-specific business rules

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

## Module Template Standard

Each module should define:
- route definitions and websocket handlers where needed
- controller for API orchestration
- service for business logic
- repository interfaces and concrete adapters
- schemas and response contracts
- domain errors and status enums
- module tests for service, repository adapter, and API contract behavior

---

**Next:** See [api-contracts-v1.md](api-contracts-v1.md) for endpoint and schema planning.
