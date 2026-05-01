import 'dart:async';
import '../models/hardware_event.dart';
import 'arbitration_result.dart';
import 'event_arbitrator.dart';
import 'event_bus.dart';

/// Routes events from the [HardwareEventBus] to domain controllers.
///
/// Instead of blindly forwarding every event, the router collects events
/// into a time window ([bufferDuration], default 250ms) and then runs
/// [EventArbitrator.resolve] on the batch. Only the winning event is
/// emitted on [resolvedEvents]. This prevents race conditions when
/// multiple devices emit signals simultaneously (e.g., cane SOS and
/// goggle telemetry arriving within the same quarter-second).
///
/// Safety-critical events (SOS) bypass the buffer and are emitted
/// immediately to avoid any latency on emergency signals.
class EventRouter {
  final HardwareEventBus _eventBus;
  final EventArbitrator _arbitrator;
  final Duration bufferDuration;

  final _resolvedController = StreamController<HardwareEvent>.broadcast();
  final _arbitrationLogController = StreamController<ArbitrationResult>.broadcast();
  StreamSubscription<HardwareEvent>? _subscription;

  List<HardwareEvent> _buffer = [];
  Timer? _flushTimer;

  EventRouter(
    this._eventBus,
    this._arbitrator, {
    this.bufferDuration = const Duration(milliseconds: 250),
  }) {
    _subscription = _eventBus.events.listen(_onEvent);
  }

  /// Stream of resolved (arbitrated) events. Consumers should listen here
  /// instead of directly on the EventBus.
  Stream<HardwareEvent> get resolvedEvents => _resolvedController.stream;

  /// Stream of arbitration results for observability and debugging.
  Stream<ArbitrationResult> get arbitrationLog => _arbitrationLogController.stream;

  void _onEvent(HardwareEvent event) {
    // Safety-critical events bypass the buffer entirely.
    // An SOS must never wait 250ms.
    if (_isSafetyEvent(event)) {
      // If there are buffered events, flush them first so ordering is preserved.
      if (_buffer.isNotEmpty) {
        _flushBuffer();
      }
      _emitDirect(event);
      return;
    }

    _buffer.add(event);

    // Start or reset the flush timer. Events arriving within the window
    // get batched together for arbitration.
    _flushTimer?.cancel();
    _flushTimer = Timer(bufferDuration, _flushBuffer);
  }

  void _flushBuffer() {
    _flushTimer?.cancel();
    _flushTimer = null;

    if (_buffer.isEmpty) return;

    final batch = _buffer;
    _buffer = [];

    final result = _arbitrator.resolve(batch);
    _arbitrationLogController.add(result);

    if (result.winner != null) {
      _resolvedController.add(result.winner!);
    }
  }

  void _emitDirect(HardwareEvent event) {
    final result = ArbitrationResult(
      winner: event,
      suppressedEvents: const [],
      reason: 'sos-bypass',
    );
    _arbitrationLogController.add(result);
    _resolvedController.add(event);
  }

  bool _isSafetyEvent(HardwareEvent event) {
    if (event is ButtonPressEvent) {
      return event.buttonId == ButtonId.button2 &&
          event.pressType == ButtonPressType.long;
    }
    return false;
  }

  void dispose() {
    _flushTimer?.cancel();
    _subscription?.cancel();
    _resolvedController.close();
    _arbitrationLogController.close();
  }
}
