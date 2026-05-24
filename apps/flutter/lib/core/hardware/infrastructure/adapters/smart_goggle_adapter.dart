import 'dart:async';
import '../../domain/models/base_device.dart';
import '../../domain/models/connection_state.dart';
import '../../domain/models/hardware_event.dart';
import '../../domain/capabilities/device_capability.dart';
import '../../domain/transports/device_transport.dart';
import '../../domain/messaging/event_bus.dart';

class _SmartGoggleCameraCapability implements CameraCapability {
  final DeviceTransport _transport;
  final String _deviceId;
  final HardwareEventBus _eventBus;

  _SmartGoggleCameraCapability(this._transport, this._deviceId, this._eventBus);

  @override
  Type get type => CameraCapability;

  @override
  Future<String?> capture() async {
    try {
      final response = await _transport.requestJson(
        'POST',
        '/command',
        body: {'command': 'capture'},
      );
      final imageData = response['image_data_url'] as String?;
      if (imageData != null && imageData.isNotEmpty) {
        return imageData;
      }

      // Backward compatibility: older simulator wraps payload in "received".
      final received = response['received'];
      if (received is Map<String, dynamic>) {
        final nested = received['image_data_url'] as String?;
        if (nested != null && nested.isNotEmpty) {
          return nested;
        }
      }

      _eventBus.publish(HardwareErrorEvent(
        deviceId: _deviceId,
        errorCode: 'capture_empty',
        message: 'Capture command returned no image payload',
        priority: 2,
        trusted: true,
      ));
      return null;
    } catch (e) {
      _eventBus.publish(HardwareErrorEvent(
        deviceId: _deviceId,
        errorCode: 'capture_failed',
        message: '$e',
        priority: 1,
        trusted: true,
      ));
      return null;
    }
  }
}

class _SmartGoggleBatteryCapability implements BatteryCapability {
  final DeviceTransport _transport;
  final String _deviceId;
  final HardwareEventBus _eventBus;

  _SmartGoggleBatteryCapability(this._transport, this._deviceId, this._eventBus);

  @override
  Type get type => BatteryCapability;

  @override
  Future<int?> pullBatteryLevel() async {
    try {
      final response = await _transport.requestJson('GET', '/state');
      final battery = response['battery_level'];
      if (battery is! num) return null;
      final normalized = battery.toInt().clamp(0, 100);
      _eventBus.publish(TelemetryEvent(
        deviceId: _deviceId,
        batteryLevel: normalized,
        status: 'battery_pull',
        priority: 3,
        trusted: true,
      ));
      return normalized;
    } catch (e) {
      _eventBus.publish(HardwareErrorEvent(
        deviceId: _deviceId,
        errorCode: 'battery_pull_failed',
        message: '$e',
        priority: 2,
        trusted: true,
      ));
      return null;
    }
  }
}

class SmartGoggleAdapter implements BaseDevice {
  final String _id;
  final DeviceTransport _transport;
  final HardwareEventBus _eventBus;
  
  HardwareConnectionState _state = HardwareConnectionState.idle;
  late final List<DeviceCapability> _capabilities;

  StreamSubscription? _stateSubscription;

  SmartGoggleAdapter(this._id, this._transport, this._eventBus) {
    _capabilities = [
      _SmartGoggleCameraCapability(_transport, _id, _eventBus),
      _SmartGoggleBatteryCapability(_transport, _id, _eventBus),
    ];

    _stateSubscription = _transport.state.listen((transportState) {
      if (transportState == TransportState.connected) {
        _state = HardwareConnectionState.ready;
      } else if (transportState == TransportState.disconnected) {
        _state = HardwareConnectionState.disconnected;
      } else if (transportState == TransportState.error) {
        _state = HardwareConnectionState.failed;
      }
    });
  }

  @override
  Future<void> connect(String address) async {
    await _transport.connect(address);
  }

  @override
  Future<void> disconnect() async {
    await _transport.disconnect();
  }

  @override
  String get id => _id;

  @override
  String get name => 'Smart Goggle';

  @override
  HardwareConnectionState get state => _state;

  @override
  List<DeviceCapability> get capabilities => _capabilities;

  @override
  T? getCapability<T extends DeviceCapability>() {
    for (final cap in capabilities) {
      if (cap.type == T || cap is T) return cap as T;
    }
    return null;
  }

  void dispose() {
    _stateSubscription?.cancel();
  }
}
