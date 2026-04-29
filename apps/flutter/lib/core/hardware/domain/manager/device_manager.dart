import '../models/base_device.dart';
import '../models/device_command.dart';

/// The single source of truth for device state. 
/// UI reads ONLY from this manager. 
abstract class DeviceManager {
  /// Stream of all active and known devices
  Stream<List<BaseDevice>> get devices;

  /// Starts scanning for devices across all active transports
  Future<void> startScan();

  /// Stops scanning
  Future<void> stopScan();

  /// Sends a command to a specific device, ensuring it matches capabilities
  Future<void> dispatchCommand(String deviceId, DeviceCommand command);
  
  /// Explicitly disconnect from a device
  Future<void> disconnectDevice(String deviceId);

  /// Force a retry for a device in a degraded or failed state
  Future<void> retryConnection(String deviceId);
}
