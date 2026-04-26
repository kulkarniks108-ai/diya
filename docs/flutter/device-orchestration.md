# Device Orchestration

This document defines the background-first connectivity model for Smart Cane, Smart Goggle variants, and future accessories.

## Goal
- Keep connected hardware stable after one-time setup.
- Detect, reconnect, and recover devices automatically whenever possible.
- Support different transports and device models without rewriting feature logic.

## Unified Device Model
Every connected accessory should expose the same logical contract, regardless of transport.

- **Identity:** stable device id, model, firmware version, transport type
- **Capabilities:** obstacle sensing, camera, audio guidance, haptics, battery telemetry, trigger buttons
- **Health:** connected, degraded, reconnecting, failed, unknown
- **Session:** active, paused, restored, pending-auth, expired

## Transport Strategy
- **Smart Cane:** BLE-first, optimized for low-latency sensor and button events.
- **Smart Goggle (Wi-Fi):** primary transport for camera-heavy and audio-guidance models.
- **Smart Goggle (USB):** distinct model with its own UX and lifecycle, treated as a separate transport variant rather than a fallback copy.
- **Future devices:** added through adapters that implement the same logical contract.

## Orchestration Rules
- Discovery, pairing, reconnect, and session ownership should be controlled by one orchestration layer.
- The app should not let each feature manage its own connection lifecycle.
- Command routing should use capability and transport metadata, not hardcoded device assumptions.
- The system should prefer automatic recovery over user prompts unless a safety decision or pairing step is required.

## State Model
- idle
- discovered
- connecting
- ready
- degraded
- reconnecting
- failed
- disconnected

## Sensor Handling
- Ultrasonic data should be handled as a hybrid stream: low-rate continuous telemetry plus high-priority danger events.
- Thresholds should be configurable per device class so cane and goggle sensors can evolve independently.
- Multiple sensor sources should be normalized before guidance logic consumes them.

## Reliability Rules
- Command delivery should use ack, timeout, retry budget, and dedupe keys.
- Health checks should run in the background where allowed and should mark devices degraded before they fully fail.
- Reconnect attempts should be bounded and observable so the runtime stays stable instead of looping forever.

## Why This Structure Works
- It supports one-time setup followed by mostly automatic background operation.
- It keeps transports modular, so BLE, Wi-Fi, and USB can evolve separately.
- It reduces UI coupling, which improves background reliability and future maintainability.

---

**Next:** See [runtime-reliability.md](runtime-reliability.md) for the foreground/background execution model.