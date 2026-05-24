import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';
import 'package:dio/dio.dart';
import '../../domain/transports/device_transport.dart';

class HttpTransportImpl implements DeviceTransport {
  final Dio _dio;
  final _stateController = StreamController<TransportState>.broadcast();
  final _incomingController = StreamController<Uint8List>.broadcast();

  TransportState _currentState = TransportState.disconnected;
  String? _connectedIp;

  HttpTransportImpl(this._dio);

  @override
  Stream<TransportState> get state => _stateController.stream;

  @override
  Stream<Uint8List> get incoming => _incomingController.stream;

  @override
  Future<void> connect(String address) async {
    _updateState(TransportState.connecting);
    try {
      _connectedIp = address;
      final response = await _dio.get(
        'http://$_connectedIp/health',
        options: Options(receiveTimeout: const Duration(seconds: 3)),
      );
      if (response.statusCode == 200) {
        _updateState(TransportState.connected);
      } else {
        _updateState(TransportState.error);
      }
    } catch (_) {
      _updateState(TransportState.error);
      rethrow;
    }
  }

  @override
  Future<void> disconnect() async {
    _connectedIp = null;
    _updateState(TransportState.disconnected);
  }

  @override
  Future<void> send(Uint8List data) async {
    if (_currentState != TransportState.connected || _connectedIp == null) {
      throw Exception('Cannot send data while disconnected');
    }
    
    final jsonStr = utf8.decode(data);
    final payload = jsonDecode(jsonStr);

    final response = await _dio.post(
      'http://$_connectedIp/command',
      data: payload,
      options: Options(sendTimeout: const Duration(seconds: 3)),
    );

    if (response.statusCode == 200 && response.data != null) {
      final responseBytes = utf8.encode(jsonEncode(response.data));
      _incomingController.add(Uint8List.fromList(responseBytes));
    }
  }

  @override
  Future<Map<String, dynamic>> requestJson(
    String method,
    String path, {
    Map<String, dynamic>? body,
    Duration? timeout,
  }) async {
    if (_currentState != TransportState.connected || _connectedIp == null) {
      throw Exception('Cannot request while disconnected');
    }

    final normalizedPath = path.startsWith('/') ? path : '/$path';
    final options = Options(
      sendTimeout: timeout ?? const Duration(seconds: 3),
      receiveTimeout: timeout ?? const Duration(seconds: 3),
    );

    final response = method.toUpperCase() == 'GET'
        ? await _dio.get('http://$_connectedIp$normalizedPath', options: options)
        : await _dio.post('http://$_connectedIp$normalizedPath', data: body, options: options);

    if (response.statusCode != 200 || response.data is! Map<String, dynamic>) {
      throw Exception('Unexpected response from $normalizedPath');
    }

    return response.data as Map<String, dynamic>;
  }

  /// Request raw bytes from the device. This is used for endpoints that return
  /// binary payloads such as images. A maximum response size is enforced to
  /// avoid OOMs. Returns the raw bytes on success.
  Future<Uint8List> requestBytes(
    String method,
    String path, {
    Map<String, dynamic>? body,
    Duration? timeout,
    int maxResponseBytes = 4 * 1024 * 1024, // 4MB default
  }) async {
    if (_currentState != TransportState.connected || _connectedIp == null) {
      throw Exception('Cannot request while disconnected');
    }

    final normalizedPath = path.startsWith('/') ? path : '/$path';
    final options = Options(
      sendTimeout: timeout ?? const Duration(seconds: 5),
      receiveTimeout: timeout ?? const Duration(seconds: 5),
      responseType: ResponseType.bytes,
      validateStatus: (_) => true,
    );

    final response = method.toUpperCase() == 'GET'
        ? await _dio.get('http://$_connectedIp$normalizedPath', options: options)
        : await _dio.post('http://$_connectedIp$normalizedPath', data: body, options: options);

    if (response.statusCode != 200 || response.data == null) {
      throw Exception('Unexpected response from $normalizedPath: ${response.statusCode}');
    }

    final data = response.data as List<int>;
    if (data.length > maxResponseBytes) {
      throw Exception('Response too large: ${data.length} bytes (max $maxResponseBytes)');
    }

    return Uint8List.fromList(data);
  }

  void _updateState(TransportState newState) {
    _currentState = newState;
    _stateController.add(newState);
  }

  void dispose() {
    _stateController.close();
    _incomingController.close();
  }
}
