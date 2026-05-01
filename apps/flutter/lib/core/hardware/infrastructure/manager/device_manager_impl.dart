import 'dart:async';
import '../../domain/manager/device_manager.dart';
import '../../domain/manager/device_registry.dart';
import '../../domain/models/base_device.dart';
import '../../domain/models/known_device.dart';
import '../../domain/observability/hardware_log_event.dart';
import '../observability/hardware_logger.dart';
import 'backoff_strategy.dart';
import '../../domain/messaging/event_bus.dart';
import '../transports/device_discovery_server.dart';
import 'adapter_factory.dart';

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
  final AdapterFactory _adapterFactory;
  final DeviceDiscoveryServer _discoveryServer;
  StreamSubscription? _discoverySubscription;

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
    this._eventBus,
    this._adapterFactory,
    this._discoveryServer,
  ) {
    _internalEvents.stream.listen(_handleInternalEvent);
    
    // Auto-start discovery server
    _discoveryServer.start();
    _discoverySubscription = _discoveryServer.onDeviceRegistered.listen(_handleDiscoveryEvent);
  }

  Future<void> _handleDiscoveryEvent(Map<String, dynamic> data) async {
    final deviceId = data['device_id'] as String?;
    final deviceTypeStr = data['device_type'] as String?;
    final sourceIp = data['source_ip'] as String?;

    if (deviceId == null || deviceTypeStr == null) return;

    final type = deviceTypeStr == 'goggle' ? DeviceType.goggle : DeviceType.cane;
    
    final knownDevice = KnownDevice(
      deviceId: deviceId,
      deviceType: type,
      lastKnownIp: sourceIp,
      lastSeenTimestamp: DateTime.now(),
    );

    // Save to registry
    await _registry.saveKnownDevice(knownDevice);
    
    _logger.log(HardwareLogEvent(type: LogType.connect, deviceId: deviceId, message: "Discovered via HTTP, attempting connection..."));
    
    // Trigger connection
    _reconnectionAttempts[deviceId] = 0;
    _triggerReconnection(deviceId);
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
        final allKnown = await _registry.getKnownDevices();
        final knownDevice = allKnown.where((d) => d.deviceId == event.deviceId).firstOrNull;
        
        if (knownDevice == null) {
          throw Exception("Device ${event.deviceId} not found in registry");
        }

        final adapter = _adapterFactory.createAdapter(
          deviceId: knownDevice.deviceId,
          deviceType: knownDevice.deviceType.name,
        );

        // Determine the address to connect to (IP for goggle, Mac for BLE cane)
        final address = knownDevice.deviceType == DeviceType.goggle 
            ? (knownDevice.lastKnownIp ?? '192.168.43.1')
            : knownDevice.deviceId;

        // Since adapter implements BaseDevice, we can directly connect
        await adapter.connect(address);

        _internalEvents.add(_TransportConnectedEvent(event.deviceId, adapter));
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
      final adapter = _activeDevices.remove(event.deviceId);
      adapter?.disconnect();
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
