import '../../../core/errors/app_error.dart';

enum SafetyStatus { idle, triggered, sending, sent, failed }

/// Represents a single SOS action with its current state and metadata.
class SafetyState {
  SafetyState({
    required this.status,
    this.triggeredAt,
    AppError? error,
    String? lastError,
    this.attemptCount = 0,
    this.traceId,
    this.location,
  }) : error = error ?? (lastError == null ? null : AppError.safety(lastError, retryable: true));

  final SafetyStatus status;
  final DateTime? triggeredAt;
  final AppError? error;
  final int attemptCount;
  final String? traceId;
  final String? location;

  String? get lastError => error?.message;

  SafetyState copyWith({
    SafetyStatus? status,
    DateTime? triggeredAt,
    AppError? error,
    String? lastError,
    int? attemptCount,
    String? traceId,
    String? location,
  }) {
    return SafetyState(
      status: status ?? this.status,
      triggeredAt: triggeredAt ?? this.triggeredAt,
      error: error ?? this.error,
      lastError: lastError,
      attemptCount: attemptCount ?? this.attemptCount,
      traceId: traceId ?? this.traceId,
      location: location ?? this.location,
    );
  }

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
  SafetyState toFailed(Object error) {
    if (status != SafetyStatus.sending) {
      return this;
    }
    final appError = error is AppError
        ? error
        : AppError.safety(error.toString(), retryable: true);
    return SafetyState(
      status: SafetyStatus.failed,
      triggeredAt: triggeredAt,
      error: appError,
      attemptCount: attemptCount + 1,
      location: location,
    );
  }

  /// Allow retry from failed state
  SafetyState retry() {
    if (status != SafetyStatus.failed || !isRetryable) {
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
    return SafetyState(status: SafetyStatus.idle);
  }

  bool get isRetryable => status == SafetyStatus.failed && attemptCount < 3 && (error?.retryable ?? true);
}
