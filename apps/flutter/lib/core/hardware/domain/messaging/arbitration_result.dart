import '../models/hardware_event.dart';

/// The outcome of running event arbitration on a batch of events.
///
/// Contains the winning event (if any), the list of events that were
/// suppressed, and a human-readable reason explaining why the winner won.
class ArbitrationResult {
  const ArbitrationResult({
    required this.winner,
    required this.suppressedEvents,
    required this.reason,
  });

  /// The event that won arbitration. Null if the input batch was empty.
  final HardwareEvent? winner;

  /// Events that arrived in the same window but lost to the winner.
  final List<HardwareEvent> suppressedEvents;

  /// Human-readable explanation of why this winner was chosen.
  /// Examples: 'safety-priority', 'trusted-assist', 'no-events'
  final String reason;
}
