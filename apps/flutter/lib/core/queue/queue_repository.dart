import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';
import 'queue_item.dart';

/// Repository for persisting queued offline actions.
class QueueRepository {
  QueueRepository({SharedPreferences? prefs}) : _prefs = prefs;

  SharedPreferences? _prefs;
  static const _queueKey = 'app.queue.items';

  Future<void> _ensurePrefs() async {
    _prefs ??= await SharedPreferences.getInstance();
  }

  /// Load all queued items from storage.
  Future<List<QueueItem>> loadQueue() async {
    await _ensurePrefs();
    final encoded = _prefs!.getStringList(_queueKey) ?? [];
    return encoded.map((item) {
      try {
        final json = jsonDecode(item) as Map<String, dynamic>;
        return QueueItem.fromJson(json);
      } catch (_) {
        return null;
      }
    }).whereType<QueueItem>().toList();
  }

  /// Add a single item to the queue.
  Future<void> enqueue(QueueItem item) async {
    await _ensurePrefs();
    final items = await loadQueue();
    items.add(item);
    await _persist(items);
  }

  /// Remove an item from the queue by ID.
  Future<void> dequeue(String id) async {
    await _ensurePrefs();
    final items = await loadQueue();
    items.removeWhere((item) => item.id == id);
    await _persist(items);
  }

  /// Update an item in the queue (e.g., increment attempts).
  Future<void> update(QueueItem item) async {
    await _ensurePrefs();
    final items = await loadQueue();
    final idx = items.indexWhere((i) => i.id == item.id);
    if (idx >= 0) {
      items[idx] = item;
      await _persist(items);
    }
  }

  /// Clear all queued items.
  Future<void> clear() async {
    await _ensurePrefs();
    await _prefs!.remove(_queueKey);
  }

  Future<void> _persist(List<QueueItem> items) async {
    final encoded = items.map((item) => jsonEncode(item.toJson())).toList();
    await _prefs!.setStringList(_queueKey, encoded);
  }
}
