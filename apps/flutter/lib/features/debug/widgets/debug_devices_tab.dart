import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/hardware/domain/models/base_device.dart';
import '../../../core/hardware/providers/hardware_providers.dart';

class DebugDevicesTab extends ConsumerWidget {
  const DebugDevicesTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final devicesStream = ref.watch(deviceManagerProvider).devices;

    return StreamBuilder<List<BaseDevice>>(
      stream: devicesStream,
      initialData: const [],
      builder: (context, snapshot) {
        final devices = snapshot.data ?? [];
        if (devices.isEmpty) {
          return const Center(
            child: Text(
              "No devices connected\n\nHint: Use curl to mock a discovery ping on port 8080",
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey),
            ),
          );
        }
        
        return ListView.builder(
          itemCount: devices.length,
          itemBuilder: (context, index) {
            final device = devices[index];
            return Card(
              margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              elevation: 2,
              child: ListTile(
                leading: const Icon(Icons.hardware),
                title: Text(device.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                subtitle: Text("ID: ${device.id}\nState: ${device.state.name}"),
                trailing: IconButton(
                  icon: const Icon(Icons.close, color: Colors.red),
                  tooltip: 'Disconnect',
                  onPressed: () {
                    ref.read(deviceManagerProvider).disconnectDevice(device.id);
                  },
                ),
                onTap: () {
                  // Navigate to device details
                  context.push('/debug/device/${device.id}');
                },
              ),
            );
          },
        );
      },
    );
  }
}
