import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/hardware/domain/observability/hardware_log_event.dart';
import '../../../core/hardware/providers/hardware_providers.dart';

class DebugLogsTab extends ConsumerStatefulWidget {
  const DebugLogsTab({super.key});

  @override
  ConsumerState<DebugLogsTab> createState() => _DebugLogsTabState();
}

class _DebugLogsTabState extends ConsumerState<DebugLogsTab> {
  final List<HardwareLogEvent> _logs = [];

  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      ref.read(hardwareLoggerProvider).logStream.listen((event) {
        if (mounted) {
          setState(() {
            _logs.insert(0, event);
            if (_logs.length > 200) _logs.removeLast();
          });
        }
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.black87,
      child: _logs.isEmpty
          ? const Center(
              child: Text(
                'Waiting for hardware events...',
                style: TextStyle(color: Colors.grey, fontFamily: 'monospace'),
              ),
            )
          : ListView.builder(
              itemCount: _logs.length,
              itemBuilder: (context, index) {
                final log = _logs[index];
                return Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 4.0),
                  child: Text(
                    "[${log.timestamp.toLocal().toString().split('.').first}] [${log.type.name.toUpperCase()}] ${log.toString()}",
                    style: TextStyle(
                      color: _getColorForType(log.type),
                      fontFamily: 'monospace',
                      fontSize: 12,
                    ),
                  ),
                );
              },
            ),
    );
  }

  Color _getColorForType(LogType type) {
    switch (type) {
      case LogType.connect:
      case LogType.stateTransition:
        return Colors.greenAccent;
      case LogType.reconnectAttempt:
      case LogType.commandSent:
        return Colors.blueAccent;
      case LogType.disconnect:
        return Colors.orangeAccent;
      case LogType.error:
      case LogType.commandFailed:
        return Colors.redAccent;
    }
  }
}
