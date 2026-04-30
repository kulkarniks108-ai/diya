enum DeviceType { cane, goggle }

class KnownDevice {
  final String deviceId;
  final DeviceType deviceType;
  final String? lastKnownIp;
  final DateTime lastSeenTimestamp;

  const KnownDevice({
    required this.deviceId,
    required this.deviceType,
    this.lastKnownIp,
    required this.lastSeenTimestamp,
  });

  Map<String, dynamic> toJson() => {
        'device_id': deviceId,
        'device_type': deviceType.name,
        'last_known_ip': lastKnownIp,
        'last_seen_timestamp': lastSeenTimestamp.toIso8601String(),
      };

  factory KnownDevice.fromJson(Map<String, dynamic> json) {
    return KnownDevice(
      deviceId: json['device_id'] as String,
      deviceType: DeviceType.values.firstWhere(
        (e) => e.name == json['device_type'],
        orElse: () => DeviceType.cane,
      ),
      lastKnownIp: json['last_known_ip'] as String?,
      lastSeenTimestamp: DateTime.parse(json['last_seen_timestamp'] as String),
    );
  }
}
