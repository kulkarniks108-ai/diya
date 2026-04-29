import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/session/session_controller.dart';
import 'safety_controller.dart';

/// Bootstrap provider that processes any queued safety items on app startup.
/// This is called once when the session becomes authenticated.
final safetyBootstrapProvider = FutureProvider<void>((ref) async {
  final sessionState = ref.watch(sessionControllerProvider);
  final safetyController = ref.read(safetyControllerProvider);

  // Only process queue if we have a valid session
  if (sessionState.session == null) {
    return;
  }

  // Process any queued items asynchronously (non-blocking)
  await safetyController.processQueue(sessionState.session!.accessToken);
});
