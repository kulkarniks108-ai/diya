import 'dart:async';

/// Simple async lock to prevent concurrent access to a resource.
class AsyncLock {
  Future<void>? _lockFuture;

  /// Acquire the lock and run the function.
  /// Only one function will be executed at a time.
  Future<T> acquire<T>(Future<T> Function() fn) async {
    // Wait for any existing lock
    if (_lockFuture != null) {
      await _lockFuture;
    }

    // Create a new lock completer
    final completer = Completer<void>();
    _lockFuture = completer.future;

    try {
      // Execute the function
      return await fn();
    } finally {
      // Release the lock
      completer.complete();
      _lockFuture = null;
    }
  }
}
