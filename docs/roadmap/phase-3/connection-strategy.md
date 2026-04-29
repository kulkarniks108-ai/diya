# Connection Strategy

## Overview
Phase 3 establishes a connection architecture that prioritizes resilience and background stability over constant connectivity. Devices will disconnect. The app must handle this gracefully, automatically re-establishing connections when possible.

## Transport Topologies

### 1. BLE (Smart Cane)
- **Role:** Central (Phone) connects to Peripheral (Cane).
- **Optimization:** Tuned for low latency to ensure button presses and immediate haptic feedback operate without perceptible delay.
- **Backgrounding:** Relies on Flutter background execution where possible. Must survive app minimize and seamlessly reconnect upon resume.

### 2. Wi-Fi Hotspot (Smart Goggle)
- **Role:** Phone acts as the Wi-Fi Hotspot (Access Point). The Goggle connects as a client.
- **Assumption:** Android supports concurrent Hotspot and Mobile Data usage. 
- **Transport Abstraction:** Implemented via the `GoggleTransport` interface using the `HttpTransport` class.
- **Future-proofing:** The system is designed abstractly so that a future `UsbTransport` (acting as a serial interface) can seamlessly replace or augment the Wi-Fi connection without breaking business logic.

## Reconnection & State Machine

### Device States
1. `idle`: No connection attempt active.
2. `discovered`: Device found, pairing/handshake pending.
3. `connecting`: Establishing socket/BLE link.
4. `ready`: Connected, handshake complete, ready for commands.
5. `degraded`: Connection is poor (packet loss, high latency). System attempts recovery without dropping state.
6. `reconnecting`: Link dropped, attempting to re-establish.
7. `failed`: Recovery failed or manual disconnect.
8. `disconnected`: Intentional termination.

### Failure Flow
The system strictly follows: `degraded -> retry -> reconnect -> error`.

### Backoff Strategy
When a connection is lost unexpectedly, the `DeviceManager` attempts infinite retries but strictly controls the rate using an **Exponential Backoff** mechanism:
1. Attempt 1: **1 second** delay
2. Attempt 2: **2 second** delay
3. Attempt 3: **5 second** delay
4. Attempt 4: **10 second** delay
5. Attempt 5+: **30 second** delay (Capped limit)

This prevents battery drain and CPU hogging on the mobile device while ensuring eventual recovery.

## Background Execution Strategy
While full OS-level background services are planned for a future phase, Phase 3 implements basic background survival:
- The `DeviceManager` maintains state memory.
- When the app is minimized, active transports are held open natively if the OS allows.
- Upon app foregrounding/resume, the `DeviceManager` instantly triggers the `reconnecting` flow if devices were dropped.
