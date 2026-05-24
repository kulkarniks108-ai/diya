abstract class DeviceCapability {
  Type get type;
}

abstract class CameraCapability implements DeviceCapability {
  @override
  Type get type => CameraCapability;
  Future<String?> capture();
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
