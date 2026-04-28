import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:diya_flutter/core/errors/app_error.dart';
import 'package:diya_flutter/core/errors/app_error_mapper.dart';

void main() {
  group('AppErrorMapper', () {
    test('maps timeout exceptions to retryable network errors', () {
      final error = DioException(
        requestOptions: RequestOptions(path: '/test'),
        type: DioExceptionType.connectionTimeout,
      );

      final mapped = AppErrorMapper.fromException(error);

      expect(mapped.type, AppErrorType.network);
      expect(mapped.retryable, isTrue);
    });

    test('maps backend auth errors to auth AppError', () {
      final error = DioException(
        requestOptions: RequestOptions(path: '/test'),
        type: DioExceptionType.badResponse,
        response: Response<Map<String, dynamic>>(
          requestOptions: RequestOptions(path: '/test'),
          statusCode: 401,
          data: <String, dynamic>{
            'error': <String, dynamic>{
              'code': 'AUTH_EXPIRED',
              'message': 'Session expired',
            },
          },
        ),
      );

      final mapped = AppErrorMapper.fromException(error);

      expect(mapped.type, AppErrorType.auth);
      expect(mapped.code, 'AUTH_EXPIRED');
      expect(mapped.message, 'Session expired');
    });

    test('maps unknown exceptions to unknown AppError', () {
      final mapped = AppErrorMapper.fromException(StateError('boom'));

      expect(mapped.type, AppErrorType.unknown);
      expect(mapped.message, contains('boom'));
    });
  });
}