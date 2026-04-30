import 'dart:async';
import '../../domain/models/base_device.dart';
import '../../domain/models/connection_state.dart';
import '../transports/http_transport.dart';

class SmartGoggleAdapter implements BaseDevice {
  final String _id;
  final String _ipAddress;
  final HttpTransport _transport;
  
  HardwareConnectionState _state = HardwareConnectionState.idle;

  SmartGoggleAdapter(this._id, this._ipAddress, this._transport);

  @override
  String get id => _id;

  @override
  String get name => 'Smart Goggle';

  @override
  HardwareConnectionState get state => _state;

  @override
  bool get supportsCamera => true;

  @override
  bool get supportsHaptics => false;

  @override
  bool get supportsAudio => true;

  @override
  bool get supportsButtons => false;

  Future<void> checkHealth() async {
    _state = HardwareConnectionState.connecting;
    final isHealthy = await _transport.checkHealth(_ipAddress);
    _state = isHealthy ? HardwareConnectionState.ready : HardwareConnectionState.failed;
  }

  Future<String?> captureImage() async {
    if (_state != HardwareConnectionState.ready) return null;
    
    try {
      final response = await _transport.sendCommand(_ipAddress, '/capture', {});
      if (response.statusCode == 200) {
        return response.data['image_url'] as String?;
      }
      return null;
    } catch (e) {
      _state = HardwareConnectionState.degraded;
      return null;
    }
  }
}
