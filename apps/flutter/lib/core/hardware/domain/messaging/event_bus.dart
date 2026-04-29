import 'dart:async';
import '../models/hardware_event.dart';

abstract class HardwareEventBus {
  Stream<HardwareEvent> get events;
  void publish(HardwareEvent event);
  void dispose();
}

class HardwareEventBusImpl implements HardwareEventBus {
  final _controller = StreamController<HardwareEvent>.broadcast();

  @override
  Stream<HardwareEvent> get events => _controller.stream;

  @override
  void publish(HardwareEvent event) {
    if (!_controller.isClosed) {
      _controller.add(event);
    }
  }

  @override
  void dispose() {
    _controller.close();
  }
}
