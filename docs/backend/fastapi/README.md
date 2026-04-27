# FastAPI Backend Plan

This folder defines the FastAPI backend plan for 2ndEye.
It is written to support the Flutter app through stable API contracts, reliable realtime delivery, and backend-neutral integration seams.

## Scope

- Backend architecture and module boundaries
- REST v1 API contracts
- Auth and role model
- Realtime and push delivery rules
- Data model and domain events
- Operational reliability and observability
- Flutter integration touchpoints

## Reading Order

1. [architecture-overview.md](architecture-overview.md)
2. [api-contracts-v1.md](api-contracts-v1.md)
3. [auth-and-roles.md](auth-and-roles.md)
4. [error-catalog-and-handling.md](error-catalog-and-handling.md)
5. [repository-interfaces-and-adapters.md](repository-interfaces-and-adapters.md)
6. [config-and-env-management.md](config-and-env-management.md)
7. [realtime-and-notifications.md](realtime-and-notifications.md)
8. [data-model-and-events.md](data-model-and-events.md)
9. [ops-reliability.md](ops-reliability.md)

## Working Principle

The backend should stay reliable for safety-first flows.

- Flutter remains backend-neutral through repository and datasource adapters.
- FastAPI owns auth, AI orchestration, realtime delivery, and safety workflows.
- Route, controller, service, and repository responsibilities are explicitly separated.
- Active clients receive websocket updates.
- Inactive clients receive push notifications for critical events.
- Safety actions must remain idempotent and recoverable.
- Optional delivery or monitoring utilities stay isolated from the core backend model.

## Cross References

- Flutter integration plan: [docs/flutter](../../flutter)
- Project architecture: [docs/project/system-architecture.md](../../project/system-architecture.md)
- Reliability requirements: [docs/project/reliability-enterprise-requirements.md](../../project/reliability-enterprise-requirements.md)
- Flutter FastAPI integration details: [docs/flutter/fastapi-integration.md](../../flutter/fastapi-integration.md)