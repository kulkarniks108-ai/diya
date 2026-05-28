import 'dart:async';

import '../../../core/hardware/domain/messaging/event_bus.dart';
import '../../../core/hardware/domain/models/hardware_event.dart';
import '../../../core/hardware/infrastructure/transports/device_discovery_server.dart';
import '../../../core/session/session_controller.dart';
import '../services/safety_service.dart';
import '../providers/safety_controller.dart';
import '../models/safety_state.dart';

class SosIngressService {
  SosIngressService(
    this._server,
    this._safetyService,
    this._safetyController,
    this._sessionController,
    this._eventBus,
  ) {
    _subscription = _server.onSosEvent.listen(_handleSosEvent);
  }

  final DeviceDiscoveryServer _server;
  final SafetyService _safetyService;
  final SafetyController _safetyController;
  final SessionController _sessionController;
  final HardwareEventBus _eventBus;
  StreamSubscription<Map<String, dynamic>>? _subscription;

  void dispose() {
    _subscription?.cancel();
  }

  Future<void> _handleSosEvent(Map<String, dynamic> data) async {
    final accessToken = _sessionController.state.session?.accessToken;
    final deviceId = (data['device_id'] as String?) ?? 'unknown-device';
    final sourceIp = data['source_ip'] as String?;
    final rawIdempotencyKey = data['idempotency_key'] as String?;

    final payload = _buildPayload(data, sourceIp);
    final idempotencyKey = _ensureIdempotencyKey(
      deviceId: deviceId,
      payload: payload,
      providedKey: rawIdempotencyKey,
    );

    if (accessToken == null || accessToken.isEmpty) {
      await _safetyService.enqueueSos(
        payload: payload,
        idempotencyKey: idempotencyKey,
      );
      _eventBus.publish(HardwareErrorEvent(
        deviceId: deviceId,
        errorCode: 'sos_missing_session',
        message: 'SOS received from device but no active session token. Queued for retry.',
        priority: 1,
        trusted: true,
      ));
      return;
    }

    final state = await _safetyController.handleDeviceSos(
      accessToken: accessToken,
      payload: payload,
      idempotencyKey: idempotencyKey,
    );

    if (state.status == SafetyStatus.failed) {
      _eventBus.publish(HardwareErrorEvent(
        deviceId: deviceId,
        errorCode: 'sos_dispatch_failed',
        message: state.error?.message ?? 'SOS dispatch failed',
        priority: 1,
        trusted: true,
      ));
    }
  }

  Map<String, dynamic> _buildPayload(Map<String, dynamic> data, String? sourceIp) {
    final rawPayload = (data['payload'] as Map<String, dynamic>?) ?? <String, dynamic>{};
    final payload = <String, dynamic>{
      ...rawPayload,
      'timestamp': rawPayload['timestamp'] ?? DateTime.now().toIso8601String(),
      'source_ip': sourceIp,
      'source_device_id': data['device_id'],
      'source_device_type': data['device_type'],
      'source_event': data['event_type'] ?? 'sos',
    };

    return payload;
  }

  String _ensureIdempotencyKey({
    required String deviceId,
    required Map<String, dynamic> payload,
    required String? providedKey,
  }) {
    final trimmed = providedKey?.trim();
    if (trimmed != null && trimmed.isNotEmpty) {
      return trimmed;
    }

    final timestamp = payload['timestamp'] as String? ?? DateTime.now().toIso8601String();
    final location = payload['location'] as String? ?? 'unknown-location';
    return 'sos-$deviceId-$timestamp-$location';
  }
}
