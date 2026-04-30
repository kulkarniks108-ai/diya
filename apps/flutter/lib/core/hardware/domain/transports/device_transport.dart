import 'dart:typed_data';

enum TransportState { disconnected, connecting, connected, degraded, error }

abstract class DeviceTransport {
  Future<void> connect(String address);
  Future<void> disconnect();

  Future<void> send(Uint8List data);

  Stream<Uint8List> get incoming;
  Stream<TransportState> get state;
}
