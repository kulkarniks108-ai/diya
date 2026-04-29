# Phase 3 Execution Plan

## Approach
Phase 3 will be executed incrementally. Core abstractions must be proven with unit tests before physical hardware integration begins.

## Milestones & Tasks

### Milestone 1: Abstraction & Core Routing
1. **Define `BaseDevice` Interface:** Implement the core contract with capability flags (`supportsCamera`, `supportsHaptics`, etc.).
2. **Implement `EventBus`:** Create the asynchronous Pub/Sub router. Add unit tests ensuring events are dispatched without blocking.
3. **Implement `DeviceManager`:** Build the centralized connection state tracker.

### Milestone 2: Connection Resilience
1. **Build State Machine:** Implement transitions (`idle` -> `connecting` -> `ready` -> `degraded` -> `reconnecting`).
2. **Implement Backoff Strategy:** Add the exponential backoff logic (1s -> 30s cap) to the reconnect flow.
3. **Write Failure Tests:** Simulate dropped connections and verify the `DeviceManager` recovers correctly without locking the main thread.

### Milestone 3: Device Adapters
1. **`SmartCaneAdapter` (BLE):** Implement the `BleTransport` wrapper. Map physical button inputs to `ButtonPressEvent`s. Implement immediate local haptic ACK.
2. **`SmartGoggleAdapter` (Wi-Fi):** Implement the `HttpTransport` wrapper. Build the command/response execution pattern with strict timeouts.

### Milestone 4: Arbitration & Integration
1. **Connect to Phase 2 Controllers:** Update `AssistController` and `SafetyController` to listen to the `EventBus`.
2. **Implement Multi-Device Coordination:** Write the logic where `AssistController` requests an image from the Goggle based on a Cane trigger.
3. **Deduplication Verification:** Ensure the 5-second deduplication logic correctly filters spam events across the bus.

### Milestone 5: UI & Debugging
1. **Build Debug Screen:** Create the structured log UI component.
2. **Build Device Status UI:** Expose battery and health states to the user.
3. **Manual Overrides:** Implement UI controls for forced disconnection and retry.

## Dependencies
- Phase 2 Safety Pipeline (Completed)
- Flutter Blue Plus (or equivalent BLE library)
- HTTP Client (Dio/http) for Wi-Fi Goggle comms.
