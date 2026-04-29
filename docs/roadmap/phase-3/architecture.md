# Architecture: Device Orchestration Layer

## Overview
The Phase 3 architecture revolves around decoupling physical hardware implementation from product features. Devices communicate over arbitrary transports, normalize their data into generic events, and dispatch them onto an EventBus where intelligent controllers take over.

## 1. DeviceManager (State Ownership)
The `DeviceManager` is the **single source of truth** for device state. It acts as the master orchestrator for connection lifecycles and does not understand business logic. Its core responsibilities are:
- **State Ownership:** The UI reads device state *only* from the `DeviceManager`. Neither the `EventBus` nor the feature `Controllers` store or cache device state.
- **Connection Management:** Starting and stopping transport scans, and tracking the `ConnectionState` (idle, discovered, connecting, ready, degraded, reconnecting, failed, disconnected).
- **Resilience:** Applying retry logic and exponential backoffs when devices drop.

## 2. BaseDevice & Adapters (Abstraction)
Every hardware piece must implement the `BaseDevice` interface. 
- **`BaseDevice`:** Exposes a unified contract detailing capabilities (`supportsCamera`, `supportsHaptics`, `supportsAudio`, `supportsButtons`), identity (MAC/IP, firmware), and health.
- **Adapters:** We use the Adapter pattern to map specific transports to `BaseDevice`.
  - `SmartCaneAdapter`: Wraps `BleTransport` and parses byte arrays into logical button presses.
  - `SmartGoggleAdapter`: Wraps `HttpTransport` (and in the future, `UsbTransport`) to manage HTTP capture commands.

## 3. Event Routing Layer (EventBus & EventRouter)
The system uses a decoupled event pipeline: **`EventBus -> EventRouter -> Controller`**.
- **`EventBus`:** An **asynchronous dumb router** (simple Pub/Sub). It takes an event from an Adapter and broadcasts it instantly. It does not store state, deduplicate, or prioritize.
- **`EventRouter`:** A centralized routing layer that intercepts events before they reach controllers. It applies **priority enforcement** (`SOS > Assist > others`) so that high-priority events preempt lower-priority traffic.

*Exception for Haptics:* While the EventBus is asynchronous, critical events (like an SOS button press) require an immediate Haptic ACK. The device adapter itself triggers the ACK locally before dropping the event onto the asynchronous bus.

## 4. Command Pipeline (Reverse Flow)
To interact back with devices, the system uses a strictly defined reverse pipeline:
**`Controller -> Command -> DeviceManager -> DeviceAdapter`**
- **Command Abstraction:** Controllers do not call devices directly. They dispatch standard `DeviceCommand` objects (e.g., `VibrateCommand(duration)`, `CaptureImageCommand()`).
- **Execution:** The `DeviceManager` routes the command to the correct `DeviceAdapter`, ensuring hardware communication goes through a single bottleneck for safety and state consistency.

## 5. Feature Controllers (Logic & Deduplication)
Feature controllers (like Phase 2's `SafetyController` or the `AssistController`) subscribe to the `EventBus`. They provide the "brains" of the system:
- **Arbitration:** Controllers apply the priority rules (`SOS > Assist > others`). The first valid high-priority event wins.
- **Deduplication:** Services implement the 5-second idempotency window and maintain deduplication logic, ensuring the backend is not spammed.
- **Multi-Device Coordination:** Example: The `AssistController` hears an Assist trigger from the Cane. It checks the `DeviceManager` to see if a `SmartGoggle` is `ready` and has `supportsCamera: true`. It commands the Goggle to capture an image, then sends the coordinated payload to the backend.

## 6. Layering Summary
```text
[ Hardware Layer ]
    |
(BLE / HTTP / USB)
    v
[ Transport Layer ] (BleTransport, HttpTransport)
    |
[ Adapter Layer ]   (SmartCaneAdapter, SmartGoggleAdapter)
   | Events                ^ Commands
[ EventBus ]        [ DeviceManager ]
   |                       |
[ EventRouter ]            |
   |                       |
[ Controllers ] -----------+
   |
[ UI & Backend ]    (UI reflects state; Backend handles compute/persistence)
```
