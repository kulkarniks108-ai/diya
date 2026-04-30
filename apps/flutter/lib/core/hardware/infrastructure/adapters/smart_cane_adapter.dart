import 'dart:async';
import '../../domain/models/base_device.dart';
import '../../domain/models/connection_state.dart';
import '../../domain/models/hardware_event.dart';
import '../transports/ble_transport.dart';

class SmartCaneAdapter implements BaseDevice {
  final String _id;
  final BleTransport _transport;
  HardwareConnectionState _state = HardwareConnectionState.idle;
  StreamSubscription? _dataSubscription;
  StreamSubscription? _stateSubscription;
  
  final StreamController<HardwareEvent> _eventController = StreamController.broadcast();

  SmartCaneAdapter(this._id, this._transport) {
    _stateSubscription = _transport.connectionState.listen((isConnected) {
      _state = isConnected ? HardwareConnectionState.ready : HardwareConnectionState.disconnected;
    });
    
    _dataSubscription = _transport.characteristicData.listen(_handleRawData);
  }

  Stream<HardwareEvent> get events => _eventController.stream;

  @override
  String get id => _id;

  @override
  String get name => 'Smart Cane';

  @override
  HardwareConnectionState get state => _state;

  @override
  bool get supportsCamera => false;

  @override
  bool get supportsHaptics => true;

  @override
  bool get supportsAudio => false;

  @override
  bool get supportsButtons => true;

  void _handleRawData(List<int> data) {
    if (data.isEmpty) return;
    
    // Simplistic mapping for the sake of architecture illustration.
    if (data[0] == 0x01) {
      _eventController.add(ButtonPressEvent(
        deviceId: id,
        buttonId: ButtonId.button1,
        pressType: ButtonPressType.short,
      ));
    } else if (data[0] == 0x02) {
      _eventController.add(ButtonPressEvent(
        deviceId: id,
        buttonId: ButtonId.button2,
        pressType: ButtonPressType.long,
      ));
    }
  }
  
  Future<void> connect() async {
    _state = HardwareConnectionState.connecting;
    try {
      await _transport.connect(_id);
    } catch (e) {
      _state = HardwareConnectionState.failed;
      rethrow;
    }
  }

  Future<void> disconnect() async {
    await _transport.disconnect();
    _state = HardwareConnectionState.disconnected;
  }
  
  Future<void> triggerHaptic(int durationMs) async {
    await _transport.writeData([0x03, durationMs & 0xFF]);
  }

  void dispose() {
    _dataSubscription?.cancel();
    _stateSubscription?.cancel();
    _eventController.close();
  }
}
