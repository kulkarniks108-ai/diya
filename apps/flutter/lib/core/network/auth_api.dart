import 'package:dio/dio.dart';

import '../config/app_config.dart';
import '../session/auth_session.dart';

class AuthApi {
  AuthApi({Dio? dio})
      : _dio = dio ??
            Dio(
              BaseOptions(
                baseUrl: AppConfig.apiBaseUrl,
                connectTimeout: const Duration(seconds: 5),
                receiveTimeout: const Duration(seconds: 5),
                sendTimeout: const Duration(seconds: 5),
              ),
            );

  final Dio _dio;

  Future<AuthSession> login({required String email, required String password}) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/auth/login',
      data: <String, Object?>{'email': email, 'password': password},
    );
    return _parseSession(response.data);
  }

  Future<AuthSession> refresh({required AuthSession session}) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/auth/refresh',
      data: <String, Object?>{'refresh_token': session.refreshToken},
    );
    return _parseSession(response.data);
  }

  Future<void> logout({required String accessToken}) async {
    await _dio.post<void>(
      '/auth/logout',
      options: Options(headers: <String, String>{'Authorization': 'Bearer $accessToken'}),
    );
  }

  AuthSession _parseSession(Map<String, dynamic>? data) {
    if (data == null) {
      throw StateError('Empty auth response');
    }

    final user = (data['user'] as Map<String, dynamic>?) ?? <String, dynamic>{};

    return AuthSession(
      userId: user['id'] as String? ?? '',
      email: user['email'] as String? ?? '',
      roles: (user['roles'] as List<dynamic>? ?? const <dynamic>[]).cast<String>(),
      accessToken: data['access_token'] as String? ?? '',
      refreshToken: data['refresh_token'] as String? ?? '',
      sessionId: data['session_id'] as String? ?? user['session_id'] as String? ?? '',
      tokenVersion: (data['token_version'] as int?) ?? 1,
    );
  }
}
