import 'package:flutter/material.dart';

class DebugDashboardScreen extends StatefulWidget {
  const DebugDashboardScreen({super.key});

  @override
  State<DebugDashboardScreen> createState() => _DebugDashboardScreenState();
}

class _DebugDashboardScreenState extends State<DebugDashboardScreen> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Debug Dashboard'),
      ),
      body: Center(
        child: Text('Debug Tab $_currentIndex'),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.devices), label: 'Devices'),
          BottomNavigationBarItem(icon: Icon(Icons.list_alt), label: 'Logs'),
          BottomNavigationBarItem(icon: Icon(Icons.warning), label: 'SOS Control'),
        ],
      ),
    );
  }
}
