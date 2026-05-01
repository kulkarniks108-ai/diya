import 'package:diya_flutter/core/hardware/domain/messaging/event_arbitrator.dart';
import 'package:diya_flutter/core/hardware/domain/models/hardware_event.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('EventArbitrator', () {
    test('prefers SOS button press over assist button press', () {
      const arbitrator = EventArbitrator();
      final now = DateTime.utc(2026, 4, 28, 12, 0);

      final result = arbitrator.resolve([
        ButtonPressEvent(
          deviceId: 'goggle-1',
          eventId: 'assist-1',
          buttonId: ButtonId.button1,
          pressType: ButtonPressType.short,
          timestamp: now,
          priority: 1,
          trusted: true,
        ),
        ButtonPressEvent(
          deviceId: 'cane-1',
          eventId: 'safety-1',
          buttonId: ButtonId.button2,
          pressType: ButtonPressType.long,
          timestamp: now,
          priority: 0,
          trusted: false,
        ),
      ]);

      expect(result.winner?.eventId, 'safety-1');
      expect(result.reason, 'sos-priority');
      expect(result.suppressedEvents, hasLength(1));
    });

    test('keeps deterministic ordering for simultaneous trusted events', () {
      const arbitrator = EventArbitrator();
      final now = DateTime.utc(2026, 4, 28, 12, 0);

      final result = arbitrator.resolve([
        ButtonPressEvent(
          deviceId: 'goggle-1',
          eventId: 'goggle-1',
          buttonId: ButtonId.button1,
          pressType: ButtonPressType.short,
          timestamp: now,
          priority: 1,
          trusted: true,
        ),
        ButtonPressEvent(
          deviceId: 'cane-1',
          eventId: 'cane-1',
          buttonId: ButtonId.button1,
          pressType: ButtonPressType.short,
          timestamp: now,
          priority: 1,
          trusted: false,
        ),
      ]);

      expect(result.winner?.eventId, 'goggle-1');
      expect(result.reason, 'trusted-action');
    });

    test('returns no-events for empty input', () {
      const arbitrator = EventArbitrator();

      final result = arbitrator.resolve([]);

      expect(result.winner, isNull);
      expect(result.reason, 'no-events');
      expect(result.suppressedEvents, isEmpty);
    });

    test('single event always wins', () {
      const arbitrator = EventArbitrator();

      final result = arbitrator.resolve([
        TelemetryEvent(
          deviceId: 'cane-1',
          eventId: 'telem-1',
          batteryLevel: 85,
          status: 'ok',
          priority: 2,
        ),
      ]);

      expect(result.winner?.eventId, 'telem-1');
      expect(result.reason, 'telemetry-priority');
      expect(result.suppressedEvents, isEmpty);
    });
  });
}
