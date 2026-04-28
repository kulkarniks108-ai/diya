import 'accessory_event.dart';

class AccessoryEventArbitrator {
  const AccessoryEventArbitrator();

  ArbitrationResult resolve(List<AccessoryEvent> events) {
    if (events.isEmpty) {
      return const ArbitrationResult(winner: null, suppressedEvents: <AccessoryEvent>[], reason: 'no-events');
    }

    final sorted = [...events]..sort(_compareEvents);
    final winner = sorted.first;
    final suppressed = sorted.skip(1).toList(growable: false);

    final reason = switch (winner.eventType) {
      AccessoryEventType.safety => 'safety-priority',
      AccessoryEventType.assist => winner.trusted ? 'trusted-assist' : 'assist-priority',
      AccessoryEventType.command => 'command-priority',
      AccessoryEventType.telemetry => 'telemetry-priority',
    };

    return ArbitrationResult(winner: winner, suppressedEvents: suppressed, reason: reason);
  }

  int _compareEvents(AccessoryEvent left, AccessoryEvent right) {
    final leftPriority = _priority(left.eventType);
    final rightPriority = _priority(right.eventType);
    if (leftPriority != rightPriority) {
      return leftPriority.compareTo(rightPriority);
    }

    if (left.trusted != right.trusted) {
      return left.trusted ? -1 : 1;
    }

    final timeComparison = left.receivedAt.compareTo(right.receivedAt);
    if (timeComparison != 0) {
      return timeComparison;
    }

    if (left.priority != right.priority) {
      return left.priority.compareTo(right.priority);
    }

    return left.eventId.compareTo(right.eventId);
  }

  int _priority(AccessoryEventType eventType) {
    return switch (eventType) {
      AccessoryEventType.safety => 0,
      AccessoryEventType.assist => 1,
      AccessoryEventType.command => 2,
      AccessoryEventType.telemetry => 3,
    };
  }
}
