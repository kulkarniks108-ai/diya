# Safety System (SOS) Implementation

## Overview

The Safety System implements Phase 2 core requirement: a deterministic SOS (Safety) workflow with offline queue support. Users can trigger SOS in the field, and the action is reliably transmitted to the backend even if the network is temporarily unavailable.

## Architecture

### State Machine: SafetyState

The safety action follows a deterministic state machine with five states:

```
idle -> triggered -> sending -> sent (success)
                           \
                            -> failed (with retry on network recovery)
```

**States:**
- `idle`: No active safety action
- `triggered`: User initiated SOS; awaiting permission + network checks
- `sending`: Request in flight to backend
- `sent`: Backend received and processed (success)
- `failed`: Backend rejected or network error; queued for retry

**Transitions:**
- `idle` → `triggered`: User calls `triggerSOS()`
- `triggered` → `sending`: Permissions granted + network available
- `sending` → `sent`: Backend confirms (HTTP 202)
- `sending` → `failed`: Network error or backend error
- `failed` → `sending` (retry): App bootstrap or manual retry
- `failed` → `idle` (reset): User cancels

### Offline Queue System

When a SOS fails (network error, backend unavailable):
1. The action is stored in a `QueueItem` with metadata (location, timestamp, attempt count)
2. On app restart or network regain, queued items are processed
3. Each item has a max retry limit of 3 attempts
4. After max retries, the item is removed and user is notified

**Data Model:**
```dart
class QueueItem {
  String id;                    // UUID
  QueueItemType type;           // SOS only for now
  Map<String, dynamic> payload; // {location, timestamp}
  DateTime createdAt;
  int attempts;                 // Increment on each retry
}
```

### Layers (Clean Architecture)

```
UI Layer
  ├─ SafetyWidget (uses safetyControllerProvider)
  └─ observes SafetyState from controller

Provider Layer (Riverpod)
  ├─ safetyControllerProvider (ChangeNotifier)
  ├─ safetyServiceProvider
  ├─ safetyApiProvider
  └─ queueRepositoryProvider

Service Layer
  ├─ SafetyService (business logic)
  │  ├─ triggerSOS()
  │  ├─ retryQueuedSOS()
  │  └─ processQueue()
  └─ SafetyApi (network client)

Repository Layer
  ├─ QueueRepository (persistence)
  │  ├─ loadQueue()
  │  ├─ enqueue()
  │  ├─ dequeue()
  │  └─ update()

Backend API
  └─ POST /safety/events (with Idempotency-Key header)
```

## File Structure

```
apps/flutter/lib/
├─ core/
│  ├─ network/
│  │  └─ safety_api.dart          # SafetyApi HTTP client
│  └─ queue/
│     ├─ queue_item.dart          # QueueItem model
│     └─ queue_repository.dart    # Persistence layer
├─ features/
│  └─ safety/
│     ├─ models/
│     │  └─ safety_state.dart     # SafetyState machine
│     ├─ services/
│     │  └─ safety_service.dart   # Business logic
│     └─ providers/
│        └─ safety_controller.dart # Riverpod provider
├─ test/
│  ├─ safety_test.dart            # Comprehensive unit tests
│  └─ session_controller_test.dart # Session bootstrap tests

apps/flutter/pubspec.yaml
  ├─ uuid: ^4.0.0 (added)
```

## Usage

### Trigger SOS from a Widget

```dart
Widget build(BuildContext context, WidgetRef ref) {
  final safetyController = ref.read(safetyControllerProvider);
  final safetyState = ref.watch(safetyControllerProvider);

  return ElevatedButton(
    onPressed: () {
      final session = ref.read(sessionControllerProvider).state.session;
      if (session == null) return;

      safetyController.triggerSOS(
        accessToken: session.accessToken,
        location: '40.7128,-74.0060', // From location service
      );
    },
    child: const Text('SOS'),
  );
}
```

### Observe Safety State

```dart
@override
Widget build(BuildContext context, WidgetRef ref) {
  final safetyState = ref.watch(safetyControllerProvider);

  return switch (safetyState.status) {
    SafetyStatus.idle => Text('Ready'),
    SafetyStatus.triggered => Text('SOS triggered'),
    SafetyStatus.sending => Text('Sending to family...'),
    SafetyStatus.sent => Text('Family notified'),
    SafetyStatus.failed => Row(
      children: [
        Text('Failed: ${safetyState.lastError}'),
        if (safetyState.isRetryable)
          ElevatedButton(
            onPressed: () => safetyController.retrySOS(
              accessToken: session.accessToken,
            ),
            child: const Text('Retry'),
          ),
      ],
    ),
  };
}
```

### Process Queued Items on App Bootstrap

Add this to your app initialization (e.g., in main app widget):

```dart
class MyApp extends StatefulWidget {
  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  @override
  void initState() {
    super.initState();
    _processQueuedSOS();
  }

  Future<void> _processQueuedSOS() async {
    // This should run after session is loaded
    final container = ProviderContainer();
    final controller = container.read(safetyControllerProvider);
    final session = container.read(sessionControllerProvider).state.session;

    if (session != null) {
      await controller.processQueue(session.accessToken);
    }
  }

  @override
  Widget build(BuildContext context) {
    // Your app build...
  }
}
```

## Backend Contract

The backend must implement:

```http
POST /safety/events
Authorization: Bearer {accessToken}
Idempotency-Key: {uuid}
Content-Type: application/json

{
  "location": "40.7128,-74.0060",
  "timestamp": "2026-04-28T10:30:00Z"
}

Response (202):
{
  "id": "evt-123",
  "trace_id": "trace-456",
  "timestamp": "2026-04-28T10:30:00Z"
}
```

**Key requirement:** The endpoint must accept an `Idempotency-Key` header and guarantee that duplicate requests with the same key return the same response (preventing double processing).

## Testing

Run unit tests:

```bash
cd apps/flutter
flutter test test/safety_test.dart
```

Tests cover:
- ✅ State transitions (all valid and invalid transitions)
- ✅ SOS trigger success/failure
- ✅ Queue enqueue/dequeue/update operations
- ✅ Retry logic with attempt limits
- ✅ Max retries exceeded handling
- ✅ Batch queue processing
- ✅ Edge cases (rapid triggers, network failures)

## Known Limitations

1. **Simple persistence**: Uses SharedPreferences (plaintext JSON). For enhanced security, queue items could be encrypted using flutter_secure_storage in a future iteration.

2. **No exponential backoff**: Retries use immediate retry. A future version should implement exponential backoff with jitter to avoid thundering herd during mass outages.

3. **No cross-device sync**: Queue is local only; if the user has multiple devices, each device maintains its own queue. Centralized queue state could be implemented via backend sync endpoint in Phase 3.

4. **Limited payload handling**: Currently hardcoded for SOS with location/timestamp. Future queue items (assist requests, contact updates) would require polymorphic payload schema.

5. **No background processing**: Queue processing happens on app foreground only. Proper background execution (WorkManager on Android, BGTaskScheduler on iOS) is deferred to Phase 5 (Reliability & Observability).

6. **No trace propagation**: Safety events include `trace_id` from backend but client doesn't propagate logs with this ID. Structured logging is Phase 5 work.

7. **Manual retry only**: No automatic retry timer. User or app bootstrap must explicitly trigger retry. Background retry scheduler is Phase 5.

## Future Improvements

1. **Phase 3**: Integrate with BackgroundExecution service to process queue on schedule
2. **Phase 4**: Add location provider integration for automatic location snapshots
3. **Phase 5**: Add structured logging, metrics, and trace-ID propagation
4. **Phase 5**: Implement exponential backoff with jitter and adaptive retry windows
5. **Phase 5**: Add queue encryption for enhanced security
6. **Later**: Polymorphic queue support for other action types (assist, notifications)

## Assumptions

- Backend `/safety/events` endpoint exists and is idempotent
- User has location available at trigger time (source TBD in Phase 4)
- App bootstrap calls `processQueue()` after session validation (Step 2 of Phase 2)
- Network failures are transient and will recover (no indefinite offline scenarios)
- Max 3 retries is acceptable for safety-critical actions (may be revisited after beta)

---

## Design Rationale

### Why deterministic state machine?

Safety-critical actions require predictable behavior. A state machine makes transitions explicit, testable, and easy to reason about under failure conditions.

### Why offline queue?

Users in emergency situations may be in areas with intermittent connectivity. Queuing failed actions ensures we don't lose critical SOS events.

### Why max 3 retries?

Too many retries waste battery and network. Too few risk losing events. 3 is a practical balance; the threshold is observable in logs and can be adjusted based on real-world data.

### Why idempotency-key?

Idempotent requests prevent duplicate SOS alerts if a network request succeeds on the backend but the response is lost. This is critical to avoid confusing family with duplicate notifications.

---
