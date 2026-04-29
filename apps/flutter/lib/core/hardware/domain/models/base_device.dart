import 'connection_state.dart';

abstract class BaseDevice {
  String get id;
  String get name;
  HardwareConnectionState get state;

  // Capabilities
  bool get supportsCamera;
  bool get supportsHaptics;
  bool get supportsAudio;
  bool get supportsButtons;
}
