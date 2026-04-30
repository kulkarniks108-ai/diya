enum LogType {
  connect,
  disconnect,
  reconnectAttempt,
  commandSent,
  commandFailed,
  stateTransition,
  error,
}

class HardwareLogEvent {
  final LogType type;
  final String deviceId;
  final int? attempt;
  final int? delayMs;
  final String? message;
  final DateTime timestamp;

  HardwareLogEvent({
    required this.type,
    required this.deviceId,
    this.attempt,
    this.delayMs,
    this.message,
    DateTime? timestamp,
  }) : timestamp = timestamp ?? DateTime.now().toUtc();

  @override
  String toString() {
    final buffer = StringBuffer('[DeviceManager] device=$deviceId state=${type.name.toUpperCase()}');
    if (attempt != null) buffer.write(' attempt=$attempt');
    if (delayMs != null) buffer.write(' delay=${delayMs}ms');
    if (message != null) buffer.write(' msg="$message"');
    return buffer.toString();
  }
}
