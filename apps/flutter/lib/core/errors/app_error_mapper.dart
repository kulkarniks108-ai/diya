import 'package:dio/dio.dart';

import 'app_error.dart';

class AppErrorMapper {
  const AppErrorMapper._();

  static AppError fromException(Object error, {AppErrorType fallbackType = AppErrorType.unknown}) {
    if (error is AppError) {
      return error;
    }

    if (error is DioException) {
      return fromDioException(error, fallbackType: fallbackType);
    }

    return AppError.unknown(error.toString());
  }

  static AppError fromDioException(DioException error, {AppErrorType fallbackType = AppErrorType.unknown}) {
    final statusCode = error.response?.statusCode;
    final backendError = _fromBackendResponse(error.response?.data, statusCode);
    if (backendError != null) {
      return backendError;
    }

    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
      case DioExceptionType.connectionError:
        return AppError.network('Network unavailable. Please try again.', retryable: true);
      case DioExceptionType.cancel:
        return AppError.network('Request was cancelled.', retryable: true);
      case DioExceptionType.badResponse:
        if (statusCode == 401) {
          return AppError.auth('Your session expired. Please sign in again.', code: 'AUTH_EXPIRED');
        }
        if (statusCode == 403) {
          return AppError.permission('Access was denied.', code: 'PERMISSION_DENIED');
        }
        if (statusCode != null && statusCode >= 500) {
          return AppError.network('The server is temporarily unavailable.', code: 'SERVER_ERROR', retryable: true);
        }
        return AppError.unknown('The request failed.', code: 'HTTP_${statusCode ?? 0}');
      case DioExceptionType.badCertificate:
      case DioExceptionType.unknown:
        return AppError(type: fallbackType, message: 'A network error occurred.', retryable: true);
    }
  }

  static AppError? _fromBackendResponse(Object? data, int? statusCode) {
    if (data is! Map) {
      return null;
    }

    final map = data.cast<String, dynamic>();
    final error = map['error'];
    if (error is! Map) {
      return null;
    }

    final errorMap = error.cast<String, dynamic>();
    final code = errorMap['code'] as String?;
    final message = (errorMap['message'] as String?) ?? 'Something went wrong.';
    final retryable = statusCode != null && statusCode >= 500;
    final type = _typeFromCode(code, statusCode);

    return AppError(type: type, message: message, code: code, retryable: retryable);
  }

  static AppErrorType _typeFromCode(String? code, int? statusCode) {
    final normalized = code?.toUpperCase() ?? '';
    if (normalized.contains('AUTH')) {
      return AppErrorType.auth;
    }
    if (normalized.contains('PERMISSION')) {
      return AppErrorType.permission;
    }
    if (normalized.contains('SAFETY')) {
      return AppErrorType.safety;
    }
    if (statusCode == 401 || statusCode == 403) {
      return AppErrorType.auth;
    }
    if (statusCode != null && statusCode >= 500) {
      return AppErrorType.network;
    }
    return AppErrorType.unknown;
  }
}