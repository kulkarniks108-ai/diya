import '../models/known_device.dart';

abstract class DeviceRegistry {
  Future<void> saveKnownDevice(KnownDevice device);
  Future<List<KnownDevice>> getKnownDevices();
  Future<void> removeDevice(String deviceId);
}
