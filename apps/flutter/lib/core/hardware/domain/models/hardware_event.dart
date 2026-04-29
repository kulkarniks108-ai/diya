abstract class HardwareEvent {
  final String deviceId;
  final DateTime timestamp;

  HardwareEvent({
    required this.deviceId,
    DateTime? timestamp,
  }) : timestamp = timestamp ?? DateTime.now().toUtc();
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
    super.timestamp,
  });
}

class HardwareErrorEvent extends HardwareEvent {
  final String errorCode;
  final String message;

  HardwareErrorEvent({
    required super.deviceId,
    required this.errorCode,
    required this.message,
    super.timestamp,
  });
}

class TelemetryEvent extends HardwareEvent {
  final int batteryLevel;
  final String status;

  TelemetryEvent({
    required super.deviceId,
    required this.batteryLevel,
    required this.status,
    super.timestamp,
  });
}
