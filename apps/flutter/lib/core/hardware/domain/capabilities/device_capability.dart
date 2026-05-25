import 'dart:typed_data';

abstract class DeviceCapability {
  Type get type;
}

abstract class CameraCapability implements DeviceCapability {
  @override
  Type get type => CameraCapability;
  /// Capture an on-demand image from the device.
  ///
  /// Returns the raw image bytes (typically JPEG) as a [Uint8List].
  /// Implementations SHOULD return null on failure and publish appropriate
  /// [HardwareErrorEvent]s on the event bus.
  Future<Uint8List?> capture();
}

abstract class BatteryCapability implements DeviceCapability {
  @override
  Type get type => BatteryCapability;
  Future<int?> pullBatteryLevel();
}

abstract class UltrasonicCapability implements DeviceCapability {
  @override
  Type get type => UltrasonicCapability;
  Future<double?> pullDistanceCm();
}

abstract class HapticCapability implements DeviceCapability {
  @override
  Type get type => HapticCapability;
  Future<void> triggerHaptic(int durationMs);
}
