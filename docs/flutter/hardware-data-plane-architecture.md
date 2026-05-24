# Hardware Data Plane Architecture

This document defines a consistent, modular structure for hardware data flows in the Flutter app.

## Goals

- Keep current folder conventions intact (`core/hardware/domain`, `core/hardware/infrastructure`, `features/debug`)
- Separate command, telemetry pull, telemetry push, and camera transport concerns
- Allow incremental rollout: poll now, stream/live later

## Proposed Structure (aligned with current codebase)

```text
apps/flutter/lib/core/hardware/
  domain/
    capabilities/
      device_capability.dart
    models/
      base_device.dart
      hardware_event.dart
      known_device.dart
    transports/
      device_transport.dart
    messaging/
      event_bus.dart
      event_router.dart
  infrastructure/
    adapters/
      smart_goggle_adapter.dart
      smart_cane_adapter.dart
    transports/
      http_transport.dart
      ble_transport.dart
      device_discovery_server.dart
    manager/
      device_manager_impl.dart
      adapter_factory.dart
    observability/
      hardware_logger.dart
  providers/
    hardware_providers.dart

apps/flutter/lib/features/debug/
  screens/
    device_detail_screen.dart
  widgets/
    debug_devices_tab.dart
```

## Channel Design

### 1) Battery (Now: Pull)

- Trigger: User taps Pull on device detail screen.
- Path: `DeviceDetailScreen -> BatteryCapability.pullBatteryLevel() -> DeviceTransport.requestJson(GET, /state)`.
- Output: Battery percent + last pulled timestamp.
- Future: Add background polling profile and threshold alerts.

### 2) Capture Surrounding (Now: On-demand Fetch)

- Trigger: User taps Capture.
- Path: `DeviceDetailScreen -> CameraCapability.capture() -> DeviceTransport.requestJson(POST, /command)`.
- Response: `image_data_url` (base64 data URL) returned by goggle/simulator.
- Output: Rendered preview image.
- Future: Move to frame stream abstraction with fallback to on-demand capture.

### 3) Ultrasonic (Now: Push Notification)

- Trigger: Device detects obstacle.
- Path: `Goggle POST /events/ultrasonic -> DeviceDiscoveryServer.onSensorEvent -> DeviceManager -> HardwareEventBus`.
- Event type: `UltrasonicDetectionEvent`.
- Output: Routed event for UI/alerts/decision logic.
- Future: Unified sensor event schema (`/events`) supporting additional sensors.

## API Contracts

### Device -> Phone webhook

- `POST /register`
  - body: `{ "device_id": "...", "device_type": "goggle", "port": 9000 }`
- `POST /events/ultrasonic`
  - body: `{ "device_id": "...", "distance_cm": 84.5, "detected": true, "ts": 1710000000.0 }`

### Phone -> Device

- `GET /health`
- `GET /state`
- `POST /command`
  - capture example: `{ "command": "capture" }`

## Future-ready Improvements

1. Add `TelemetryProfile` (manual, periodic, adaptive) to control polling behavior.
2. Add dedup/rate-limit for ultrasonic push events to avoid alert storms.
3. Introduce `CameraFeedCapability` for live stream abstraction:
   - `Future<void> startLive()`
   - `Future<void> stopLive()`
   - `Stream<Uint8List> frames`
4. Add protocol versioning in payloads (`schema_version`) to support firmware upgrades safely.
5. Add integration tests for the three channels: battery pull, capture response, ultrasonic push.
