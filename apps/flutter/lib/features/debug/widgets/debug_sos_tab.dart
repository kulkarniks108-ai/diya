import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../safety/models/safety_state.dart';
import '../../safety/providers/safety_controller.dart';
import '../../../core/session/session_controller.dart';

class DebugSosTab extends ConsumerWidget {
  const DebugSosTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final safetyController = ref.watch(safetyControllerProvider);
    final state = safetyController.state;
    final sessionState = ref.watch(sessionControllerProvider).state;

    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            'Safety & SOS Trigger',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          _buildStatusCard(state),
          const SizedBox(height: 32),
          const Spacer(),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red.shade800,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 24),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
            ),
            onPressed: state.status == SafetyStatus.sending
                ? null
                : () async {
                    if (sessionState.accessToken == null) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Error: No active session. Please log in.')),
                      );
                      return;
                    }
                    await safetyController.triggerSOS(
                      accessToken: sessionState.accessToken!,
                      location: 'Debug User Location (Lat: 40.71, Lng: -74.00)',
                    );
                  },
            child: Text(
              state.status == SafetyStatus.sending ? 'SENDING SOS...' : 'TRIGGER SOS',
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
          ),
          const SizedBox(height: 16),
          if (state.status == SafetyStatus.failed || state.status == SafetyStatus.sent)
            OutlinedButton(
              onPressed: () => safetyController.reset(),
              child: const Text('Reset Safety State'),
            ),
        ],
      ),
    );
  }

  Widget _buildStatusCard(SafetyState state) {
    Color statusColor;
    IconData statusIcon;

    switch (state.status) {
      case SafetyStatus.idle:
        statusColor = Colors.grey;
        statusIcon = Icons.shield_outlined;
        break;
      case SafetyStatus.triggered:
        statusColor = Colors.orange;
        statusIcon = Icons.warning_amber_rounded;
        break;
      case SafetyStatus.sending:
        statusColor = Colors.blue;
        statusIcon = Icons.cloud_upload_outlined;
        break;
      case SafetyStatus.sent:
        statusColor = Colors.green;
        statusIcon = Icons.check_circle_outline;
        break;
      case SafetyStatus.failed:
        statusColor = Colors.red;
        statusIcon = Icons.error_outline;
        break;
    }

    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            Row(
              children: [
                Icon(statusIcon, color: statusColor, size: 32),
                const SizedBox(width: 16),
                Text(
                  state.status.name.toUpperCase(),
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: statusColor,
                  ),
                ),
              ],
            ),
            if (state.error != null) ...[
              const Divider(height: 24),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.info_outline, color: Colors.red, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Error: ${state.error!.message}',
                      style: const TextStyle(color: Colors.red),
                    ),
                  ),
                ],
              ),
            ]
          ],
        ),
      ),
    );
  }
}
