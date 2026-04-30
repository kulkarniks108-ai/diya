abstract class DeviceCapability {
  Type get type;
}

abstract class CameraCapability implements DeviceCapability {
  @override
  Type get type => CameraCapability;
  Future<String?> capture();
}

abstract class HapticCapability implements DeviceCapability {
  @override
  Type get type => HapticCapability;
  Future<void> triggerHaptic(int durationMs);
}
