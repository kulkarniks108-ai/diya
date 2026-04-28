import 'package:flutter/foundation.dart';

enum AccessoryKind { cane, goggle, wearable }

enum AccessoryEventType { safety, assist, command, telemetry }

@immutable
class AccessoryEvent {
  const AccessoryEvent({
    required this.eventId,
    required this.sourceDeviceId,
    required this.accessoryKind,
    required this.eventType,
    required this.receivedAt,
    this.priority = 0,
    this.trusted = false,
    this.payload = const <String, Object?>{},
  });

  final String eventId;
  final String sourceDeviceId;
  final AccessoryKind accessoryKind;
  final AccessoryEventType eventType;
  final DateTime receivedAt;
  final int priority;
  final bool trusted;
  final Map<String, Object?> payload;
}

@immutable
class ArbitrationResult {
  const ArbitrationResult({
    required this.winner,
    required this.suppressedEvents,
    required this.reason,
  });

  final AccessoryEvent? winner;
  final List<AccessoryEvent> suppressedEvents;
  final String reason;
}
