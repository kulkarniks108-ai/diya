# Event System

## Core Design
The Phase 3 Event System relies on a simple, strictly asynchronous Pub/Sub model. The `EventBus` acts purely as a dumb router. 

By design, **device level signals are not merged.** All signals flow up to the controllers where decisions are made.

## Event Types
Events are strongly typed subclasses of a core `HardwareEvent`. 
- `ButtonPressEvent(deviceId, buttonId, pressType)`
- `HardwareErrorEvent(deviceId, errorCode, message)`
- `TelemetryEvent(deviceId, batteryLevel, status)`

## Routing & Arbitration Rules
1. **The EventBus is Asynchronous:** Handlers receive events without blocking the device communication thread.
2. **Immediate Local ACK:** For critical workflows, the local adapter is responsible for providing immediate feedback. For example, when a long-press SOS is detected on the Cane, the `SmartCaneAdapter` triggers a haptic pulse immediately, then puts the `ButtonPressEvent(SOS)` on the EventBus.
3. **Controller Arbitration:** Controllers are intelligent. They receive raw events and apply the following priority:
   `SOS > Assist > Others`
4. **First Valid Wins:** If two devices fire an overlapping command (e.g., Assist pressed on Cane and App UI), the first valid high-priority event is processed, and subsequent events within the deduplication window are dropped.

## Deduplication
Deduplication is **explicitly removed** from the EventBus and DeviceManager. 
- It is handled at the **Service Layer**. 
- Phase 2’s `SafetyService` is responsible for checking if an SOS event has already been queued or dispatched within the 5-second idempotency window.
- This ensures that deduplication logic can be tailored to the specific business requirements of the feature (e.g., SOS requires strict deduplication, volume toggles do not).

## Multi-Device Flow Example
**Scenario:** User requests Assist while wearing the Smart Goggle and holding the Smart Cane.

1. **Trigger:** User short-presses Button 1 on the Smart Cane.
2. **Adapter:** `SmartCaneAdapter` detects the short press, pulses a haptic ACK locally, and emits `ButtonPressEvent(QuickAssist)`.
3. **Bus:** `EventBus` broadcasts the event.
4. **Controller:** `AssistController` consumes the event. It sets its state to "processing" (ignoring duplicate presses).
5. **Coordination:** `AssistController` queries `DeviceManager` for active devices with `supportsCamera: true`.
6. **Command:** `AssistController` targets the `SmartGoggleAdapter` and issues a `captureImage()` command.
7. **Resolution:** The image is returned, the Controller builds the API payload, and passes it to the Backend.
