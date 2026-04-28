import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../config/app_config.dart';
import 'auth_session.dart';
import 'session_repository.dart';

/// SecureSessionRepository stores session tokens and metadata in platform
/// secure storage. On first load it will migrate any legacy stored session
/// from SharedPreferences (if present) and then remove the legacy entry.
class SecureSessionRepository implements SessionRepository {
  SecureSessionRepository({FlutterSecureStorage? storage}) : _storage = storage ?? const FlutterSecureStorage();

  final FlutterSecureStorage _storage;
  static const _key = AppConfig.sessionStorageKey;

  @override
  Future<void> clear() async {
    await _storage.delete(key: _key);
  }

  @override
  Future<AuthSession?> load() async {
    // Try secure storage first
    final encoded = await _storage.read(key: _key);
    if (encoded != null && encoded.isNotEmpty) {
      try {
        final Map<String, dynamic> data = jsonDecode(encoded) as Map<String, dynamic>;
        return AuthSession.fromJson(data.cast<String, Object?>());
      } catch (_) {
        // Corrupt entry: clear it and return null
        await _storage.delete(key: _key);
        return null;
      }
    }

    // No secure entry found: attempt migration from SharedPreferences
    try {
      final prefs = await SharedPreferences.getInstance();
      final legacy = prefs.getString(_key);
      if (legacy != null && legacy.isNotEmpty) {
        try {
          final Map<String, dynamic> data = jsonDecode(legacy) as Map<String, dynamic>;
          final session = AuthSession.fromJson(data.cast<String, Object?>());
          // Persist into secure storage and remove legacy
          await save(session);
          await prefs.remove(_key);
          return session;
        } catch (_) {
          // ignore malformed legacy value
          await prefs.remove(_key);
          return null;
        }
      }
    } catch (_) {
      // If SharedPreferences is not available, silently continue
    }

    return null;
  }

  @override
  Future<void> save(AuthSession session) async {
    final encoded = jsonEncode(session.toJson());
    await _storage.write(key: _key, value: encoded);
  }
}
