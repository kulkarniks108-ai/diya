import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/errors/app_error.dart';
import '../../../core/permissions/permission_manager.dart';
import '../../../core/permissions/permission_manager_impl.dart';
import '../../../core/network/safety_api.dart';
import '../../../core/queue/queue_repository.dart';
import '../../../core/utils/async_lock.dart';
import '../models/safety_state.dart';
import '../services/safety_service.dart';

import 'dart:async';
import '../../../core/hardware/domain/messaging/event_router.dart';
import '../../../core/hardware/domain/models/hardware_event.dart';
import '../../../core/hardware/providers/hardware_providers.dart';
import '../../../core/session/session_repository.dart';
import '../../../core/session/session_controller.dart';

// Providers
final safetyApiProvider = Provider<SafetyApi>((ref) => SafetyApi());

final queueRepositoryProvider = Provider<QueueRepository>((ref) => QueueRepository());

final permissionManagerProviderAlias = Provider<PermissionManager>((ref) {
  return ref.read(permissionManagerProvider);
});

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
    ref.read(permissionManagerProviderAlias),
    ref.read(eventRouterProvider),
    ref.read(sessionRepositoryProvider),
  );
});

/// Controller for managing safety/SOS state using Riverpod ChangeNotifier pattern.
class SafetyController extends ChangeNotifier {
  SafetyController(
    this._safetyService, 
    this._queueRepository, 
    this._permissionManager,
    this._eventRouter,
    this._sessionRepository,
  ) {
    _hardwareSubscription = _eventRouter.resolvedEvents.listen(_onHardwareEvent);
  }

  final SafetyService _safetyService;
  final QueueRepository _queueRepository;
  final PermissionManager _permissionManager;
  final EventRouter _eventRouter;
  final SessionRepository _sessionRepository;
  
  final AsyncLock _queueProcessorLock = AsyncLock();
  StreamSubscription? _hardwareSubscription;

  SafetyState _state = SafetyState(status: SafetyStatus.idle);

  SafetyState get state => _state;

  /// Trigger a new SOS event.
  /// Requires valid access token and location.
  Future<void> triggerSOS({
    required String accessToken,
    required String location,
  }) async {
    _state = _state.toTriggered(DateTime.now());
    notifyListeners();

    final permission = await _permissionManager.request(AppPermission.location);
    if (permission != AppPermissionStatus.granted) {
      _state = SafetyState(
        status: SafetyStatus.failed,
        error: AppError.permission(
          permission == AppPermissionStatus.permanentlyDenied
              ? 'Location permission is permanently denied. Open settings to continue.'
              : 'Location permission is required to send SOS.',
          code: permission == AppPermissionStatus.permanentlyDenied ? 'PERMISSION_PERMANENTLY_DENIED' : 'PERMISSION_DENIED',
          retryable: permission == AppPermissionStatus.denied,
        ),
      );
      notifyListeners();
      return;
    }

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
    return _queueProcessorLock.acquire(() async {
      await _safetyService.processQueue(accessToken);
      // Removed the unconditional reset to idle to prevent "silent success" UI reset.
      // The state will reflect the last processed item's status.
      // If we want a specific "idle" state after a successful queue process, 
      // we should check if the queue is now empty.
      final queue = await _queueRepository.loadQueue();
      if (queue.isEmpty) {
        _state = SafetyState(status: SafetyStatus.idle);
      }
      notifyListeners();
    });
  }

  Future<void> openPermissionSettings() async {
    await _permissionManager.openSettings();
  }

  /// Reset state to idle (e.g., after user dismisses SOS or after success).
  void reset() {
    _state = SafetyState(status: SafetyStatus.idle);
    notifyListeners();
  }

  Future<void> _onHardwareEvent(HardwareEvent event) async {
    // SOS events are identified by priority 0
    if (event is ButtonPressEvent && event.priority == 0) {
      // Fetch session to get the access token
      final session = await _sessionRepository.load();
      if (session == null || session.accessToken.isEmpty) {
        // Cannot send SOS without an active user session.
        // We log it or handle it according to requirements.
        _state = SafetyState(
          status: SafetyStatus.failed,
          error: const AppError(
            type: AppErrorType.auth,
            message: "Cannot send SOS: User not logged in.",
          ),
        );
        notifyListeners();
        return;
      }

      // We ideally want actual location, but for hardware triggers
      // we can fetch it dynamically or pass a default "Hardware triggered" message.
      // Assuming triggerSOS handles the real location fetching downstream via PermissionManager.
      await triggerSOS(
        accessToken: session.accessToken,
        location: 'Hardware Triggered (Location Pending)',
      );
    }
  }

  @override
  void dispose() {
    _hardwareSubscription?.cancel();
    super.dispose();
  }
}
