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

  void _updateState(TransportState newState) {
    _currentState = newState;
    _stateController.add(newState);
  }

  void dispose() {
    _stateController.close();
    _incomingController.close();
  }
}
