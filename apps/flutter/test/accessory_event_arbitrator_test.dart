import 'package:diya_flutter/core/device/accessory_event.dart';
import 'package:diya_flutter/core/device/accessory_event_arbitrator.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('AccessoryEventArbitrator', () {
    test('prefers safety events over assist events', () {
      final arbitrator = const AccessoryEventArbitrator();
      final now = DateTime.utc(2026, 4, 28, 12, 0);

      final result = arbitrator.resolve([
        AccessoryEvent(
          eventId: 'assist-1',
          sourceDeviceId: 'goggle-1',
          accessoryKind: AccessoryKind.goggle,
          eventType: AccessoryEventType.assist,
          receivedAt: now,
          trusted: true,
        ),
        AccessoryEvent(
          eventId: 'safety-1',
          sourceDeviceId: 'cane-1',
          accessoryKind: AccessoryKind.cane,
          eventType: AccessoryEventType.safety,
          receivedAt: now,
          trusted: false,
        ),
      ]);

      expect(result.winner?.eventId, 'safety-1');
      expect(result.reason, 'safety-priority');
      expect(result.suppressedEvents, hasLength(1));
    });

    test('keeps deterministic ordering for simultaneous trusted events', () {
      final arbitrator = const AccessoryEventArbitrator();
      final now = DateTime.utc(2026, 4, 28, 12, 0);

      final result = arbitrator.resolve([
        AccessoryEvent(
          eventId: 'goggle-1',
          sourceDeviceId: 'goggle-1',
          accessoryKind: AccessoryKind.goggle,
          eventType: AccessoryEventType.assist,
          receivedAt: now,
          trusted: true,
        ),
        AccessoryEvent(
          eventId: 'cane-1',
          sourceDeviceId: 'cane-1',
          accessoryKind: AccessoryKind.cane,
          eventType: AccessoryEventType.assist,
          receivedAt: now,
          trusted: false,
        ),
      ]);

      expect(result.winner?.eventId, 'goggle-1');
      expect(result.reason, 'trusted-assist');
    });
  });
}
