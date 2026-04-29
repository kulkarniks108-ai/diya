# Phase 3: System Overview (Device Orchestration)

## What is Phase 3?
Phase 3 builds the **Device Orchestration Layer**. It is the critical bridge connecting the physical hardware environment (Smart Cane, Smart Goggles) to the Flutter application's intelligence and backend persistence. 

In Phase 1, we established the baseline MVP. In Phase 2, we hardened the backend, introduced the safety pipeline, and built rock-solid offline queues with bounded retries. Phase 3 relies on Phase 2's robustness to ingest physical button presses, coordinate hardware sensors, and act as a reliable event arbitrator.

## System Goals
1. **Hardware-to-Digital Bridge:** Build a reliable, modular, event-driven system that links hardware devices to the app with real-time feedback.
2. **Deterministic Arbitration:** The Flutter app acts as the **only** event arbitrator. The backend provides persistence and compute but contains no device-specific logic. 
3. **Resilience First:** No silent failures, no app crashes due to hardware errors. The system automatically recovers, manages backoffs, and notifies the user predictably.
4. **Modularity:** Ensure devices are decoupled. Transports (BLE, Wi-Fi, USB) and device implementations must plug into a shared abstraction.

## Core Philosophy
The defining engineering principle of Phase 3 is:
> **Devices are inherently unreliable; the system must be reliably designed around them.**

Hardware will drop connections, run out of battery, and send garbled packets. The Orchestration Layer anticipates these failures. It operates completely asynchronously, isolating the core Flutter application state from device-level instability.

## High-Level Integration
1. **Device Level (Unreliable):** Emits physical signals and button presses. Operates over BLE or Wi-Fi.
2. **Orchestration Layer (Flutter):** Connects, monitors health, and translates raw signals into logical `Events`. Uses an asynchronous `EventBus` as a dumb router.
3. **Feature Controllers (Intelligent):** The `AssistController` or `SafetyController` (from Phase 2) listen to the `EventBus`. They arbitrate conflicts (e.g., SOS > Assist) and deduplicate requests.
4. **Backend (Compute & State):** Receives structured API requests from the controllers, handling heavy compute (AI) and durable state (PostgreSQL).

## Key Boundaries
* **NO AI in this layer:** AI pipelines are strictly backend or downstream features. Phase 3 only handles the *triggers* for these pipelines.
* **NO Backend Device Logic:** The backend knows about users and events, but it does not manage BLE handshakes or hardware schemas.
* **NO Continuous Streaming:** Telemetry is strictly event-driven or low-frequency (e.g., battery). High-frequency streams are deferred.
