import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/network/safety_api.dart';
import '../../core/queue/queue_repository.dart';
import '../../core/session/auth_session.dart';
import '../models/safety_state.dart';
import '../services/safety_service.dart';

// Providers
final safetyApiProvider = Provider<SafetyApi>((ref) => SafetyApi());

final queueRepositoryProvider = Provider<QueueRepository>((ref) => QueueRepository());

final safetyServiceProvider = Provider<SafetyService>((ref) {
  return SafetyService(
    safetyApi: ref.read(safetyApiProvider),
    queueRepository: ref.read(queueRepositoryProvider),
  );
});

final safetyControllerProvider = ChangeNotifierProvider<SafetyController>((ref) {
  return SafetyController(
    ref.read(safetyServiceProvider),
    ref.read(queueRepositoryProvider),
  );
});

/// Controller for managing safety/SOS state using Riverpod ChangeNotifier pattern.
class SafetyController extends ChangeNotifier {
  SafetyController(this._safetyService, this._queueRepository);

  final SafetyService _safetyService;
  final QueueRepository _queueRepository;

  SafetyState _state = const SafetyState(status: SafetyStatus.idle);

  SafetyState get state => _state;

  /// Trigger a new SOS event.
  /// Requires valid access token and location.
  Future<void> triggerSOS({
    required String accessToken,
    required String location,
  }) async {
    _state = _state.toTriggered(DateTime.now());
    notifyListeners();

    final newState = await _safetyService.triggerSOS(
      accessToken: accessToken,
      location: location,
    );

    _state = newState;
    notifyListeners();
  }

  /// Retry a failed SOS action (from queue).
  Future<void> retrySOS({required String accessToken}) async {
    final queue = await _queueRepository.loadQueue();
    if (queue.isEmpty) {
      return;
    }

    for (final item in queue) {
      if (item.attempts < 3) {
        _state = _state.retry();
        notifyListeners();

        final newState = await _safetyService.retryQueuedSOS(
          queueItem: item,
          accessToken: accessToken,
        );

        _state = newState;
        notifyListeners();

        // Retry only one item at a time
        return;
      }
    }
  }

  /// Process all queued SOS items (called on app bootstrap).
  Future<void> processQueue(String accessToken) async {
    await _safetyService.processQueue(accessToken);
    // Reset state after processing
    _state = const SafetyState(status: SafetyStatus.idle);
    notifyListeners();
  }

  /// Reset state to idle (e.g., after user dismisses SOS or after success).
  void reset() {
    _state = const SafetyState(status: SafetyStatus.idle);
    notifyListeners();
  }
}
