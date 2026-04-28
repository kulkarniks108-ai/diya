import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/device/accessory_event.dart';
import '../../core/device/accessory_event_arbitrator.dart';
import '../../core/session/session_controller.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final controller = ref.watch(sessionControllerProvider);
    final state = controller.state;
    final session = state.session;
    final arbitrator = const AccessoryEventArbitrator();

    return Scaffold(
      appBar: AppBar(
        title: const Text('2ndEye Control Center'),
        actions: [
          TextButton(
            onPressed: state.isAuthenticated ? () => controller.refreshSession() : null,
            child: const Text('Refresh'),
          ),
          TextButton(
            onPressed: state.isAuthenticated ? () => controller.signOut() : null,
            child: const Text('Logout'),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          _StatusCard(
            title: 'Session',
            lines: [
              'Status: ${state.status.name}',
              if (session != null) 'User: ${session.email}',
              if (session != null) 'Roles: ${session.roles.join(', ')}',
              if (session != null) 'Session ID: ${session.sessionId}',
              if (state.errorMessage != null) 'Error: ${state.errorMessage}',
            ],
          ),
          const SizedBox(height: 16),
          _StatusCard(
            title: 'Future-safe coding rules',
            lines: const [
              'Android-first scaffold',
              'Push notifications postponed',
              'Simultaneous accessory events supported',
              'Auth/session plumbing included in this slice',
            ],
          ),
          const SizedBox(height: 16),
          _AccessoryArbitrationCard(
            onSimulate: () {
              final now = DateTime.now().toUtc();
              final result = arbitrator.resolve([
                AccessoryEvent(
                  eventId: 'cane-${now.microsecondsSinceEpoch}',
                  sourceDeviceId: 'cane-001',
                  accessoryKind: AccessoryKind.cane,
                  eventType: AccessoryEventType.safety,
                  receivedAt: now,
                  trusted: true,
                  payload: const <String, Object?>{'action': 'sos'},
                ),
                AccessoryEvent(
                  eventId: 'goggle-${now.microsecondsSinceEpoch + 1}',
                  sourceDeviceId: 'goggle-001',
                  accessoryKind: AccessoryKind.goggle,
                  eventType: AccessoryEventType.assist,
                  receivedAt: now,
                  trusted: true,
                  payload: const <String, Object?>{'action': 'scene'},
                ),
              ]);

              controller.updateArbitrationSummary(
                'Winner: ${result.winner?.sourceDeviceId} | Reason: ${result.reason} | Suppressed: ${result.suppressedEvents.length}',
              );
            },
          ),
          const SizedBox(height: 16),
          _StatusCard(
            title: 'Latest arbitration result',
            lines: [state.lastArbitrationSummary ?? 'No event batch simulated yet.'],
          ),
        ],
      ),
    );
  }
}

class _StatusCard extends StatelessWidget {
  const _StatusCard({required this.title, required this.lines});

  final String title;
  final List<String> lines;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 12),
            for (final line in lines)
              Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Text(line),
              ),
          ],
        ),
      ),
    );
  }
}

class _AccessoryArbitrationCard extends StatelessWidget {
  const _AccessoryArbitrationCard({required this.onSimulate});

  final VoidCallback onSimulate;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Accessory event arbitration', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 12),
            const Text(
              'Simulates simultaneous cane safety and goggle assist events so the first coding slice can prove deterministic conflict handling.',
            ),
            const SizedBox(height: 16),
            FilledButton(onPressed: onSimulate, child: const Text('Simulate simultaneous events')),
          ],
        ),
      ),
    );
  }
}
