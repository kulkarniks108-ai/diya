# Architecture: Device Orchestration Layer

## Overview
The Phase 3 architecture revolves around decoupling physical hardware implementation from product features. Devices communicate over arbitrary transports, normalize their data into generic events, and dispatch them onto an EventBus where intelligent controllers take over.

## 1. DeviceManager (Connection Lifecycle)
The `DeviceManager` acts as the master orchestrator for device lifecycles. It does not understand business logic or safety workflows. Its sole responsibilities are:
- Starting and stopping transport scans.
- Tracking the `ConnectionState` (idle, discovered, connecting, ready, degraded, reconnecting, failed, disconnected).
- Applying retry logic and exponential backoffs when devices are dropped.
- Passing structured connection state changes to the UI.

## 2. BaseDevice & Adapters (Abstraction)
Every hardware piece must implement the `BaseDevice` interface. 
- **`BaseDevice`:** Exposes a unified contract detailing capabilities (`supportsCamera`, `supportsHaptics`, `supportsAudio`, `supportsButtons`), identity (MAC/IP, firmware), and health.
- **Adapters:** We use the Adapter pattern to map specific transports to `BaseDevice`.
  - `SmartCaneAdapter`: Wraps `BleTransport` and parses byte arrays into logical button presses.
  - `SmartGoggleAdapter`: Wraps `HttpTransport` (and in the future, `UsbTransport`) to manage HTTP capture commands.

## 3. EventBus (The Router)
The internal `EventBus` is an **asynchronous dumb router** (typically implemented as a simple Pub/Sub model or Stream controller). 
- It does **not** deduplicate.
- It does **not** prioritize or arbitrate.
- It simply takes an event from an Adapter and broadcasts it to any subscribed feature controllers.

*Exception for Haptics:* While the EventBus is asynchronous, critical events (like an SOS button press) require an immediate Haptic ACK. The device adapter itself triggers the ACK locally before dropping the event onto the asynchronous bus.

## 4. Feature Controllers (Arbitration & Logic)
Feature controllers (like Phase 2's `SafetyController` or the `AssistController`) subscribe to the `EventBus`. They provide the "brains" of the system:
- **Arbitration:** Controllers apply the priority rules (`SOS > Assist > others`). The first valid high-priority event wins.
- **Deduplication:** Services implement the 5-second idempotency window and maintain deduplication logic, ensuring the backend is not spammed.
- **Multi-Device Coordination:** Example: The `AssistController` hears an Assist trigger from the Cane. It checks the `DeviceManager` to see if a `SmartGoggle` is `ready` and has `supportsCamera: true`. It commands the Goggle to capture an image, then sends the coordinated payload to the backend.

## 5. Layering Summary
```text
[ Hardware Layer ]
    |
(BLE / HTTP / USB)
    v
[ Transport Layer ] (BleTransport, HttpTransport)
    |
[ Adapter Layer ]   (SmartCaneAdapter, SmartGoggleAdapter - implements BaseDevice)
    |
[ EventBus ]        (Simple Async Pub/Sub)
    |
[ Controllers ]     (AssistController, SafetyController - handles conflicts & deduplication)
    |
[ UI & Backend ]    (UI reflects state; Backend handles compute/persistence)
```
