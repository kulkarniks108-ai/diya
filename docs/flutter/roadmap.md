# Flutter Roadmap

This roadmap turns the Flutter plan into an execution sequence for a reliable, maintainable, enterprise-grade production app.

The assumptions behind this roadmap are fixed for now:

- Flutter is the primary product track.
- Expo is reference-only and remains useful only as a lightweight proof of concept and behavioral reference.
- The first hardware release must support the Smart Cane and Wi-Fi Smart Goggle together.
- Firebase is allowed only as a narrow utility layer, such as push delivery, and should not become the main backend or identity system.
- The backend remains FastAPI-first and owns identity, domain state, realtime coordination, and persistence.

## Roadmap Goals

1. Deliver a production Flutter architecture that stays clean, testable, and easy to maintain.
2. Build the app around real operating conditions: background execution, intermittent connectivity, accessory reconnection, and safety-critical flows.
3. Support both accessory classes from the beginning of the hardware release path so the user does not have to choose between cane and goggle support.
4. Keep the mobile app thin enough that most business rules live in explicit domain services or backend contracts rather than in screens.
5. Establish release gates that make reliability, observability, and accessibility mandatory rather than optional.

## Product Shape

The Flutter app should be treated as a control platform with three visible responsibilities:

- Assistive guidance for the blind user.
- Safety workflows for SOS, location, and escalation.
- Accessory orchestration for Smart Cane, Wi-Fi Smart Goggle, and later devices.

The app should not be designed around a screen-first consumer app pattern. It should be designed around persistent device sessions, recoverable actions, and clear state ownership.

## Non-Goals For The First Release

- Recreating every Expo implementation detail.
- Treating Firebase as the main backend.
- Shipping a loosely coupled demo architecture that cannot survive background operation.
- Shipping single-device-only orchestration and calling it finished.
- Letting business rules live inside UI widgets.

## Quality Bar

The roadmap should be judged against the following production expectations:

- Maintainable code structure with explicit ownership boundaries.
- Deterministic state transitions for auth, device health, and safety flows.
- Bounded retry behavior and no infinite reconnect loops.
- Local persistence for critical queued actions.
- Structured observability with traceable failures.
- Accessibility-first interaction patterns.
- Clear recovery behavior when the app is killed, the network is lost, or an accessory disconnects.

## Recommended Operating Targets

These are planning targets, not promises:

- Critical safety actions should acknowledge quickly and avoid unnecessary intermediate states.
- Reconnect behavior should be bounded and observable rather than aggressive and noisy.
- The app should stay usable when one accessory fails while another still works.
- The system should prefer safe degradation over hard failure.
- Release quality should be measured by behavior under failure, not just happy-path success.

## Phase 0: Contract Freeze And Release Framing

### Phase 0 Objective

Lock the product and technical boundaries before implementation expands.

### Phase 0 Deliverables

- Confirm Flutter as the production platform and Expo as reference only.
- Confirm Smart Cane plus Wi-Fi Smart Goggle as the first simultaneous accessory set.
- Confirm Firebase as utility-only.
- Define the minimum viable production feature set.
- Lock the backend contract surface for auth, safety, realtime, device state, and AI preferences.
- Define the primary app modules and ownership boundaries.
- Define the release naming strategy for future phases.

### Phase 0 Exit Criteria

- No open ambiguity about what Flutter is replacing.
- No open ambiguity about which accessory classes ship together.
- No open ambiguity about which responsibilities stay in Flutter versus FastAPI.

### Phase 0 Risks If Skipped

- The roadmap will drift into feature ideas instead of execution.
- Hardware or backend dependencies may be discovered too late.
- The app structure may become inconsistent across features.

## Phase 1: Flutter Foundation

### Phase 1 Objective

Set up the app structure so every feature can be built the same way.

### Phase 1 Deliverables

- Clean Architecture layer map for presentation, domain, and data.
- Riverpod state strategy for global state and feature state.
- go_router route map for onboarding, auth, assist, safety, and device flows.
- Shared design system and theme primitives.
- Networking stack policy with request, refresh, retry, and error mapping rules.
- Local persistence strategy for queues, cache, and recoverable state.
- Shared error model and telemetry wrappers.

### Phase 1 Exit Criteria

- A new feature can be added without breaking the existing app shape.
- Auth, device, and safety modules can be tested in isolation.
- No screen owns backend rules directly.

### Phase 1 Recommended Gates

- Navigation works for all major app modes.
- The app can boot with no hidden manual setup steps.
- Local persistence can survive app restart.

### Phase 1 Review Path

Before coding starts, the team should review [phase-1-foundation-plan.md](phase-1-foundation-plan.md) for:

- feature scope boundaries
- future edge cases that must remain open
- app shell and navigation decisions
- test and review checkpoints
- recovery and fallback behavior

### Phase 1 Follow-Up Artifacts

To keep Phase 1 reviewable and future-proof, the team should also review:

- [phase-1-edge-case-audit.md](phase-1-edge-case-audit.md)
- [phase-1-review-test-checklist.md](phase-1-review-test-checklist.md)
- [phase-1-contract-drift-watchlist.md](phase-1-contract-drift-watchlist.md)

## Phase 2: Identity, Session, And Safety Core

### Phase 2 Objective

Make the core user account, access, and safety workflows dependable before the device surface expands.

### Phase 2 Deliverables

- Auth flow with login, refresh, and logout.
- Session state model that survives app restart.
- Secure storage rules for tokens and sensitive local metadata.
- Safety state model for SOS, location sharing, and contact visibility.
- Permission flow design for camera, microphone, Bluetooth, location, notifications, and background execution.
- Unified backend error handling from API to UI.
- Offline queueing for critical safety writes.

### Phase 2 Exit Criteria

- Login and refresh are deterministic.
- Safety actions can be queued safely when offline.
- Permission denial paths are explicit and recoverable.

### Phase 2 Recommended Gates

- Auth failure states are understandable to the user.
- Safety flows produce clear server-side outcomes and trace IDs.
- Critical actions can recover after app restart.

## Phase 3: Device Orchestration V1

### Phase 3 Objective

Design the device layer around concurrent Smart Cane and Wi-Fi Smart Goggle support.

### Phase 3 Deliverables

- Unified device model with identity, capabilities, health, and session state.
- Connection manager that can handle both accessory classes at the same time.
- Transport adapters for BLE and Wi-Fi.
- Health state machine for discovery, connecting, ready, degraded, reconnecting, failed, and disconnected.
- Deterministic command routing for assist, safety, and telemetry events.
- Device event deduplication and priority rules.
- Reconnect and retry policy with bounded backoff.

### Phase 3 Exit Criteria

- Cane and goggle can be active together without conflict.
- A failure in one accessory does not collapse the other accessory.
- Device sessions can recover without full user re-setup.

### Phase 3 Recommended Gates

- The app can route events from both devices simultaneously.
- Device health is visible to the user when action is needed.
- Fallback behavior is defined when one transport becomes unavailable.

## Phase 4: Assist And Safety Workflows

### Phase 4 Objective

Turn the assistive and emergency paths into end-to-end production flows.

### Phase 4 Deliverables

- Assist trigger flow from app or accessory.
- Camera source selection between phone and goggle.
- Guidance output normalization for cloud and on-device AI paths.
- SOS trigger flow with escalation and family notification.
- Location sharing and live state updates.
- Voice-first confirmation and recovery behavior.
- Accessible feedback through speech and haptics.

### Phase 4 Exit Criteria

- The user can ask for help and receive a result with minimal manual friction.
- SOS can propagate through the full system reliably.
- Family monitoring receives clear, actionable state.

### Phase 4 Recommended Gates

- Assist flow works when the app is foregrounded and when it is recovering from background.
- Safety flow remains understandable when the network degrades.
- Event ordering remains correct when multiple signals arrive close together.

## Phase 5: Reliability, Observability, And Recovery

### Phase 5 Objective

Make the app diagnosable and safe to operate in the field.

### Phase 5 Deliverables

- Structured logging and trace propagation.
- Error reporting strategy with recoverable and non-recoverable paths.
- Metrics for safety flow latency, reconnect behavior, and failure rates.
- Local recovery behavior for app kill, network loss, and accessory restarts.
- Clear retry budgets and dead-end handling.
- Support-friendly diagnostics surface for internal use.

### Phase 5 Exit Criteria

- Failures can be traced across mobile and backend.
- The app never loops forever on transient failure.
- Recovery can be reasoned about without guesswork.

### Phase 5 Recommended Gates

- Critical error states are observable in logs and metrics.
- Safety-related failures are not silently swallowed.
- The app can restart and continue from durable state.

## Phase 6: Release Hardening And Beta

### Phase 6 Objective

Prepare the app for a controlled real-world rollout.

### Phase 6 Deliverables

- Release checklist for Android and iOS.
- Device compatibility matrix.
- Manual QA and automated test coverage targets.
- Accessibility validation checklist.
- Performance baseline for startup, reconnect, and safety actions.
- Rollback and release escalation plan.
- User-facing setup and recovery guidance.

### Phase 6 Exit Criteria

- The release candidate is stable under repeated real-device testing.
- Known failure modes are documented.
- Support and maintenance handoff is defined.

### Phase 6 Recommended Gates

- The app passes the highest-value user journeys end to end.
- Support can interpret failures from logs and trace IDs.
- The team can ship updates without breaking device continuity.

## Phase 7: Expansion And Platform Maturity

### Phase 7 Objective

Extend the platform after the first production shape is stable.

### Phase 7 Deliverables

- Additional accessory classes.
- Expanded AI customization options.
- More granular admin or caregiver controls.
- Broader automation and background optimization.
- Stronger compliance, cost, and operational controls.

### Phase 7 Exit Criteria

- New capabilities can be added without reworking the core app model.
- The platform remains maintainable as it grows.

## Suggested Roadmap Sequence

If the team wants a simple order of execution, I would use this:

1. Freeze the product and contract scope.
2. Build the Flutter foundation.
3. Implement identity, session, and safety core.
4. Add simultaneous Smart Cane and Wi-Fi Smart Goggle orchestration.
5. Ship assist and safety workflows end to end.
6. Harden observability and recovery.
7. Prepare beta and release.
8. Expand only after the core platform is stable.

## Open Decisions To Track

- What are the exact priority rules when both accessories emit events at the same time?
- What is the final push delivery strategy for Firebase utility services?
- What are the release-quality thresholds for safety latency and reconnect behavior?
- How much of AI customization should be user-facing in Flutter versus backend-managed?
- What is the simplest deployment shape that still meets production expectations?

## Roadmap Summary

The short version is this: build Flutter as the production platform, ship cane and Wi-Fi goggle support together, keep Firebase narrow, and make reliability and maintainability part of the release definition instead of add-ons.
