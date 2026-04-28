import 'package:uuid/uuid.dart';

import '../../core/network/safety_api.dart';
import '../../core/queue/queue_item.dart';
import '../../core/queue/queue_repository.dart';
import 'models/safety_state.dart';

/// Service layer for safety operations (SOS).
/// Coordinates between API, persistence, and state management.
class SafetyService {
  SafetyService({
    required SafetyApi safetyApi,
    required QueueRepository queueRepository,
  })  : _api = safetyApi,
        _queueRepository = queueRepository;

  final SafetyApi _api;
  final QueueRepository _queueRepository;
  static const _maxRetries = 3;

  /// Trigger an SOS event with optional payload (location, timestamp, etc).
  Future<SafetyState> triggerSOS({
    required String accessToken,
    required String location,
  }) async {
    var state = SafetyState(
      status: SafetyStatus.idle,
    ).toTriggered(DateTime.now());

    // Move to sending state
    state = state.copyWith(location: location) ?? state;
    state = state.toSending();

    try {
      // Attempt to send immediately
      final payload = <String, dynamic>{
        'location': location,
        'timestamp': DateTime.now().toIso8601String(),
      };
      final idempotencyKey = const Uuid().v4();

      final response = await _api.createSafetyEvent(
        accessToken: accessToken,
        payload: payload,
        idempotencyKey: idempotencyKey,
      );

      // Success: move to sent state
      state = state.toSent(response.traceId);

      return state;
    } catch (e) {
      // Failure: move to failed state and queue for retry
      state = state.toFailed(e.toString());

      // Store in queue for later retry
      final queueItem = QueueItem(
        id: const Uuid().v4(),
        type: QueueItemType.sos,
        payload: <String, dynamic>{
          'location': location,
          'timestamp': DateTime.now().toIso8601String(),
        },
        createdAt: DateTime.now(),
      );
      await _queueRepository.enqueue(queueItem);

      return state;
    }
  }

  /// Retry a queued SOS action.
  Future<SafetyState> retryQueuedSOS({
    required QueueItem queueItem,
    required String accessToken,
  }) async {
    var state = SafetyState(
      status: SafetyStatus.failed,
      attemptCount: queueItem.attempts,
    ).retry();

    try {
      state = state.toSending();

      final response = await _api.createSafetyEvent(
        accessToken: accessToken,
        payload: queueItem.payload,
        idempotencyKey: queueItem.id, // Use queue item ID for idempotency
      );

      // Success: update queue and move to sent
      state = state.toSent(response.traceId);
      await _queueRepository.dequeue(queueItem.id);

      return state;
    } catch (e) {
      // Failure: check if retryable
      queueItem.attempts++;
      if (queueItem.attempts < _maxRetries) {
        await _queueRepository.update(queueItem);
        state = SafetyState(
          status: SafetyStatus.failed,
          lastError: e.toString(),
          attemptCount: queueItem.attempts,
        );
      } else {
        // Max retries exceeded: remove from queue
        await _queueRepository.dequeue(queueItem.id);
        state = SafetyState(
          status: SafetyStatus.failed,
          lastError: 'Max retries exceeded: $e',
          attemptCount: queueItem.attempts,
        );
      }

      return state;
    }
  }

  /// Process all queued SOS items (called on app bootstrap).
  Future<void> processQueue(String accessToken) async {
    final queue = await _queueRepository.loadQueue();
    for (final item in queue) {
      if (item.attempts < _maxRetries) {
        await retryQueuedSOS(queueItem: item, accessToken: accessToken);
      }
    }
  }
}

extension on SafetyState {
  SafetyState? copyWith({
    SafetyStatus? status,
    DateTime? triggeredAt,
    String? lastError,
    int? attemptCount,
    String? traceId,
    String? location,
  }) {
    return SafetyState(
      status: status ?? this.status,
      triggeredAt: triggeredAt ?? this.triggeredAt,
      lastError: lastError ?? this.lastError,
      attemptCount: attemptCount ?? this.attemptCount,
      traceId: traceId ?? this.traceId,
      location: location ?? this.location,
    );
  }
}
