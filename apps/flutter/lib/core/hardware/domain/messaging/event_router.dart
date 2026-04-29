import 'dart:async';
import '../models/hardware_event.dart';
import 'event_bus.dart';

/// Routes events from the EventBus to feature controllers, enforcing priority.
/// SOS (Button2 long press) > Assist (Button1) > others
class EventRouter {
  final HardwareEventBus _eventBus;
  final _priorityStreamController = StreamController<HardwareEvent>.broadcast();
  StreamSubscription? _subscription;

  EventRouter(this._eventBus) {
    _subscription = _eventBus.events.listen(_routeEvent);
  }

  Stream<HardwareEvent> get priorityEvents => _priorityStreamController.stream;

  void _routeEvent(HardwareEvent event) {
    // In Phase 3, the EventRouter serves as the bottleneck where priority 
    // enforcement can be centralized. Currently it passes through, 
    // but ensures SOS preempts if we implement buffering or advanced routing.
    
    if (_isHighPriority(event)) {
      // In a real buffered system, we would jump the queue here.
      // Since Dart Streams are asynchronous and fast, we just push it.
    }
    
    _priorityStreamController.add(event);
  }
  
  bool _isHighPriority(HardwareEvent event) {
    if (event is ButtonPressEvent) {
      if (event.buttonId == ButtonId.button2 && event.pressType == ButtonPressType.long) {
        return true; // SOS
      }
    }
    return false;
  }

  void dispose() {
    _subscription?.cancel();
    _priorityStreamController.close();
  }
}
