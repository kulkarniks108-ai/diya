# Repository Interfaces and Adapters

This document defines repository contracts and adapter standards for FastAPI modules.

## Goals

- Keep business logic independent of persistence details
- Enforce clean Service to Repository dependency direction
- Support reliable transaction boundaries and idempotent writes
- Keep data access testable and replaceable inside the backend

## Layer Boundary

- Service layer depends on repository interfaces only
- Repository adapters implement interfaces using SQLAlchemy async and PostgreSQL
- Controllers and routes must never call adapters directly

## Repository Interface Rules

- One interface per module aggregate or cohesive domain area
- Async method signatures with explicit return types
- No HTTP objects or framework types in repository signatures
- No authorization policy logic in repositories
- No workflow branching in repositories

## Adapter Rules

- Concrete adapters own query and persistence implementation only
- Adapters receive session or unit-of-work context from service orchestration
- Adapters may raise technical exceptions that services map to domain-safe outcomes
- Adapters must support deterministic idempotent writes for critical actions

## Transaction and Unit-of-Work Expectations

- Multi-repository writes should execute in one service-level transaction boundary
- Commit and rollback orchestration should be explicit and test-covered
- Outbox or event-publish markers should be persisted within transaction scope

## Idempotency Contract

- Critical write operations must accept idempotency key inputs
- Repository adapters should enforce uniqueness and replay-safe behavior
- Conflicts should map to deterministic conflict domain errors

## Testing Standards

- Interface contract tests for each repository interface
- Adapter integration tests against PostgreSQL-compatible test setup
- Service tests with mocked interfaces for domain rule isolation

## Example Module Breakdown

- safety repository interface
- safety SQLAlchemy adapter
- location repository interface
- location SQLAlchemy adapter
- device repository interface
- device SQLAlchemy adapter

---

**Next:** See [architecture-overview.md](architecture-overview.md) for full dependency direction and anti-pattern rules.
