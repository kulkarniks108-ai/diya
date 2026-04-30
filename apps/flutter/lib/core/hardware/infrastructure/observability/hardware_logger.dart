import 'dart:async';
import 'package:flutter/foundation.dart';
import '../../domain/observability/hardware_log_event.dart';

class HardwareLogger {
  final _logController = StreamController<HardwareLogEvent>.broadcast();

  Stream<HardwareLogEvent> get logStream => _logController.stream;

  void log(HardwareLogEvent event) {
    // 1. Output to console for immediate debug visibility
    if (kDebugMode) {
      debugPrint(event.toString());
    }

    // 2. Push to stream for derived metrics and the in-app Debug Panel
    _logController.add(event);
  }

  void dispose() {
    _logController.close();
  }
}
