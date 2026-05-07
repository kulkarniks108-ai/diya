import 'package:flutter_dotenv/flutter_dotenv.dart';

class AppConfig {
  AppConfig._();

  static String get apiBaseUrl => dotenv.env['API_BASE_URL'] ?? 'http://10.71.159.127:8000/api/v1';
  static const String sessionStorageKey = 'second_eye_session';
}
