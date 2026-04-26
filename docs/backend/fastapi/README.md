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
4. [realtime-and-notifications.md](realtime-and-notifications.md)
5. [data-model-and-events.md](data-model-and-events.md)
6. [ops-reliability.md](ops-reliability.md)

## Working Principle

The backend should stay reliable for safety-first flows.

- Flutter remains backend-neutral through repository and datasource adapters.
- FastAPI owns provider orchestration for auth, AI, realtime, and safety workflows.
- Active clients receive websocket updates.
- Inactive clients receive push notifications for critical events.
- Safety actions must remain idempotent and recoverable.

## Cross References

- Flutter integration plan: [docs/flutter](../../flutter)
- Project architecture: [docs/project/system-architecture.md](../../project/system-architecture.md)
- Reliability requirements: [docs/project/reliability-enterprise-requirements.md](../../project/reliability-enterprise-requirements.md)
