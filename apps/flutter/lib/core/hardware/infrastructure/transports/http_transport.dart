import 'package:dio/dio.dart';

abstract class HttpTransport {
  Future<Response> sendCommand(String ipAddress, String endpoint, Map<String, dynamic> payload);
  Future<bool> checkHealth(String ipAddress);
}

class HttpTransportImpl implements HttpTransport {
  final Dio _dio;
  
  HttpTransportImpl(this._dio);

  @override
  Future<Response> sendCommand(String ipAddress, String endpoint, Map<String, dynamic> payload) async {
    final url = 'http://$ipAddress$endpoint';
    return _dio.post(
      url, 
      data: payload,
      options: Options(
        sendTimeout: const Duration(seconds: 3),
        receiveTimeout: const Duration(seconds: 5),
      ),
    );
  }

  @override
  Future<bool> checkHealth(String ipAddress) async {
    try {
      final response = await _dio.get(
        'http://$ipAddress/health', 
        options: Options(receiveTimeout: const Duration(seconds: 3)),
      );
      return response.statusCode == 200;
    } catch (_) {
      return false;
    }
  }
}
