enum QueueItemType { sos }

/// Represents a queued action (currently only SOS) awaiting retry.
class QueueItem {
  QueueItem({
    required this.id,
    required this.type,
    required this.payload,
    required this.createdAt,
    this.attempts = 0,
    this.idempotencyKey,
  });

  final String id;
  final QueueItemType type;
  final Map<String, dynamic> payload; // SOS payload (location, timestamp, etc)
  final DateTime createdAt;
  int attempts;
  final String? idempotencyKey; // For deduplication

  Map<String, Object?> toJson() => <String, Object?>{
        'id': id,
        'type': type.toString(),
        'payload': payload,
        'createdAt': createdAt.toIso8601String(),
        'attempts': attempts,
        'idempotencyKey': idempotencyKey,
      };

  factory QueueItem.fromJson(Map<String, dynamic> json) {
    final typeStr = (json['type'] as String).replaceAll('QueueItemType.', '');
    final type = typeStr == 'sos' ? QueueItemType.sos : QueueItemType.sos;

    return QueueItem(
      id: json['id'] as String,
      type: type,
      payload: (json['payload'] as Map<String, dynamic>?)?.cast<String, dynamic>() ?? {},
      createdAt: DateTime.parse(json['createdAt'] as String),
      attempts: (json['attempts'] as int?) ?? 0,
      idempotencyKey: json['idempotencyKey'] as String?,
    );
  }
}
