import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';
import '../../domain/models/base_device.dart';
import '../../domain/models/connection_state.dart';
import '../../domain/capabilities/device_capability.dart';
import '../../domain/transports/device_transport.dart';
import '../../domain/messaging/event_bus.dart';

class _SmartGoggleCameraCapability implements CameraCapability {
  final DeviceTransport _transport;
  _SmartGoggleCameraCapability(this._transport);

  @override
  Type get type => CameraCapability;

  @override
  Future<String?> capture() async {
    try {
      final payload = utf8.encode(jsonEncode({'command': 'capture'}));
      await _transport.send(Uint8List.fromList(payload));
      // Real system would await incoming stream response
      return null;
    } catch (e) {
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
    _capabilities = [_SmartGoggleCameraCapability(_transport)];

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
