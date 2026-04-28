# Phase 1 Foundation Plan

This document turns the Phase 1 roadmap item into a concrete, reviewable plan for the first Flutter implementation pass.

Important rule: Phase 1 should create a stable foundation without over-finalizing any area that may change as future accessories, providers, or platform constraints emerge.

## Purpose

Phase 1 exists to make the app buildable in a clean, maintainable way before any deep feature work begins.

It should establish:

- app shell and route structure
- state boundaries and ownership
- local persistence and recovery rules
- networking/auth plumbing
- shared error handling and telemetry hooks
- a testable boundary for future device and provider changes

## What We Will Do Next

1. Define the app shell, route hierarchy, and top-level navigation states.
2. Define Riverpod provider boundaries for app, auth, device, and safety state.
3. Define local persistence for session, queue, and recovery data.
4. Define Dio client rules for auth refresh, retries, and error normalization.
5. Define shared UI and design primitives so feature work stays consistent.
6. Define test seams and review checkpoints before any feature code is written.

## What Must Stay Provisional

These areas should be treated as adaptable, not frozen:

- Future accessories beyond Smart Cane and Wi‑Fi Smart Goggle
- AI provider selection and switching logic
- Push delivery implementation details
- Background execution limits per platform
- Arbitration rules that may need tuning after real hardware testing
- Recovery behavior for devices we have not yet built

## Phase 1 Scope

### In Scope

- App bootstrap and root shell
- Route map for onboarding, auth, assist, safety, and device views
- Riverpod provider layering
- Shared theming and layout tokens
- Local queue and durable storage policy
- API client wrapper and error mapping strategy
- A minimal diagnostics surface for support and debugging

### Out of Scope for Phase 1

- Full assist logic
- Full safety workflows
- Device firmware integration details
- Provider-specific AI orchestration logic
- Final arbitration policy tuning beyond the documented baseline

## Foundation Decisions To Make

These decisions should be made now, but kept reversible if later testing disproves them.

### 1. App Shell Shape

- Decide the top-level navigation model.
- Decide whether onboarding is a separate stack or part of the main shell.
- Decide how auth state transitions move the user between shells.

### 2. State Ownership

- App-wide state: session, theme, connectivity, and support metadata.
- Feature state: assist, safety, device, and setup flows.
- Local-only state: queued actions and temporary recovery state.

### 3. Storage Boundary

- Store only what is needed for recovery, retry, and safety continuity.
- Keep transient UI state out of long-term storage.
- Make queue data replayable and dedupable.

### 4. Network Boundary

- Standardize auth header attachment and refresh behavior.
- Normalize backend errors into a single app-level failure model.
- Keep retry logic bounded and safe.

## Future Edge-Case Audit

These are not final answers; they are the cases Phase 1 must leave room for.

1. Cane and goggle both emit events at nearly the same time.
2. The app restarts while an offline queue is pending.
3. Auth refresh fails while the app is backgrounded.
4. A permission is revoked mid-session.
5. The phone camera and goggle camera disagree on source availability.
6. Push delivery provider changes later.
7. A new accessory class is added after launch.
8. The backend contract changes and a client update is temporarily behind.
9. A device reconnects after the app has already recovered locally.
10. The OS kills the app during a safety action.

## Review And Test Checklist

### Architecture Review

- Can a new feature be added without rewriting the app shell?
- Is every major boundary testable in isolation?
- Is any business logic living inside the screen layer that should be in a service or repository?
- Can future accessories be added through adapters rather than reworking app structure?

### Recovery Review

- Does the app recover from restart without losing critical state?
- Does the app know what to do if the network disappears mid-action?
- Are queued actions clearly marked and safely replayable?
- Are failure states recoverable rather than terminal where possible?

### Contract Review

- Does the client handle expired tokens deterministically?
- Does the error model preserve trace IDs and useful support context?
- Is the API client resilient to backend retries and duplicate submissions?

### Safety Review

- Can the app preserve safety intent if the network is down?
- Is the user informed when a safety action is pending or incomplete?
- Does the design avoid silent failure for SOS or location-related paths?

### Future-Change Review

- Can we swap AI providers later without a redesign?
- Can we add new device transports later without breaking current flows?
- Can we change push delivery strategy without touching core state boundaries?

## How To Test The Plan Before Coding

Use these review scenarios to validate the design on paper before implementation:

1. Cold start with no session.
2. Cold start with valid session and stale local queue.
3. Refresh token expiry during background use.
4. Simultaneous cane and goggle event arrival.
5. Permission revoked while a device session is active.
6. App killed while a safety action is pending.
7. Backend returns a new error code that the client does not yet know.

For each scenario, confirm:

- what the user sees
- what the app stores locally
- what the backend receives
- what is retried automatically
- what is explicitly escalated to the user

## What We Will Not Finalize Yet

- exact device arbitration tuning under real hardware data
- final AI provider selection strategy
- final push provider details beyond utility use
- platform-specific background implementation details
- any behavior that depends on a device we have not yet tested

## Completion Criteria For Phase 1

Phase 1 is complete when:

- the app shell and routing are stable
- the state boundaries are clear and testable
- local persistence and recovery rules are defined
- API and auth plumbing are in place
- the team can review edge cases without redesigning the foundation
