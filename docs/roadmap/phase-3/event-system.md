# Event System

## Core Design
The Phase 3 Event System relies on a decoupled event pipeline: **`EventBus -> EventRouter -> Controller`**. 

- **`EventBus`:** A simple, strictly asynchronous Pub/Sub model. It acts purely as a dumb router.
- **`EventRouter`:** Intercepts events from the bus and enforces prioritization before they reach the controllers.

By design, **device level signals are not merged.** All signals flow up through the router to the controllers where decisions are made.

## Event Types
Events are strongly typed subclasses of a core `HardwareEvent`. 
- `ButtonPressEvent(deviceId, buttonId, pressType)`
- `HardwareErrorEvent(deviceId, errorCode, message)`
- `TelemetryEvent(deviceId, batteryLevel, status)`

## Routing & Arbitration Rules
1. **The EventBus is Asynchronous:** Handlers receive events without blocking the device communication thread.
2. **Immediate Local ACK:** For critical workflows, the local adapter is responsible for providing immediate feedback. For example, when a long-press SOS is detected on the Cane, the `SmartCaneAdapter` triggers a haptic pulse immediately, then puts the `ButtonPressEvent(SOS)` on the EventBus.
3. **EventRouter Enforcement:** The `EventRouter` intercepts raw events and applies the global priority rule:
   `SOS > Assist > Others`
4. **First Valid Wins:** If two devices fire an overlapping command (e.g., Assist pressed on Cane and App UI), the router ensures the first valid high-priority event is processed, and subsequent events within the deduplication window are dropped.

## Deduplication
Deduplication is **explicitly removed** from the EventBus and DeviceManager. 
- It is handled at the **Service Layer**. 
- Phase 2’s `SafetyService` is responsible for checking if an SOS event has already been queued or dispatched within the 5-second idempotency window.
- This ensures that deduplication logic can be tailored to the specific business requirements of the feature (e.g., SOS requires strict deduplication, volume toggles do not).

## Multi-Device Coordination: AssistSessionContext
To coordinate multiple devices (e.g., Cane + Goggle), the `AssistController` creates an `AssistSessionContext`. This runtime context holds the state of an ongoing multi-device action.

**Scenario:** User requests Assist while wearing the Smart Goggle and holding the Smart Cane.

1. **Trigger:** User short-presses Button 1 on the Smart Cane.
2. **Adapter:** `SmartCaneAdapter` detects the short press, pulses a haptic ACK locally, and emits `ButtonPressEvent(QuickAssist)`.
3. **Routing:** `EventBus` broadcasts the event, and `EventRouter` validates its priority.
4. **Context Creation:** `AssistController` consumes the event and initializes an `AssistSessionContext`. It sets the session state to "processing" (blocking duplicate presses).
5. **Coordination:** The `AssistController` checks the `DeviceManager` for active devices with `supportsCamera: true`.
6. **Command:** The `AssistController` dispatches a `CaptureImageCommand()` to the `DeviceManager`, which routes it to the `SmartGoggleAdapter`.
7. **Resolution:** The image is returned to the `AssistSessionContext`. The Controller builds the API payload and passes it to the Backend.
