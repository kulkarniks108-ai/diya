import 'package:flutter_test/flutter_test.dart';
import 'package:diya_flutter/features/safety/models/safety_state.dart';
import 'package:diya_flutter/features/safety/services/safety_service.dart';
import 'package:diya_flutter/core/network/safety_api.dart';
import 'package:diya_flutter/core/queue/queue_item.dart';
import 'package:diya_flutter/core/queue/queue_repository.dart';

class FakeSafetyApi extends SafetyApi {
  FakeSafetyApi() : super(dio: null);

  bool shouldFail = false;

  @override
  Future<SafetyEventResponse> createSafetyEvent({
    required String accessToken,
    required Map<String, dynamic> payload,
    required String idempotencyKey,
  }) async {
    if (shouldFail) {
      throw Exception('Network error');
    }
    return SafetyEventResponse(
      eventId: 'evt-123',
      traceId: 'trace-456',
      timestamp: DateTime.now(),
    );
  }
}

class FakeQueueRepository extends QueueRepository {
  FakeQueueRepository() : super(prefs: null);

  final List<QueueItem> _items = [];

  @override
  Future<void> clear() async {
    _items.clear();
  }

  @override
  Future<List<QueueItem>> loadQueue() async => List.from(_items);

  @override
  Future<void> enqueue(QueueItem item) async {
    _items.add(item);
  }

  @override
  Future<void> dequeue(String id) async {
    _items.removeWhere((item) => item.id == id);
  }

  @override
  Future<void> update(QueueItem item) async {
    final idx = _items.indexWhere((i) => i.id == item.id);
    if (idx >= 0) {
      _items[idx] = item;
    }
  }
}

void main() {
  group('SafetyState transitions', () {
    test('idle -> triggered transitions', () {
      var state = const SafetyState(status: SafetyStatus.idle);
      final now = DateTime.now();

      state = state.toTriggered(now);

      expect(state.status, equals(SafetyStatus.triggered));
      expect(state.triggeredAt, isNotNull);
    });

    test('triggered -> sending -> sent', () {
      var state = const SafetyState(status: SafetyStatus.idle);
      state = state.toTriggered(DateTime.now());

      state = state.toSending();
      expect(state.status, equals(SafetyStatus.sending));

      state = state.toSent('trace-id-123');
      expect(state.status, equals(SafetyStatus.sent));
      expect(state.traceId, equals('trace-id-123'));
    });

    test('sending -> failed allows retry', () {
      var state = const SafetyState(status: SafetyStatus.idle);
      state = state.toTriggered(DateTime.now());
      state = state.toSending();

      state = state.toFailed('Network error');
      expect(state.status, equals(SafetyStatus.failed));
      expect(state.isRetryable, isTrue);

      state = state.retry();
      expect(state.status, equals(SafetyStatus.sending));
    });

    test('failed state with max retries is not retryable', () {
      var state = SafetyState(
        status: SafetyStatus.failed,
        lastError: 'error',
        attemptCount: 3,
      );
      expect(state.isRetryable, isFalse);
    });

    test('reset clears state', () {
      var state = SafetyState(
        status: SafetyStatus.sent,
        traceId: 'trace-id',
        attemptCount: 2,
      );

      state = state.reset();

      expect(state.status, equals(SafetyStatus.idle));
      expect(state.traceId, isNull);
      expect(state.attemptCount, equals(0));
    });

    test('invalid transitions are ignored', () {
      // Try to transition from idle -> sending (should fail)
      var state = const SafetyState(status: SafetyStatus.idle);
      final original = state;

      state = state.toSending();

      // Should remain idle
      expect(state.status, equals(original.status));
    });
  });

  group('SafetyService SOS operations', () {
    test('successful SOS trigger moves to sent state', () async {
      final api = FakeSafetyApi();
      final queue = FakeQueueRepository();
      final service = SafetyService(safetyApi: api, queueRepository: queue);

      final state = await service.triggerSOS(
        accessToken: 'token-123',
        location: '40.7128,-74.0060',
      );

      expect(state.status, equals(SafetyStatus.sent));
      expect(state.traceId, isNotNull);
      // Queue should be empty on success
      expect(await queue.loadQueue(), isEmpty);
    });

    test('failed SOS trigger queues item and moves to failed state', () async {
      final api = FakeSafetyApi();
      api.shouldFail = true;
      final queue = FakeQueueRepository();
      final service = SafetyService(safetyApi: api, queueRepository: queue);

      final state = await service.triggerSOS(
        accessToken: 'token-123',
        location: '40.7128,-74.0060',
      );

      expect(state.status, equals(SafetyStatus.failed));
      // Queue should have one item
      final queued = await queue.loadQueue();
      expect(queued, hasLength(1));
      expect(queued[0].type, equals(QueueItemType.sos));
    });

    test('retry succeeds and removes from queue', () async {
      final api = FakeSafetyApi();
      final queue = FakeQueueRepository();
      final service = SafetyService(safetyApi: api, queueRepository: queue);

      // First, trigger and fail
      api.shouldFail = true;
      await service.triggerSOS(
        accessToken: 'token-123',
        location: '40.7128,-74.0060',
      );
      expect(await queue.loadQueue(), hasLength(1));

      // Now retry with network restored
      api.shouldFail = false;
      final queuedItem = (await queue.loadQueue())[0];
      final retryState = await service.retryQueuedSOS(
        queueItem: queuedItem,
        accessToken: 'token-123',
      );

      expect(retryState.status, equals(SafetyStatus.sent));
      expect(await queue.loadQueue(), isEmpty);
    });

    test('retry updates attempts and re-queues on failure', () async {
      final api = FakeSafetyApi();
      api.shouldFail = true;
      final queue = FakeQueueRepository();
      final service = SafetyService(safetyApi: api, queueRepository: queue);

      // Initial failure
      await service.triggerSOS(
        accessToken: 'token-123',
        location: '40.7128,-74.0060',
      );

      var queuedItem = (await queue.loadQueue())[0];
      expect(queuedItem.attempts, equals(0));

      // Retry attempt
      await service.retryQueuedSOS(
        queueItem: queuedItem,
        accessToken: 'token-123',
      );

      // Verify attempts incremented
      queuedItem = (await queue.loadQueue())[0];
      expect(queuedItem.attempts, equals(1));
    });

    test('max retries exceeded removes from queue', () async {
      final api = FakeSafetyApi();
      api.shouldFail = true;
      final queue = FakeQueueRepository();
      final service = SafetyService(safetyApi: api, queueRepository: queue);

      // Create a queue item at max attempts
      final item = QueueItem(
        id: 'sos-123',
        type: QueueItemType.sos,
        payload: {'location': '40.7128,-74.0060'},
        createdAt: DateTime.now(),
        attempts: 3,
      );
      await queue.enqueue(item);

      // Try to retry (should fail and remove)
      await service.retryQueuedSOS(queueItem: item, accessToken: 'token-123');

      expect(await queue.loadQueue(), isEmpty);
    });

    test('processQueue processes all items', () async {
      final api = FakeSafetyApi();
      final queue = FakeQueueRepository();
      final service = SafetyService(safetyApi: api, queueRepository: queue);

      // Add two items to queue
      await queue.enqueue(QueueItem(
        id: 'sos-1',
        type: QueueItemType.sos,
        payload: {'location': 'loc1'},
        createdAt: DateTime.now(),
        attempts: 0,
      ));
      await queue.enqueue(QueueItem(
        id: 'sos-2',
        type: QueueItemType.sos,
        payload: {'location': 'loc2'},
        createdAt: DateTime.now(),
        attempts: 0,
      ));

      await service.processQueue('token-123');

      // All items should be processed and removed
      expect(await queue.loadQueue(), isEmpty);
    });
  });

  group('Queue operations', () {
    test('enqueue and load', () async {
      final queue = FakeQueueRepository();
      final item = QueueItem(
        id: 'sos-1',
        type: QueueItemType.sos,
        payload: {'location': '40.7128,-74.0060'},
        createdAt: DateTime.now(),
      );

      await queue.enqueue(item);

      final loaded = await queue.loadQueue();
      expect(loaded, hasLength(1));
      expect(loaded[0].id, equals('sos-1'));
    });

    test('dequeue removes item', () async {
      final queue = FakeQueueRepository();
      final item = QueueItem(
        id: 'sos-1',
        type: QueueItemType.sos,
        payload: {'location': '40.7128,-74.0060'},
        createdAt: DateTime.now(),
      );

      await queue.enqueue(item);
      expect(await queue.loadQueue(), hasLength(1));

      await queue.dequeue('sos-1');
      expect(await queue.loadQueue(), isEmpty);
    });

    test('update modifies existing item', () async {
      final queue = FakeQueueRepository();
      var item = QueueItem(
        id: 'sos-1',
        type: QueueItemType.sos,
        payload: {'location': 'loc1'},
        createdAt: DateTime.now(),
        attempts: 0,
      );

      await queue.enqueue(item);
      item.attempts = 2;
      await queue.update(item);

      final updated = (await queue.loadQueue())[0];
      expect(updated.attempts, equals(2));
    });
  });

  group('Edge cases', () {
    test('multiple rapid triggers only process one', () async {
      final api = FakeSafetyApi();
      api.shouldFail = true;
      final queue = FakeQueueRepository();
      final service = SafetyService(safetyApi: api, queueRepository: queue);

      // Simulate rapid triggers (should queue independently)
      await service.triggerSOS(accessToken: 'token', location: 'loc1');
      await service.triggerSOS(accessToken: 'token', location: 'loc2');

      // Both should be queued
      final items = await queue.loadQueue();
      expect(items, hasLength(2));
    });

    test('network failure during retry increments attempts', () async {
      final api = FakeSafetyApi();
      api.shouldFail = true;
      final queue = FakeQueueRepository();
      final service = SafetyService(safetyApi: api, queueRepository: queue);

      final item = QueueItem(
        id: 'sos-1',
        type: QueueItemType.sos,
        payload: {'location': 'loc'},
        createdAt: DateTime.now(),
        attempts: 1,
      );

      await service.retryQueuedSOS(queueItem: item, accessToken: 'token');

      final updated = (await queue.loadQueue())[0];
      expect(updated.attempts, equals(2));
    });
  });
}
