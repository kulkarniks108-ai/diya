import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

class AppConfig {
  AppConfig._();

  static const String environment = String.fromEnvironment('APP_ENV', defaultValue: 'dev');
  static const String _apiBaseUrlDefine = String.fromEnvironment('API_BASE_URL');
  static const String _defaultApiBaseUrl = 'http://10.71.159.127:8000/api/v1';

  static String get apiBaseUrl => _apiBaseUrlDefine.isNotEmpty
      ? _apiBaseUrlDefine
      : _dotenvValue('API_BASE_URL') ?? _defaultApiBaseUrl;

  static void validate() {
    final hasOverride = _apiBaseUrlDefine.isNotEmpty || _dotenvValue('API_BASE_URL') != null;
    final isProdLike = kReleaseMode || environment == 'prod' || environment == 'production' || environment == 'staging';

    if (isProdLike && !hasOverride) {
      throw StateError('API_BASE_URL must be provided for non-dev builds.');
    }

    if (!hasOverride && !isProdLike) {
      debugPrint('WARN: API_BASE_URL is not set; using default $_defaultApiBaseUrl');
    }
  }

  static String? _dotenvValue(String key) {
    if (!dotenv.isInitialized) {
      return null;
    }
    final value = dotenv.env[key];
    if (value == null || value.trim().isEmpty) {
      return null;
    }
    return value.trim();
  }

  static const String sessionStorageKey = 'second_eye_session';
}
