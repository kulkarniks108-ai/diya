import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:permission_handler/permission_handler.dart';

import 'permission_manager.dart';

final permissionManagerProvider = Provider<PermissionManager>((ref) {
  return PermissionManagerImpl();
});

class PermissionManagerImpl implements PermissionManager {
  @override
  Future<AppPermissionStatus> check(AppPermission permission) async {
    try {
      final status = await _resolve(permission).status;
      return _mapStatus(status);
    } catch (_) {
      return AppPermissionStatus.denied;
    }
  }

  @override
  Future<AppPermissionStatus> request(AppPermission permission) async {
    try {
      final status = await _resolve(permission).request();
      return _mapStatus(status);
    } catch (_) {
      return AppPermissionStatus.denied;
    }
  }

  @override
  Future<void> openSettings() async {
    try {
      await openAppSettings();
    } catch (_) {
      // Never crash if the platform cannot open settings.
    }
  }

  Permission _resolve(AppPermission permission) {
    switch (permission) {
      case AppPermission.camera:
        return Permission.camera;
      case AppPermission.microphone:
        return Permission.microphone;
      case AppPermission.bluetooth:
        return Permission.bluetooth;
      case AppPermission.location:
        return Permission.location;
      case AppPermission.notifications:
        return Permission.notification;
    }
  }

  AppPermissionStatus _mapStatus(PermissionStatus status) {
    if (status.isGranted) {
      return AppPermissionStatus.granted;
    }
    if (status.isPermanentlyDenied) {
      return AppPermissionStatus.permanentlyDenied;
    }
    return AppPermissionStatus.denied;
  }
}