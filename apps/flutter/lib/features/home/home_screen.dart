import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/hardware/domain/models/base_device.dart';
import '../../core/hardware/domain/models/known_device.dart';
import '../../core/hardware/domain/observability/hardware_log_event.dart';
import '../../core/hardware/providers/hardware_providers.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  final List<HardwareLogEvent> _logs = [];

  @override
  void initState() {
    super.initState();
    // Start scanning / initializing background loop
    Future.microtask(() {
      ref.read(deviceManagerProvider).startScan();
      
      // Listen to logs
      ref.read(hardwareLoggerProvider).logStream.listen((event) {
        if (mounted) {
          setState(() {
            _logs.insert(0, event);
            if (_logs.length > 50) _logs.removeLast();
          });
        }
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    final devicesStream = ref.watch(deviceManagerProvider).devices;

    return Scaffold(
      appBar: AppBar(
        title: const Text("2ndEye Hardware Debug"),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            tooltip: "Mock Device",
            onPressed: () async {
              // 1. Save fake device to registry
              final mockDevice = KnownDevice(
                deviceId: "mock-goggle-${DateTime.now().second}",
                deviceType: DeviceType.goggle,
                lastSeenTimestamp: DateTime.now(),
              );
              await ref.read(deviceRegistryProvider).saveKnownDevice(mockDevice);
              
              // 2. Ask manager to start scanning (will pick up from registry)
              ref.read(deviceManagerProvider).startScan();
            },
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            flex: 1,
            child: StreamBuilder<List<BaseDevice>>(
              stream: devicesStream,
              initialData: const [],
              builder: (context, snapshot) {
                final devices = snapshot.data ?? [];
                if (devices.isEmpty) {
                  return const Center(child: Text("No devices connected"));
                }
                return ListView.builder(
                  itemCount: devices.length,
                  itemBuilder: (context, index) {
                    final device = devices[index];
                    return ListTile(
                      leading: const Icon(Icons.devices),
                      title: Text(device.name),
                      subtitle: Text("ID: ${device.id}\nState: ${device.state.name}"),
                      trailing: IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () {
                          ref.read(deviceManagerProvider).disconnectDevice(device.id);
                        },
                      ),
                    );
                  },
                );
              },
            ),
          ),
          const Divider(),
          const Padding(
            padding: EdgeInsets.all(8.0),
            child: Text("Hardware Logs", style: TextStyle(fontWeight: FontWeight.bold)),
          ),
          Expanded(
            flex: 2,
            child: Container(
              color: Colors.black87,
              child: ListView.builder(
                itemCount: _logs.length,
                itemBuilder: (context, index) {
                  final log = _logs[index];
                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 2.0),
                    child: Text(
                      "[${log.timestamp.toLocal().toString().split('.').first}] ${log.toString()}",
                      style: const TextStyle(color: Colors.greenAccent, fontFamily: 'monospace', fontSize: 12),
                    ),
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }
}