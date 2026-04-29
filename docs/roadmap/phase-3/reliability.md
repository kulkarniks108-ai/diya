# Reliability & Failure Handling

## The Reliability Rule
**No silent failures. Never crash the app due to a device.**

Phase 3 is built under the assumption that the physical environment is chaotic. The hardware will fail, batteries will die, and RF environments will be noisy.

## Failure Scenarios & Mitigations

### 1. Connection Drops (RF Interference, Distance)
- **Symptom:** BLE connection to Cane drops, or Wi-Fi to Goggle times out.
- **Mitigation:** The `DeviceManager` transitions the device to `degraded`. If the connection is fully severed, it enters `reconnecting`. The UI is notified of the state change, and the exponential backoff strategy (1s -> 30s) takes over. The user is never blocked from using the app interface.

### 2. Firmware Mismatch
- **Symptom:** A device connects but presents an outdated or unsupported API contract during handshake.
- **Mitigation:** Enter **Safe Mode**. The connection remains active, but unsupported capabilities (e.g., `supportsCamera` or a new button mapping) are flagged as `false`. An error event is emitted for logging, and the UI displays a warning.

### 3. Command Timeout
- **Symptom:** The `AssistController` asks the Goggle for an image, but the device hangs.
- **Mitigation:** Strict timeouts. Critical commands have a 3-second timeout limit. If the device fails to respond, a `HardwareErrorEvent` is placed on the EventBus. The Controller catches this, aborts the hardware operation, and gracefully falls back to the phone's native camera.

### 4. Overlapping Critical Events
- **Symptom:** User panics and spams the SOS button on the Cane while simultaneously pressing Assist.
- **Mitigation:** Controllers use priority (`SOS > Assist`). The SOS event wins immediately. The subsequent Assist events are blocked by the Controller's 5-second deduplication window (inherited from Phase 2). 

## Error Emission
Any error encountered at the Transport or Adapter level must be wrapped in a strongly typed `HardwareErrorEvent` and placed on the EventBus.
- Errors must contain: `deviceId`, `timestamp`, `errorCode`, and `message`.
- This ensures the UI can present user-friendly error messages without embedding hardware try/catch blocks in the view layer.
