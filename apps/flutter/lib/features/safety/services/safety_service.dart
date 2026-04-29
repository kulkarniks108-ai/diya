import 'package:uuid/uuid.dart';

import '../../../core/errors/app_error.dart';
import '../../../core/errors/app_error_mapper.dart';
import '../../../core/network/safety_api.dart';
import '../../../core/queue/queue_item.dart';
import '../../../core/queue/queue_repository.dart';
import '../models/safety_state.dart';

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

  Future<SafetyState> triggerSOS({
    required String accessToken,
    required String location,
  }) async {
    var state = SafetyState(status: SafetyStatus.idle).toTriggered(DateTime.now());
    state = state.copyWith(location: location).toSending();

    try {
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

      return state.toSent(response.traceId);
    } catch (error) {
      final appError = AppErrorMapper.fromException(error, fallbackType: AppErrorType.safety);
      final failedState = state.toFailed(appError);

      if (appError.retryable) {
        final idempotencyKey = const Uuid().v4();
        final queueItem = QueueItem(
          id: const Uuid().v4(),
          type: QueueItemType.sos,
          payload: <String, dynamic>{
            'location': location,
            'timestamp': DateTime.now().toIso8601String(),
          },
          createdAt: DateTime.now(),
          idempotencyKey: idempotencyKey, // Store for deduplication
        );
        await _queueRepository.enqueue(queueItem);
      }

      return failedState;
    }
  }

  Future<SafetyState> retryQueuedSOS({
    required QueueItem queueItem,
    required String accessToken,
  }) async {
    var state = SafetyState(
      status: SafetyStatus.failed,
      attemptCount: queueItem.attempts,
      error: AppError.safety('Queued SOS retry requested.', retryable: true),
    ).retry();

    try {
      state = state.toSending();

      final response = await _api.createSafetyEvent(
        accessToken: accessToken,
        payload: queueItem.payload,
        idempotencyKey: queueItem.id,
      );

      await _queueRepository.dequeue(queueItem.id);
      return state.toSent(response.traceId);
    } catch (error) {
      final appError = AppErrorMapper.fromException(error, fallbackType: AppErrorType.safety);

      queueItem.attempts++;
      if (queueItem.attempts < _maxRetries && appError.retryable) {
        await _queueRepository.update(queueItem);
      } else {
        await _queueRepository.dequeue(queueItem.id);
      }

      return SafetyState(
        status: SafetyStatus.failed,
        attemptCount: queueItem.attempts,
        error: queueItem.attempts >= _maxRetries
            ? AppError.safety('SOS retry limit reached.', code: 'SOS_MAX_RETRIES')
            : appError,
      );
    }
  }

  Future<void> processQueue(String accessToken) async {
    final queue = await _queueRepository.loadQueue();
    for (final item in queue) {
      if (item.attempts < _maxRetries) {
        await retryQueuedSOS(queueItem: item, accessToken: accessToken);
      }
    }
  }
}
