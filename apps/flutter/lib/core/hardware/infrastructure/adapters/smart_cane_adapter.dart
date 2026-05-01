import 'dart:async';
import 'dart:typed_data';
import '../../domain/models/base_device.dart';
import '../../domain/models/connection_state.dart';
import '../../domain/models/hardware_event.dart';
import '../../domain/capabilities/device_capability.dart';
import '../../domain/transports/device_transport.dart';
import '../../domain/messaging/event_bus.dart';

class _SmartCaneHapticCapability implements HapticCapability {
  final DeviceTransport _transport;
  _SmartCaneHapticCapability(this._transport);

  @override
  Type get type => HapticCapability;

  @override
  Future<void> triggerHaptic(int durationMs) async {
    await _transport.send(Uint8List.fromList([0x03, durationMs & 0xFF]));
  }
}

class SmartCaneAdapter implements BaseDevice {
  final String _id;
  final DeviceTransport _transport;
  final HardwareEventBus _eventBus;
  HardwareConnectionState _state = HardwareConnectionState.idle;
  
  StreamSubscription? _dataSubscription;
  StreamSubscription? _stateSubscription;
  
  final StreamController<HardwareEvent> _eventController = StreamController.broadcast();
  late final List<DeviceCapability> _capabilities;

  SmartCaneAdapter(this._id, this._transport, this._eventBus) {
    _capabilities = [_SmartCaneHapticCapability(_transport)];
    
    _stateSubscription = _transport.state.listen((transportState) {
      if (transportState == TransportState.connected) {
        _state = HardwareConnectionState.ready;
      } else if (transportState == TransportState.disconnected) {
        _state = HardwareConnectionState.disconnected;
      } else if (transportState == TransportState.error) {
        _state = HardwareConnectionState.failed;
      }
    });
    
    _dataSubscription = _transport.incoming.listen(_handleRawData);
  }

  @override
  Future<void> connect(String address) async {
    await _transport.connect(address);
  }

  @override
  Future<void> disconnect() async {
    await _transport.disconnect();
  }

  Stream<HardwareEvent> get events => _eventController.stream;

  @override
  String get id => _id;

  @override
  String get name => 'Smart Cane';

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

  void _handleRawData(Uint8List data) {
    if (data.isEmpty) return;
    
    HardwareEvent? event;
    if (data[0] == 0x01) {
      event = ButtonPressEvent(
        deviceId: id,
        buttonId: ButtonId.button1,
        pressType: ButtonPressType.short,
        priority: 1,
        trusted: true,
      );
    } else if (data[0] == 0x02) {
      event = ButtonPressEvent(
        deviceId: id,
        buttonId: ButtonId.button2,
        pressType: ButtonPressType.long,
        priority: 0,
        trusted: true,
      );
    }

    if (event != null) {
      _eventController.add(event);
      _eventBus.publish(event);
    }
  }

  void dispose() {
    _dataSubscription?.cancel();
    _stateSubscription?.cancel();
    _eventController.close();
  }
}
