import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/hardware/domain/models/base_device.dart';
import '../../../core/hardware/domain/models/connection_state.dart';
import '../../../core/hardware/providers/hardware_providers.dart';

class DeviceDetailScreen extends ConsumerWidget {
  final String deviceId;

  const DeviceDetailScreen({super.key, required this.deviceId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final devicesStream = ref.watch(deviceManagerProvider).devices;

    return StreamBuilder<List<BaseDevice>>(
      stream: devicesStream,
      initialData: const [],
      builder: (context, snapshot) {
        final devices = snapshot.data ?? [];
        final device = devices.where((d) => d.id == deviceId).firstOrNull;

        if (device == null) {
          return Scaffold(
            appBar: AppBar(title: const Text('Device Not Found')),
            body: const Center(child: Text('This device is no longer connected.')),
          );
        }

        final isCane = device.name.toLowerCase().contains('cane');
        final isGoggle = device.name.toLowerCase().contains('goggle');

        return Scaffold(
          appBar: AppBar(
            title: Text(device.name),
            actions: [
              IconButton(
                icon: const Icon(Icons.delete_outline, color: Colors.redAccent),
                tooltip: 'Disconnect & Forget',
                onPressed: () {
                  ref.read(deviceManagerProvider).disconnectDevice(device.id);
                  Navigator.of(context).pop();
                },
              )
            ],
          ),
          body: SingleChildScrollView(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _buildInfoCard(device),
                const SizedBox(height: 24),
                if (isCane) ...[
                  _buildCaneCapabilities(context, ref, device),
                ] else if (isGoggle) ...[
                  _buildGoggleCapabilities(context, ref, device),
                ] else ...[
                  const Center(child: Text('No specific capabilities for this device type.')),
                ]
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildInfoCard(BaseDevice device) {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('ID: ${device.id}', style: const TextStyle(color: Colors.grey)),
            const SizedBox(height: 8),
            Row(
              children: [
                const Text('State: '),
                Chip(
                  label: Text(device.state.name),
                  backgroundColor: device.state == HardwareConnectionState.ready ? Colors.green.withValues(alpha: 0.2) : Colors.orange.withValues(alpha: 0.2),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCaneCapabilities(BuildContext context, WidgetRef ref, BaseDevice device) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Cane Capabilities', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
        const SizedBox(height: 16),
        Card(
          child: ListTile(
            leading: const Icon(Icons.vibration),
            title: const Text('Trigger Haptic Feedback'),
            subtitle: const Text('Sends a vibration command'),
            trailing: ElevatedButton(
              onPressed: device.state == HardwareConnectionState.ready
                  ? () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Vibration command simulated.')),
                      );
                    }
                  : null,
              child: const Text('VIBRATE'),
            ),
          ),
        ),
        const SizedBox(height: 16),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Ultrasonic Sensor Feed', style: TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 24),
                Center(
                  child: Container(
                    height: 150,
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: Colors.black87,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Center(
                      child: Text(
                        'WAITING FOR TELEMETRY STREAM...',
                        style: TextStyle(color: Colors.greenAccent, fontFamily: 'monospace'),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildGoggleCapabilities(BuildContext context, WidgetRef ref, BaseDevice device) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Goggle Capabilities', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
        const SizedBox(height: 16),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Camera Feed', style: TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 24),
                Center(
                  child: Container(
                    height: 200,
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: Colors.black87,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.videocam_off, color: Colors.white54, size: 48),
                          SizedBox(height: 16),
                          Text(
                            'WAITING FOR MJPEG / FRAME STREAM...',
                            style: TextStyle(color: Colors.greenAccent, fontFamily: 'monospace'),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
