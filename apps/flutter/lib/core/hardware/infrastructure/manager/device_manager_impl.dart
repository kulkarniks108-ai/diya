import 'dart:async';
import '../../domain/manager/device_manager.dart';
import '../../domain/manager/device_registry.dart';
import '../../domain/models/base_device.dart';
import '../../domain/models/device_command.dart';
import 'backoff_strategy.dart';

class DeviceManagerImpl implements DeviceManager {
  final DeviceRegistry _registry;
  final BackoffStrategy _backoffStrategy;

  // Internally keep track of active devices
  final Map<String, BaseDevice> _activeDevices = {};
  final StreamController<List<BaseDevice>> _devicesController = StreamController.broadcast();

  // Reconnection attempts tracking
  final Map<String, int> _reconnectionAttempts = {};
  final Map<String, Timer> _reconnectionTimers = {};

  DeviceManagerImpl(this._registry, this._backoffStrategy);

  @override
  Stream<List<BaseDevice>> get devices => _devicesController.stream;

  @override
  Future<void> startScan() async {
    // Fetch known devices and trigger background reconnects
    final knownDevices = await _registry.getKnownDevices();
    for (final device in knownDevices) {
      _triggerReconnection(device.deviceId);
    }
  }

  @override
  Future<void> stopScan() async {
    // Stop BLE scans and Discovery Server
  }

  @override
  Future<void> dispatchCommand(String deviceId, DeviceCommand command) async {
    final device = _activeDevices[deviceId];
    if (device == null) return;

    // Safety checks against capabilities
    if (command is VibrateCommand && !device.supportsHaptics) {
      return; // Safe drop
    }
    if (command is CaptureImageCommand && !device.supportsCamera) {
      return; // Safe drop
    }

    // In a full implementation, we cast to the specific adapter to execute the command.
  }

  @override
  Future<void> disconnectDevice(String deviceId) async {
    _cancelReconnection(deviceId);
    _activeDevices.remove(deviceId);
    _emitDevices();
  }

  @override
  Future<void> retryConnection(String deviceId) async {
    _reconnectionAttempts[deviceId] = 0;
    _triggerReconnection(deviceId);
  }

  void _triggerReconnection(String deviceId) {
    _cancelReconnection(deviceId);
    final attempt = _reconnectionAttempts[deviceId] ?? 0;
    
    if (attempt == 0) {
      _attemptConnect(deviceId);
    } else {
      final delayMs = _backoffStrategy.calculateDelay(attempt);
      _reconnectionTimers[deviceId] = Timer(Duration(milliseconds: delayMs), () {
        _attemptConnect(deviceId);
      });
    }
  }

  Future<void> _attemptConnect(String deviceId) async {
    final attempt = (_reconnectionAttempts[deviceId] ?? 0) + 1;
    _reconnectionAttempts[deviceId] = attempt;

    try {
      // Pseudo-code for adapter connection:
      // await adapter.connect();
      
      // On success, reset backoff
      _reconnectionAttempts[deviceId] = 0;
      _emitDevices();
    } catch (e) {
      // On failure, exponential backoff will trigger
      _triggerReconnection(deviceId);
    }
  }

  void _cancelReconnection(String deviceId) {
    _reconnectionTimers[deviceId]?.cancel();
    _reconnectionTimers.remove(deviceId);
  }

  void _emitDevices() {
    _devicesController.add(_activeDevices.values.toList());
  }
  
  void dispose() {
    for (final timer in _reconnectionTimers.values) {
      timer.cancel();
    }
    _reconnectionTimers.clear();
    _devicesController.close();
  }
}
