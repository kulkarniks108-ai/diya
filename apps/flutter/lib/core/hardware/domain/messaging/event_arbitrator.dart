import '../models/hardware_event.dart';
import 'arbitration_result.dart';

/// Stateless arbitrator that resolves conflicts when multiple hardware events
/// arrive within the same time window.
///
/// Priority cascade (deterministic):
///   1. Event type priority (ButtonPress with SOS > ButtonPress with Assist > Telemetry > Error)
///   2. Trusted flag (verified adapters win ties)
///   3. Timestamp (earlier wins)
///   4. Explicit priority field (lower value wins)
///   5. eventId (lexicographic tiebreaker for full determinism)
class EventArbitrator {
  const EventArbitrator();

  /// Given a batch of events collected within one buffering window,
  /// return the single winner and the list of suppressed events.
  ArbitrationResult resolve(List<HardwareEvent> events) {
    if (events.isEmpty) {
      return const ArbitrationResult(
        winner: null,
        suppressedEvents: <HardwareEvent>[],
        reason: 'no-events',
      );
    }

    if (events.length == 1) {
      return ArbitrationResult(
        winner: events.first,
        suppressedEvents: const <HardwareEvent>[],
        reason: _reasonForEvent(events.first),
      );
    }

    final sorted = [...events]..sort(_compareEvents);
    final winner = sorted.first;
    final suppressed = sorted.skip(1).toList(growable: false);

    return ArbitrationResult(
      winner: winner,
      suppressedEvents: suppressed,
      reason: _reasonForEvent(winner),
    );
  }

  int _compareEvents(HardwareEvent left, HardwareEvent right) {
    // 1. Event type priority
    final leftTypePriority = _typePriority(left);
    final rightTypePriority = _typePriority(right);
    if (leftTypePriority != rightTypePriority) {
      return leftTypePriority.compareTo(rightTypePriority);
    }

    // 2. Trusted flag
    if (left.trusted != right.trusted) {
      return left.trusted ? -1 : 1;
    }

    // 3. Timestamp (earlier wins)
    final timeComparison = left.timestamp.compareTo(right.timestamp);
    if (timeComparison != 0) {
      return timeComparison;
    }

    // 4. Explicit priority (lower = more urgent)
    if (left.priority != right.priority) {
      return left.priority.compareTo(right.priority);
    }

    // 5. eventId tiebreaker for full determinism
    return left.eventId.compareTo(right.eventId);
  }

  /// Maps event runtime type to a priority number.
  /// Lower = more urgent.
  int _typePriority(HardwareEvent event) {
    if (event is ButtonPressEvent) {
      // SOS (button2 long press) is highest priority
      if (event.buttonId == ButtonId.button2 &&
          event.pressType == ButtonPressType.long) {
        return 0; // SOS
      }
      return 1; // Assist / other button actions
    }
    if (event is TelemetryEvent) return 2;
    if (event is HardwareErrorEvent) return 3;
    return 4; // Unknown event types get lowest priority
  }

  String _reasonForEvent(HardwareEvent event) {
    if (event is ButtonPressEvent) {
      if (event.buttonId == ButtonId.button2 &&
          event.pressType == ButtonPressType.long) {
        return 'sos-priority';
      }
      return event.trusted ? 'trusted-action' : 'action-priority';
    }
    if (event is TelemetryEvent) return 'telemetry-priority';
    if (event is HardwareErrorEvent) return 'error-priority';
    return 'default-priority';
  }
}
