import 'package:flutter/material.dart';
import 'package:diya_flutter/features/debug/widgets/debug_devices_tab.dart';
import 'package:diya_flutter/features/debug/widgets/debug_logs_tab.dart';
import 'package:diya_flutter/features/debug/widgets/debug_sos_tab.dart';
import 'package:diya_flutter/features/debug/widgets/debug_network_tab.dart';

class DebugDashboardScreen extends StatefulWidget {
  const DebugDashboardScreen({super.key});

  @override
  State<DebugDashboardScreen> createState() => _DebugDashboardScreenState();
}

class _DebugDashboardScreenState extends State<DebugDashboardScreen> {
  int _currentIndex = 0;

  final List<Widget> _tabs = [
    const DebugDevicesTab(),
    const DebugNetworkTab(),
    const DebugLogsTab(),
    const DebugSosTab(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Hardware Control Center'),
      ),
      body: _tabs[_currentIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        type: BottomNavigationBarType.fixed,
        onTap: (index) => setState(() => _currentIndex = index),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.devices), label: 'Devices'),
          BottomNavigationBarItem(icon: Icon(Icons.network_wifi), label: 'Network'),
          BottomNavigationBarItem(icon: Icon(Icons.list_alt), label: 'Logs'),
          BottomNavigationBarItem(icon: Icon(Icons.warning), label: 'SOS Control'),
        ],
      ),
    );
  }
}
