# Device Model & Capabilities

## Unified Capability Contract
To ensure the Flutter app can adapt to new accessories without heavy refactoring, every device in the system must expose its capabilities via explicit boolean flags. 

The `BaseDevice` contract requires the following capability definitions:
- `supportsCamera`: Can capture and transmit images.
- `supportsHaptics`: Can execute vibration/haptic feedback.
- `supportsAudio`: Can output audio or voice guidance.
- `supportsButtons`: Provides physical interactive triggers.

## Supported Devices (Phase 3 Baseline)

### 1. Smart Cane
**Transport:** `BleTransport`
**Capabilities:** `supportsButtons: true`, `supportsHaptics: true`
**Behavior:**
- Emits discrete events (button presses, obstacle alerts).
- Emits low-frequency telemetry (e.g., battery life updates every few minutes).
- **No** continuous streaming of raw ultrasonic data in Phase 3.

**Locked Button Mappings:**
- **Button 1 (Short Press):** Quick Assist
- **Button 1 (Long Press):** Detailed Assist
- **Button 2 (Long Press):** SOS 
*(Note: These mappings belong to the adapter/configuration layer; the core system treats them as extensible enums, not hardcoded behavior).*

### 2. Smart Goggle
**Transport:** `HttpTransport` (Wi-Fi Hotspot mode)
**Capabilities:** `supportsCamera: true`, `supportsAudio: true` (potentially)
**Behavior:**
- Operates primarily in a request/response model. The app issues a command (e.g., "capture image"), and the goggle responds.
- No continuous streaming for Phase 3.
- Designed with future extensibility in mind via `GoggleTransport` interface to eventually support `UsbTransport` as a serial interface.

## Extensibility & Safe Mode
When connecting a device, the adapter performs a handshake to verify the firmware version.

**Firmware Mismatch (Safe Mode):**
If the device firmware does not match the app's contract expectations:
1. The connection is **allowed**.
2. Unsupported or misaligned features are disabled by toggling capability flags to `false`.
3. A warning is logged, and the user is presented with an optional UI prompt to update firmware (future phase), but core functions remain available.
