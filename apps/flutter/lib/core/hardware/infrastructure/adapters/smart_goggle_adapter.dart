import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';
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
  Future<Uint8List?> capture() async {
    try {
      // Primary: request raw bytes from /capture (binary JPEG)
      try {
        final bytes = await _transport.requestBytes('POST', '/capture');
        // Basic validation: JPEG should begin with 0xFF 0xD8
        if (bytes.length >= 2 && bytes[0] == 0xFF && bytes[1] == 0xD8) {
          return bytes;
        }
          // If bytes are not valid JPEG, persist diagnostics and fallthrough to JSON fallback
          try {
            final tmp = Directory.systemTemp;
            final file = File('${tmp.path}/capture_${_deviceId}_${DateTime.now().microsecondsSinceEpoch}.bin');
            await file.writeAsBytes(bytes, flush: true);
            _eventBus.publish(HardwareErrorEvent(
              deviceId: _deviceId,
              errorCode: 'capture_bad_image',
              message: 'Capture returned invalid JPEG; wrote diagnostics to ${file.path}',
              priority: 1,
              trusted: true,
            ));
          } catch (_) {
            // ignore failures in diagnostic write
          }
      } catch (_) {
        // Ignore here; we'll attempt JSON fallback below and emit an error if both fail.
      }

      // Fallback: older devices return a JSON payload with data-url encoded image
      final response = await _transport.requestJson(
        'POST',
        '/command',
        body: {'command': 'capture'},
      );
      final imageDataUrl = response['image_data_url'] as String?;
      String? encoded;
      if (imageDataUrl != null && imageDataUrl.isNotEmpty) {
        final comma = imageDataUrl.indexOf(',');
        encoded = comma >= 0 ? imageDataUrl.substring(comma + 1) : imageDataUrl;
      }

      // Backward compatibility: older simulator wraps payload in "received".
      if (encoded == null || encoded.isEmpty) {
        final received = response['received'];
        if (received is Map<String, dynamic>) {
          final nested = received['image_data_url'] as String?;
          if (nested != null && nested.isNotEmpty) {
            final comma = nested.indexOf(',');
            encoded = comma >= 0 ? nested.substring(comma + 1) : nested;
          }
        }
      }

      if (encoded != null && encoded.isNotEmpty) {
        try {
          final bytes = base64Decode(encoded);
          if (bytes.length >= 2 && bytes[0] == 0xFF && bytes[1] == 0xD8) {
            return bytes;
          }
          // attempt to persist diagnostics
          try {
            final tmp = Directory.systemTemp;
            final file = File('${tmp.path}/capture_bad_${_deviceId}_${DateTime.now().microsecondsSinceEpoch}.bin');
            await file.writeAsBytes(bytes, flush: true);
            _eventBus.publish(HardwareErrorEvent(
              deviceId: _deviceId,
              errorCode: 'capture_bad_image',
              message: 'Capture returned invalid JPEG; diagnostics: ${file.path}',
              priority: 1,
              trusted: true,
            ));
            throw Exception('capture_failed: invalid image saved to ${file.path}');
          } catch (_) {
            throw Exception('capture_failed: invalid image received and diagnostics write failed');
          }
        } catch (e) {
          // decode failed or other error
          throw Exception('capture_failed: ${e}');
        }
      }

      _eventBus.publish(HardwareErrorEvent(
        deviceId: _deviceId,
        errorCode: 'capture_empty',
        message: 'Capture command returned no valid image payload',
        priority: 2,
        trusted: true,
      ));
      throw Exception('capture_failed: no valid payload returned');
    } catch (e) {
      _eventBus.publish(HardwareErrorEvent(
        deviceId: _deviceId,
        errorCode: 'capture_failed',
        message: '$e',
        priority: 1,
        trusted: true,
      ));
      throw Exception('capture_failed: $e');
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
