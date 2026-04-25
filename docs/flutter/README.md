# Flutter Documentation (Production Plan)

This folder defines the production Flutter approach for 2ndEye.
It is written as an enterprise-ready blueprint with backend-neutral contracts (Firebase now, FastAPI-ready later).

## Scope

- Architecture approach and boundaries
- Tech stack and platform services
- Lib folder structure and ownership rules
- Runtime model (foreground/background)
- Background-first device orchestration and reconnect behavior
- Data contracts and backend adapters
- Migration plan from Expo MVP

## Reading Order

1. [architecture-approach.md](architecture-approach.md)
2. [tech-stack.md](tech-stack.md)
3. [library-structure.md](library-structure.md)
4. [runtime-reliability.md](runtime-reliability.md)
5. [backend-abstraction.md](backend-abstraction.md)
6. [device-orchestration.md](device-orchestration.md)
7. [migration-mapping.md](migration-mapping.md)

## Working Principle

The Flutter app should behave like a control center that becomes quiet after setup and then keeps the system stable in the background.

- One-time initial setup should register devices, permissions, and trusted contacts.
- After setup, the app should prefer automated recovery over repeated user intervention.
- Background services should keep critical device sessions alive whenever the platform allows it.
- User prompts should be reserved for setup, exceptions, and recovery situations that need confirmation.

## Cross-References

- Project overview: [docs/project](../project)
- MVP baseline: [docs/project/current-mvp-baseline-expo.md](../project/current-mvp-baseline-expo.md)
- Reliability requirements: [docs/project/reliability-enterprise-requirements.md](../project/reliability-enterprise-requirements.md)
