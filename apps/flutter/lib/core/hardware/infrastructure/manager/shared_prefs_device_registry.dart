import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../../domain/manager/device_registry.dart';
import '../../domain/models/known_device.dart';

class SharedPreferencesDeviceRegistry implements DeviceRegistry {
  static const String _storageKey = 'diya_known_devices';
  final SharedPreferences _prefs;

  SharedPreferencesDeviceRegistry(this._prefs);

  @override
  Future<void> saveKnownDevice(KnownDevice device) async {
    final devices = await getKnownDevices();
    final index = devices.indexWhere((d) => d.deviceId == device.deviceId);
    
    if (index >= 0) {
      devices[index] = device;
    } else {
      devices.add(device);
    }
    
    final jsonStringList = devices.map((d) => jsonEncode(d.toJson())).toList();
    await _prefs.setStringList(_storageKey, jsonStringList);
  }

  @override
  Future<List<KnownDevice>> getKnownDevices() async {
    final jsonStringList = _prefs.getStringList(_storageKey) ?? [];
    return jsonStringList.map((jsonStr) {
      try {
        return KnownDevice.fromJson(jsonDecode(jsonStr));
      } catch (e) {
        return null;
      }
    }).whereType<KnownDevice>().toList();
  }

  @override
  Future<void> removeDevice(String deviceId) async {
    final devices = await getKnownDevices();
    devices.removeWhere((d) => d.deviceId == deviceId);
    
    final jsonStringList = devices.map((d) => jsonEncode(d.toJson())).toList();
    await _prefs.setStringList(_storageKey, jsonStringList);
  }
}
