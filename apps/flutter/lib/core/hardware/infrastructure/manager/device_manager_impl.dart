import 'dart:async';
import '../../domain/manager/device_manager.dart';
import '../../domain/manager/device_registry.dart';
import '../../domain/models/base_device.dart';
import '../../domain/models/known_device.dart';
import '../../domain/observability/hardware_log_event.dart';
import '../observability/hardware_logger.dart';
import 'backoff_strategy.dart';
import '../../domain/messaging/event_bus.dart';

// Internal events for the DeviceManager state machine
abstract class _ManagerEvent {}
class _AttemptConnectEvent extends _ManagerEvent { final String deviceId; _AttemptConnectEvent(this.deviceId); }
class _TransportFailedEvent extends _ManagerEvent { final String deviceId; _TransportFailedEvent(this.deviceId); }
class _TransportConnectedEvent extends _ManagerEvent { final String deviceId; final BaseDevice device; _TransportConnectedEvent(this.deviceId, this.device); }
class _DisconnectRequestedEvent extends _ManagerEvent { final String deviceId; _DisconnectRequestedEvent(this.deviceId); }

class DeviceManagerImpl implements DeviceManager {
  final DeviceRegistry _registry;
  final BackoffStrategy _backoffStrategy;
  final HardwareLogger _logger;
  final HardwareEventBus _eventBus;

  final Map<String, BaseDevice> _activeDevices = {};
  final StreamController<List<BaseDevice>> _devicesController = StreamController.broadcast();

  final Map<String, int> _reconnectionAttempts = {};
  final Map<String, Timer> _reconnectionTimers = {};
  
  // Internal event bus for decoupled state machine
  final _internalEvents = StreamController<_ManagerEvent>();

  DeviceManagerImpl(
    this._registry, 
    this._backoffStrategy, 
    this._logger, 
    this._eventBus
  ) {
    _internalEvents.stream.listen(_handleInternalEvent);
  }

  @override
  Stream<List<BaseDevice>> get devices => _devicesController.stream;

  @override
  Future<void> startScan() async {
    final knownDevices = await _registry.getKnownDevices();
    for (final device in knownDevices) {
      _logger.log(HardwareLogEvent(type: LogType.connect, deviceId: device.deviceId, message: "Restoring known device"));
      _triggerReconnection(device.deviceId);
    }
  }

  @override
  Future<void> stopScan() async {}

  @override
  Future<void> disconnectDevice(String deviceId) async {
    _internalEvents.add(_DisconnectRequestedEvent(deviceId));
  }

  @override
  Future<void> retryConnection(String deviceId) async {
    _reconnectionAttempts[deviceId] = 0;
    _triggerReconnection(deviceId);
  }

  void _triggerReconnection(String deviceId) {
    _reconnectionTimers[deviceId]?.cancel();
    final attempt = _reconnectionAttempts[deviceId] ?? 0;
    
    if (attempt == 0) {
      _internalEvents.add(_AttemptConnectEvent(deviceId));
    } else {
      final delayMs = _backoffStrategy.calculateDelay(attempt);
      _logger.log(HardwareLogEvent(
        type: LogType.reconnectAttempt,
        deviceId: deviceId,
        attempt: attempt,
        delayMs: delayMs,
      ));
      
      _reconnectionTimers[deviceId] = Timer(Duration(milliseconds: delayMs), () {
        _internalEvents.add(_AttemptConnectEvent(deviceId));
      });
    }
  }

  Future<void> _handleInternalEvent(_ManagerEvent event) async {
    if (event is _AttemptConnectEvent) {
      final attempt = (_reconnectionAttempts[event.deviceId] ?? 0) + 1;
      _reconnectionAttempts[event.deviceId] = attempt;

      try {
        // Here we would resolve the transport and listen to its state stream.
        // For demonstration of the state engine failure path:
        throw Exception("Adapter resolution not fully implemented");
      } catch (e) {
        _logger.log(HardwareLogEvent(type: LogType.error, deviceId: event.deviceId, message: "Connect failed: $e"));
        _internalEvents.add(_TransportFailedEvent(event.deviceId));
      }
    } else if (event is _TransportFailedEvent) {
      _activeDevices.remove(event.deviceId);
      _emitDevices();
      _triggerReconnection(event.deviceId);
    } else if (event is _TransportConnectedEvent) {
      _reconnectionAttempts[event.deviceId] = 0;
      _activeDevices[event.deviceId] = event.device;
      _logger.log(HardwareLogEvent(type: LogType.connect, deviceId: event.deviceId, message: "Connected successfully"));
      _emitDevices();
    } else if (event is _DisconnectRequestedEvent) {
      _reconnectionTimers[event.deviceId]?.cancel();
      _activeDevices.remove(event.deviceId);
      _logger.log(HardwareLogEvent(type: LogType.disconnect, deviceId: event.deviceId, message: "Manual disconnect"));
      _emitDevices();
    }
  }

  void _emitDevices() {
    _devicesController.add(_activeDevices.values.toList());
  }
  
  void dispose() {
    for (final timer in _reconnectionTimers.values) timer.cancel();
    _reconnectionTimers.clear();
    _internalEvents.close();
    _devicesController.close();
  }
}
