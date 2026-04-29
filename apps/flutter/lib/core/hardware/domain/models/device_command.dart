abstract class DeviceCommand {
  const DeviceCommand();
}

class VibrateCommand extends DeviceCommand {
  final int durationMs;
  const VibrateCommand({this.durationMs = 500});
}

class CaptureImageCommand extends DeviceCommand {
  const CaptureImageCommand();
}
