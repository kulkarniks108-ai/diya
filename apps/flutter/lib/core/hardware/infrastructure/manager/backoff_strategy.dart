import 'dart:math';

/// Calculates delays for reconnecting devices using an exponential backoff algorithm.
class BackoffStrategy {
  static const int _baseDelayMs = 1000;
  static const int _maxDelayMs = 30000; // 30 seconds cap

  int calculateDelay(int attemptCount) {
    if (attemptCount <= 0) return 0;
    
    // Calculate exponential backoff: 1s, 2s, 4s, 8s, 16s...
    final exponentialDelay = _baseDelayMs * pow(2, attemptCount - 1);
    
    // Add jitter (+/-10%) to prevent thundering herd if multiple devices retry at once
    final jitter = (exponentialDelay * 0.1 * (Random().nextDouble() * 2 - 1)).toInt();
    
    final delay = (exponentialDelay + jitter).toInt();
    
    return min(delay, _maxDelayMs);
  }
}
