import 'dart:typed_data';

enum TransportState { disconnected, connecting, connected, degraded, error }

abstract class DeviceTransport {
  Future<void> connect(String address);
  Future<void> disconnect();

  Future<void> send(Uint8List data);
  Future<Map<String, dynamic>> requestJson(
    String method,
    String path, {
    Map<String, dynamic>? body,
    Duration? timeout,
  });

  /// Request raw bytes from the transport. Useful for binary endpoints like
  /// image capture. Implementations should enforce size limits and timeouts.
  Future<Uint8List> requestBytes(
    String method,
    String path, {
    Map<String, dynamic>? body,
    Duration? timeout,
    int? maxResponseBytes,
  });

  Stream<Uint8List> get incoming;
  Stream<TransportState> get state;
}
