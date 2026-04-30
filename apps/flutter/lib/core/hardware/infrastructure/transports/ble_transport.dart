import 'dart:async';

abstract class BleTransport {
  Stream<bool> get connectionState;
  Stream<List<int>> get characteristicData;
  
  Future<void> connect(String macAddress);
  Future<void> disconnect();
  Future<void> writeData(List<int> data);
}
