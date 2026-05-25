import 'dart:typed_data';

import 'package:dio/dio.dart';

import '../../domain/capabilities/device_capability.dart';
import '../../domain/messaging/event_bus.dart';
import '../../domain/models/hardware_event.dart';
import '../../domain/models/known_device.dart';
import '../adapters/smart_goggle_adapter.dart';
import '../transports/http_transport.dart';

class DebugGoggleService {
  final Dio _dio;
  final HardwareEventBus _eventBus;
  final Map<String, _GoggleSession> _sessions = {};

  DebugGoggleService(this._dio, this._eventBus);

  Future<int?> pullBatteryLevel(KnownDevice device) async {
    if (device.deviceType != DeviceType.goggle) return null;
    try {
      final session = await _ensureSession(device);
      final capability = session.adapter.getCapability<BatteryCapability>();
      if (capability == null) return null;
      return await capability.pullBatteryLevel();
    } catch (e) {
      _publishError(device.deviceId, 'battery_pull_failed', '$e');
      return null;
    }
  }

  Future<Uint8List?> capture(KnownDevice device) async {
    if (device.deviceType != DeviceType.goggle) return null;
    try {
      final session = await _ensureSession(device);
      final capability = session.adapter.getCapability<CameraCapability>();
      if (capability == null) return null;
      return await capability.capture();
    } catch (e) {
      _publishError(device.deviceId, 'capture_failed', '$e');
      return null;
    }
  }

  Future<double?> fetchUltrasonicCm(KnownDevice device) async {
    if (device.deviceType != DeviceType.goggle) return null;
    try {
      final session = await _ensureSession(device);
      final response = await session.transport.requestJson('GET', '/state');
      final rawDistance = response['ultrasonic_cm'];
      final distanceCm = rawDistance is num ? rawDistance.toDouble() : null;
      if (distanceCm != null) {
        _eventBus.publish(UltrasonicDetectionEvent(
          deviceId: device.deviceId,
          distanceCm: distanceCm,
          detected: distanceCm <= 120,
          priority: 2,
          trusted: true,
        ));
      }
      return distanceCm;
    } catch (e) {
      _publishError(device.deviceId, 'telemetry_fetch_failed', '$e');
      return null;
    }
  }

  Future<bool> ping(KnownDevice device) async {
    if (device.deviceType != DeviceType.goggle) return false;
    try {
      final session = await _ensureSession(device);
      await session.transport.requestJson('GET', '/health');
      return true;
    } catch (e) {
      _publishError(device.deviceId, 'ping_failed', '$e');
      return false;
    }
  }

  void dispose() {
    for (final session in _sessions.values) {
      session.dispose();
    }
    _sessions.clear();
  }

  Future<_GoggleSession> _ensureSession(KnownDevice device) async {
    final address = _buildAddress(device);
    final existing = _sessions[device.deviceId];

    if (existing == null || existing.address != address) {
      existing?.dispose();
      final transport = HttpTransportImpl(_dio);
      final adapter = SmartGoggleAdapter(device.deviceId, transport, _eventBus);
      final session = _GoggleSession(adapter, transport, address);
      _sessions[device.deviceId] = session;
    }

    final session = _sessions[device.deviceId]!;
    if (!session.connected) {
      await session.adapter.connect(address);
      session.connected = true;
    }

    return session;
  }

  String _buildAddress(KnownDevice device) {
    final host = device.lastKnownIp;
    if (host == null || host.isEmpty) {
      throw Exception('Device ${device.deviceId} has no known IP');
    }
    final port = device.lastKnownPort ?? 80;
    return '$host:$port';
  }

  void _publishError(String deviceId, String code, String message) {
    _eventBus.publish(HardwareErrorEvent(
      deviceId: deviceId,
      errorCode: code,
      message: message,
      priority: 2,
      trusted: true,
    ));
  }
}

class _GoggleSession {
  final SmartGoggleAdapter adapter;
  final HttpTransportImpl transport;
  final String address;
  bool connected = false;

  _GoggleSession(this.adapter, this.transport, this.address);

  void dispose() {
    adapter.dispose();
  }
}
