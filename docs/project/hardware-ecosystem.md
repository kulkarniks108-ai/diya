# Hardware Ecosystem

## Hardware Philosophy

The platform is designed as hardware-optional but hardware-enhanceable.
Users can begin with phone-only capability and add accessories progressively without losing baseline functionality.

## Device Classes

## Smart Cane

Primary role:
- Proximity and movement-aware safety extension

Planned capabilities:
- Real-time ultrasonic sensor streaming
- Haptic feedback motors for directional or risk cues
- Customizable multi-button input model
- Button pattern actions: single, double, triple, long press
- Battery telemetry reporting
- Optional extra sensor support over time

Primary connectivity:
- BLE

Expected interaction contracts:
- Assist trigger from button input
- Live-tracking toggle input
- Safety and mode-change haptic response

## Smart Goggle

Primary role:
- External visual sensing and guided audio/haptic output channel

Planned capabilities:
- Camera stream/input to replace or augment mobile camera capture
- Audio guidance output through integrated earphone path
- Haptic feedback for urgent signaling

Primary connectivity:
- Wi-Fi and USB

Expected interaction contracts:
- Camera source arbitration with phone camera
- Low-latency guidance delivery channel
- Recovery behavior when stream quality degrades

## Smart Bracelet / Smart Ring / Smart Neckband / Smart Case

Primary role:
- Wearable interaction and feedback extensions

Planned capabilities:
- Quick action triggers
- Contextual haptic signaling
- Optional biometrics or auxiliary telemetry in future phases

Primary connectivity:
- BLE (with possible Wi-Fi variants by accessory class)

Expected interaction contracts:
- Coexistence with cane and goggle sessions
- Non-conflicting control patterns
- Automatic recovery on transient disconnect

## Multi-Accessory Concurrency Model

Target behavior:
- All approved accessories can remain connected at the same time
- User should not need manual reconnect after initial trusted pairing
- Connection manager handles health checks and recovery loops automatically

Key orchestration requirements:
1. Device identity and capability registry
2. Accessory priority and event arbitration rules
3. Channel-specific retry strategies
4. Duplicate event suppression and ordering guarantees
5. Safe fallback when one or more devices are unavailable

## Connectivity and Protocol Requirements

- Standardized event envelope independent of transport type
- Time-aware event ordering and idempotency handling
- Capability negotiation per accessory type
- Versioned protocol model for backward-compatible firmware updates

## Safety-Critical Hardware Behaviors

Minimum requirements:
- Explicit acknowledgment for critical actions (for example SOS trigger)
- Reliable haptic/audio confirmation paths
- Battery and device-health visibility to prevent silent failure
- Defined degraded-mode behavior when accessory capacity drops

## Current MVP Reference

Current baseline implementation currently demonstrates single-device BLE event handling through ESP32 and button-event mapping:
- [expoApp/types/esp32.ts](../../expoApp/types/esp32.ts)
- [expoApp/services/ble/esp32Adapter.ts](../../expoApp/services/ble/esp32Adapter.ts)
- [expoApp/core/hardwareTriggers.ts](../../expoApp/core/hardwareTriggers.ts)
- [expoApp/HARDWARE_QUICK_REFERENCE.md](../../expoApp/HARDWARE_QUICK_REFERENCE.md)
