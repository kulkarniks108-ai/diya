import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../config/app_config.dart';
import '../session/session_controller.dart';
import 'token_expiry_interceptor.dart';

/// Base options for all Dio instances.
final _baseOptions = BaseOptions(
  baseUrl: AppConfig.apiBaseUrl,
  connectTimeout: const Duration(seconds: 10),
  receiveTimeout: const Duration(seconds: 10),
  sendTimeout: const Duration(seconds: 10),
);

/// A raw Dio client specifically for authentication operations (login, register, refresh).
/// This client does NOT include the token expiry interceptor to prevent circular refresh loops.
final authDioProvider = Provider<Dio>((ref) {
  return Dio(_baseOptions);
});

/// The main Dio client for all domain API requests.
/// This client includes the token expiry interceptor to automatically handle 401s.
final apiDioProvider = Provider<Dio>((ref) {
  final dio = Dio(_baseOptions);

  dio.interceptors.add(
    TokenExpiryInterceptor(
      dio,
      authApi: ref.read(authApiProvider),
      sessionController: ref.read(sessionControllerProvider),
    ),
  );

  return dio;
});
