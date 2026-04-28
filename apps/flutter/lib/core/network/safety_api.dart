import 'package:dio/dio.dart';

import '../config/app_config.dart';

/// Response from creating a safety event (SOS).
class SafetyEventResponse {
  SafetyEventResponse({
    required this.eventId,
    required this.traceId,
    required this.timestamp,
  });

  final String eventId;
  final String traceId;
  final DateTime timestamp;

  factory SafetyEventResponse.fromJson(Map<String, dynamic> json) {
    return SafetyEventResponse(
      eventId: json['id'] as String? ?? 'unknown',
      traceId: json['trace_id'] as String? ?? 'unknown',
      timestamp: DateTime.parse(json['timestamp'] as String? ?? DateTime.now().toIso8601String()),
    );
  }
}

/// API client for safety/SOS operations.
class SafetyApi {
  SafetyApi({Dio? dio})
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

  /// Create a safety event (SOS). 
  /// Accepts idempotency key to prevent duplicate processing.
  Future<SafetyEventResponse> createSafetyEvent({
    required String accessToken,
    required Map<String, dynamic> payload,
    required String idempotencyKey,
  }) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/safety/events',
      data: payload,
      options: Options(
        headers: <String, String>{
          'Authorization': 'Bearer $accessToken',
          'Idempotency-Key': idempotencyKey,
        },
      ),
    );

    if (response.data == null) {
      throw StateError('Empty safety response');
    }

    return SafetyEventResponse.fromJson(response.data!);
  }
}
