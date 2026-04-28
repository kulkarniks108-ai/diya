enum AppPermission {
  camera,
  microphone,
  bluetooth,
  location,
  notifications,
}

enum AppPermissionStatus {
  granted,
  denied,
  permanentlyDenied,
}

abstract class PermissionManager {
  Future<AppPermissionStatus> check(AppPermission permission);
  Future<AppPermissionStatus> request(AppPermission permission);
  Future<void> openSettings();
}