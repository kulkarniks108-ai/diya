# System Architecture

## Architecture Objective

Build a modular assistive platform where the smartphone app is the orchestration center, optional accessories are pluggable capability extensions, and safety-critical workflows remain reliable under real-world failure conditions.

## Logical Architecture Layers

1. Experience Layer
- Voice-first interaction
- Accessibility-compatible UI flows
- Family safety monitoring views

2. Orchestration Layer
- Session and state coordination
- Device event routing and prioritization
- Recovery and fallback decisioning

3. Intelligence Layer
- On-device inference for offline continuity
- Cloud AI for advanced interpretation when connectivity is available
- Context fusion across camera, sensors, and user intent

4. Connectivity Layer
- BLE, Wi-Fi, and USB channel management
- Accessory lifecycle management
- Reconnection and conflict resolution

5. Platform Services Layer
- Identity and access
- Real-time safety state and event propagation
- Notification and messaging pipelines

6. Observability and Governance Layer
- Health monitoring
- Structured event logging
- Operational diagnostics and incident analysis

## Core Modules

## Mobile Core

Responsibilities:
- User session lifecycle
- Role-aware navigation and permissions
- Voice guidance and local interaction control

## Assistive Intelligence Core

Responsibilities:
- Image and sensor input interpretation
- Prompt and context handling
- Speech/haptic output generation

## Safety Core

Responsibilities:
- Live location state
- SOS trigger, propagation, and reset flows
- Caregiver state update consistency

## Device Orchestration Core

Responsibilities:
- Accessory registration and trust
- Event protocol adaptation
- Multi-device concurrency and reconnect management

## Integration Core

Responsibilities:
- Cloud APIs and backend contracts
- Token lifecycle and notification pipelines
- Third-party extension API boundaries

## Architecture Data Flows

## Flow 1: Assistive Interpretation

Input capture -> local preprocessing -> AI interpretation (local or cloud) -> prioritized guidance output (speech/haptic) -> interaction state update

## Flow 2: Safety Escalation

SOS trigger -> local safety state lock -> backend state write -> caregiver notification dispatch -> acknowledgment and follow-up state

## Flow 3: Accessory Event Orchestration

Accessory event -> protocol normalization -> policy evaluation -> action routing -> user feedback + telemetry logging

## Flow 4: Recovery and Reconnect

Health signal loss -> detection -> retry policy -> channel re-establishment -> consistency reconciliation -> resumed operation

## Architecture Principles

1. Modular by default
- New device classes should not require foundational redesign.

2. Degrade gracefully
- System should retain partial utility when one component fails.

3. Safety-first state handling
- Critical workflows should be deterministic and auditable.

4. Background-capable operation
- Core monitoring and recovery should not depend on foreground UI.

5. Extensible integration boundaries
- Open API-aligned design for future ecosystem integrations.

## Current Baseline Reference

Current MVP implementation signals and constraints are captured in:
- [current-mvp-baseline-expo.md](current-mvp-baseline-expo.md)
- [expoApp/app/_layout.tsx](../../expoApp/app/_layout.tsx)
- [expoApp/services/ble/esp32Adapter.ts](../../expoApp/services/ble/esp32Adapter.ts)
- [expoApp/store/live.ts](../../expoApp/store/live.ts)
