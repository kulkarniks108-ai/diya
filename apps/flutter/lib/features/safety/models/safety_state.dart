enum SafetyStatus { idle, triggered, sending, sent, failed }

/// Represents a single SOS action with its current state and metadata.
class SafetyState {
  const SafetyState({
    required this.status,
    this.triggeredAt,
    this.lastError,
    this.attemptCount = 0,
    this.traceId,
    this.location,
  });

  final SafetyStatus status;
  final DateTime? triggeredAt;
  final String? lastError;
  final int attemptCount;
  final String? traceId; // For backend tracking
  final String? location; // Snapshot of location at trigger time

  /// Transition to triggered state
  SafetyState toTriggered(DateTime now) {
    if (status != SafetyStatus.idle) {
      return this; // Only transition from idle
    }
    return SafetyState(
      status: SafetyStatus.triggered,
      triggeredAt: now,
      attemptCount: 0,
    );
  }

  /// Transition to sending state
  SafetyState toSending() {
    if (status != SafetyStatus.triggered) {
      return this;
    }
    return SafetyState(
      status: SafetyStatus.sending,
      triggeredAt: triggeredAt,
      attemptCount: attemptCount,
      location: location,
    );
  }

  /// Transition to sent state (success)
  SafetyState toSent(String traceId) {
    if (status != SafetyStatus.sending) {
      return this;
    }
    return SafetyState(
      status: SafetyStatus.sent,
      triggeredAt: triggeredAt,
      traceId: traceId,
      attemptCount: attemptCount + 1,
      location: location,
    );
  }

  /// Transition to failed state
  SafetyState toFailed(String error) {
    if (status != SafetyStatus.sending) {
      return this;
    }
    return SafetyState(
      status: SafetyStatus.failed,
      triggeredAt: triggeredAt,
      lastError: error,
      attemptCount: attemptCount + 1,
      location: location,
    );
  }

  /// Allow retry from failed state
  SafetyState retry() {
    if (status != SafetyStatus.failed) {
      return this;
    }
    return SafetyState(
      status: SafetyStatus.sending,
      triggeredAt: triggeredAt,
      attemptCount: attemptCount,
      location: location,
    );
  }

  /// Reset to idle
  SafetyState reset() {
    return const SafetyState(status: SafetyStatus.idle);
  }

  bool get isRetryable => status == SafetyStatus.failed && attemptCount < 3;
}
