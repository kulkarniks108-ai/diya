import 'dart:async';
import 'dart:typed_data';
import '../../domain/transports/device_transport.dart';

class BleTransportImpl implements DeviceTransport {
  final _stateController = StreamController<TransportState>.broadcast();
  final _incomingController = StreamController<Uint8List>.broadcast();

  TransportState _currentState = TransportState.disconnected;

  @override
  Stream<TransportState> get state => _stateController.stream;

  @override
  Stream<Uint8List> get incoming => _incomingController.stream;

  @override
  Future<void> connect(String address) async {
    _updateState(TransportState.connecting);
    try {
      // Connect using flutter_blue_plus
      _updateState(TransportState.connected);
    } catch (e) {
      _updateState(TransportState.error);
      rethrow;
    }
  }

  @override
  Future<void> disconnect() async {
    _updateState(TransportState.disconnected);
  }

  @override
  Future<void> send(Uint8List data) async {
    if (_currentState != TransportState.connected) {
      throw Exception('Cannot send data while disconnected');
    }
    // Write characteristic
  }

  @override
  Future<Map<String, dynamic>> requestJson(
    String method,
    String path, {
    Map<String, dynamic>? body,
    Duration? timeout,
  }) {
    throw UnsupportedError('requestJson is not supported for BLE transport');
  }

  void _updateState(TransportState newState) {
    _currentState = newState;
    _stateController.add(newState);
  }

  void dispose() {
    _stateController.close();
    _incomingController.close();
  }
}
