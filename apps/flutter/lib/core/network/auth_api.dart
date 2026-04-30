import 'package:dio/dio.dart';

import '../config/app_config.dart';
import '../errors/app_error.dart';
import '../errors/app_error_mapper.dart';
import '../session/auth_session.dart';
import 'token_expiry_interceptor.dart';

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
  bool _interceptorRegistered = false;

  /// Register the token expiry interceptor (called after session controller is available).
  void registerInterceptor(dynamic sessionController) {
    if (_interceptorRegistered) {
      return;
    }
    _dio.interceptors.add(
      TokenExpiryInterceptor(authApi: this, sessionController: sessionController),
    );
    _interceptorRegistered = true;
  }

  Future<AuthSession> login({required String email, required String password}) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/auth/login',
        data: <String, Object?>{'email': email, 'password': password},
      );
      return _parseSession(_extractData(response.data));
    } on Object catch (error) {
      throw AppErrorMapper.fromException(error, fallbackType: AppErrorType.auth);
    }
  }

  Future<AuthSession> register({
    required String email,
    required String password,
    required List<String> roles,
  }) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/auth/register',
        data: <String, Object?>{
          'email': email,
          'password': password,
          'roles': roles,
        },
      );
      return _parseSession(_extractData(response.data));
    } on Object catch (error) {
      throw AppErrorMapper.fromException(error, fallbackType: AppErrorType.auth);
    }
  }

  Future<AuthSession> refresh({required AuthSession session}) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/auth/refresh',
        data: <String, Object?>{'refresh_token': session.refreshToken},
      );
      return _parseSession(_extractData(response.data));
    } on Object catch (error) {
      throw AppErrorMapper.fromException(error, fallbackType: AppErrorType.auth);
    }
  }

  Future<void> logout({required String accessToken}) async {
    try {
      await _dio.post<void>(
        '/auth/logout',
        options: Options(headers: <String, String>{'Authorization': 'Bearer $accessToken'}),
      );
    } on Object catch (error) {
      throw AppErrorMapper.fromException(error, fallbackType: AppErrorType.auth);
    }
  }

  /// Validate the current access token by calling /auth/me. Throws on non-2xx.
  Future<void> me({required String accessToken}) async {
    try {
      await _dio.get<void>(
        '/auth/me',
        options: Options(headers: <String, String>{'Authorization': 'Bearer $accessToken'}),
      );
    } on Object catch (error) {
      throw AppErrorMapper.fromException(error, fallbackType: AppErrorType.auth);
    }
  }

  /// Extract data from the response envelope {success, data, trace_id}
  Map<String, dynamic>? _extractData(Map<String, dynamic>? envelope) {
    if (envelope == null) {
      return null;
    }
    return envelope['data'] as Map<String, dynamic>?;
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
