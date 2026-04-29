# Phase 3 Execution Plan

## Approach
Phase 3 will be executed incrementally. Core abstractions must be proven with unit tests before physical hardware integration begins.

## Milestones & Tasks

### Milestone 1: Abstraction & Core Routing
1. **Define `BaseDevice` & `DeviceCommand` Interfaces:** Create core contracts and capability flags (1 commit).
2. **Implement `DeviceManager` State Ownership:** Build the singleton/provider that owns `ConnectionState` (1-2 commits).
3. **Implement `EventBus` & `EventRouter`:** Build the async Pub/Sub and the routing layer that enforces priority (`SOS > Assist`) (2 commits).

### Milestone 2: Connection Resilience
1. **Build State Machine Engine:** Implement transitions (`idle` -> `connecting` -> `ready` -> `degraded` -> `reconnecting`) (1 commit).
2. **Implement Backoff Strategy:** Add the 1s -> 30s cap exponential backoff logic (1 commit).
3. **Background Resume Logic:** Add lifecycle observers to trigger fast-reconnect on app foregrounding (1 commit).

### Milestone 3: Device Adapters
1. **`SmartCaneAdapter` (BLE) - Handshake:** Implement connection and capability negotiation (1 commit).
2. **`SmartCaneAdapter` (BLE) - Events:** Map physical inputs to `ButtonPressEvent`s with immediate haptic ACK (1-2 commits).
3. **`SmartGoggleAdapter` (Wi-Fi):** Implement `HttpTransport` wrapper with strict timeouts for commands (2 commits).

### Milestone 4: Arbitration & Integration
1. **Connect Phase 2 Controllers:** Hook `SafetyController` to the `EventRouter` for SOS deduplication (1 commit).
2. **Implement `AssistSessionContext`:** Create the stateful context for multi-device actions (1-2 commits).
3. **Multi-Device Flow:** Wire the `AssistController` to request an image from the Goggle based on a Cane trigger (2 commits).

### Milestone 5: UI & Debugging
1. **Build Debug Screen Logic:** Implement structured log capture from `DeviceManager` and `EventBus` (1 commit).
2. **Build Debug UI Component:** Create the visual log list and filter UI (1 commit).
3. **Build Device Status UI:** Expose battery and health indicators on the main screen (1 commit).
4. **Manual Overrides:** Implement UI buttons for disconnect/retry (1 commit).

## Dependencies
- Phase 2 Safety Pipeline (Completed)
- Flutter Blue Plus (or equivalent BLE library)
- HTTP Client (Dio/http) for Wi-Fi Goggle comms.
