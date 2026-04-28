# Flutter Documentation (Production Plan)

This folder defines the production Flutter approach for 2ndEye.
It is written as an enterprise-ready blueprint with FastAPI-first backend contracts and optional external utility integrations where needed.

## Scope

- Architecture approach and boundaries
- Tech stack and platform services
- Lib folder structure and ownership rules
- Runtime model (foreground/background)
- Background-first device orchestration and reconnect behavior
- Data contracts and backend adapters
- Migration plan from Expo MVP
- Flutter execution roadmap for enterprise release planning
- Phase 1 foundation plan with edge cases and review checkpoints

## Reading Order

1. [architecture-approach.md](architecture-approach.md)
2. [tech-stack.md](tech-stack.md)
3. [library-structure.md](library-structure.md)
4. [runtime-reliability.md](runtime-reliability.md)
5. [backend-abstraction.md](backend-abstraction.md)
6. [device-orchestration.md](device-orchestration.md)
7. [fastapi-integration.md](fastapi-integration.md)
8. [roadmap.md](roadmap.md)
9. [phase-1-foundation-plan.md](phase-1-foundation-plan.md)
10. [migration-mapping.md](migration-mapping.md)

## Working Principle

The Flutter app should behave like the product platform, not a demo port. Expo is reference-only, while Flutter is the production target that becomes quiet after setup and then keeps the system stable in the background.

- One-time initial setup should register devices, permissions, and trusted contacts.
- After setup, the app should prefer automated recovery over repeated user intervention.
- Background services should keep critical device sessions alive whenever the platform allows it.
- User prompts should be reserved for setup, exceptions, and recovery situations that need confirmation.
- Flutter should keep safety writes queued locally until the backend confirms them.
- FastAPI should remain the source of truth for auth, data, and safety state.
- The first hardware release should treat the Smart Cane and Wi-Fi Smart Goggle as a simultaneous multi-device baseline, not a later enhancement.
- Firebase should stay narrow and utility-focused, such as push delivery, rather than becoming the primary backend or identity system.

## Cross-References

- Project overview: [docs/project](../project)
- MVP baseline: [docs/project/current-mvp-baseline-expo.md](../project/current-mvp-baseline-expo.md)
- Reliability requirements: [docs/project/reliability-enterprise-requirements.md](../project/reliability-enterprise-requirements.md)
