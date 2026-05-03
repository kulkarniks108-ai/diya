# 2ndEye Debug Dashboard Roadmap

## Purpose
A dedicated, real-time, zero-mock UI panel allowing developers and testers to observe, interact with, and diagnose the entire hardware abstraction layer and SOS pipeline from within the running application.

## Access Mechanism
- **Global Hidden Trigger:** A `GestureDetector` spanning the root `MaterialApp` captures rapid tap sequences.
- **Activation:** 5 continuous taps on the top edge of the screen routes the user to the `/debug` GoRouter branch.

## Navigation & Layout
The Debug Screen adopts a Master-Detail architecture using a `Scaffold` with a `BottomNavigationBar`.

### 1. Devices Tab (`/debug/devices`)
- Subscribes to `deviceManagerProvider.devices`.
- Displays real-time connection status (Connecting, Connected, Disconnected).
- Tapping a device pushes to the **Device Specific Dashboard**.

### 2. Logs Tab (`/debug/logs`)
- Subscribes to `hardwareLoggerProvider.logStream`.
- Features an inverted-color (terminal-style) scrolling ListView.
- Auto-scrolls to the latest structured event log.

### 3. SOS & Safety Tab (`/debug/sos`)
- Subscribes to `safetyControllerProvider`.
- Displays current state (Idle, Triggered, Sending, Sent, Failed).
- Features a manual trigger button executing `SafetyController.triggerSOS()` (App-Level trigger, simulating what happens when an SOS event wins arbitration).

## Device Specific Dashboards (`/debug/device/:id`)
Detailed control surfaces for individual connected hardware.

### Smart Cane Module
- **Haptic Control:** Button to send `DeviceCommand.haptic()` via `DeviceManagerImpl`.
- **Ultrasonic Sensor Feed:** Real-time distance feed (listening to specific `TelemetryEvent`s).

### Smart Goggle Module
- **Visual Feed:** Canvas/Image placeholder wired to receive `ImageFrameEvent` or MJPEG chunk streams via HTTP.
- **Battery Status:** Rendered based on `TelemetryEvent` battery level fields.

## Development Principles
1. **100% Real Data:** The UI acts as a passive observer of the actual background state machines. It does not generate fake Bluetooth connections or simulate dummy devices.
2. **Modular Architecture:** UI components are tightly scoped and isolated to avoid polluting the core domain logic.
3. **Future Proofing:** Built with standard Flutter/Riverpod principles allowing seamless migration when the app transitions into Foreground/Background Service models for offline execution.
