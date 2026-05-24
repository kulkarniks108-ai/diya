/// Base class for all hardware events flowing through the event pipeline.
///
/// Every event carries metadata required for arbitration:
/// - [priority]: lower value = higher urgency (0 = SOS, 3 = telemetry)
/// - [trusted]: events from verified adapters get preference during ties
/// - [eventId]: unique identifier for deduplication and tracing
abstract class HardwareEvent {
  final String deviceId;
  final String eventId;
  final DateTime timestamp;
  final int priority;
  final bool trusted;

  HardwareEvent({
    required this.deviceId,
    String? eventId,
    DateTime? timestamp,
    this.priority = 0,
    this.trusted = false,
  })  : eventId = eventId ?? '${DateTime.now().microsecondsSinceEpoch}',
        timestamp = timestamp ?? DateTime.now().toUtc();
}

enum ButtonPressType { short, long, double, triple }

enum ButtonId { button1, button2 }

class ButtonPressEvent extends HardwareEvent {
  final ButtonId buttonId;
  final ButtonPressType pressType;

  ButtonPressEvent({
    required super.deviceId,
    required this.buttonId,
    required this.pressType,
    super.eventId,
    super.timestamp,
    super.priority,
    super.trusted,
  });
}

class HardwareErrorEvent extends HardwareEvent {
  final String errorCode;
  final String message;

  HardwareErrorEvent({
    required super.deviceId,
    required this.errorCode,
    required this.message,
    super.eventId,
    super.timestamp,
    super.priority,
    super.trusted,
  });
}

class TelemetryEvent extends HardwareEvent {
  final int batteryLevel;
  final String status;

  TelemetryEvent({
    required super.deviceId,
    required this.batteryLevel,
    required this.status,
    super.eventId,
    super.timestamp,
    super.priority,
    super.trusted,
  });
}

class UltrasonicDetectionEvent extends HardwareEvent {
  final double distanceCm;
  final bool detected;

  UltrasonicDetectionEvent({
    required super.deviceId,
    required this.distanceCm,
    required this.detected,
    super.eventId,
    super.timestamp,
    super.priority,
    super.trusted,
  });
}
