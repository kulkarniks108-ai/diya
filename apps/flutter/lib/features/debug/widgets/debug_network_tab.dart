import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:network_info_plus/network_info_plus.dart';
import 'package:dio/dio.dart';

import '../../../core/config/app_config.dart';

class DebugNetworkTab extends ConsumerStatefulWidget {
  const DebugNetworkTab({super.key});

  @override
  ConsumerState<DebugNetworkTab> createState() => _DebugNetworkTabState();
}

class _DebugNetworkTabState extends ConsumerState<DebugNetworkTab> {
  final NetworkInfo _networkInfo = NetworkInfo();
  String _wifiIP = 'Loading...';
  String _pingResult = '';
  Color _pingColor = Colors.grey;
  bool _isPinging = false;

  @override
  void initState() {
    super.initState();
    _fetchIP();
  }

  Future<void> _fetchIP() async {
    try {
      final ip = await _networkInfo.getWifiIP();
      setState(() {
        _wifiIP = ip ?? 'Unknown (Check WiFi/Location permissions)';
      });
    } catch (e) {
      setState(() {
        _wifiIP = 'Error retrieving IP';
      });
    }
  }

  Future<void> _pingBackend() async {
    setState(() {
      _isPinging = true;
      _pingResult = 'Pinging...';
      _pingColor = Colors.orange;
    });

    try {
      final dio = Dio(BaseOptions(connectTimeout: const Duration(seconds: 5)));
      // AppConfig.apiBaseUrl is typically "http://IP:8000/api/v1"
      // The health endpoint is usually at "http://IP:8000/health" or similar.
      // We will parse the baseUrl to hit the root health endpoint.
      final uri = Uri.parse(AppConfig.apiBaseUrl);
      final healthUrl = '${uri.scheme}://${uri.host}:${uri.port}/health';
      
      final startTime = DateTime.now();
      final response = await dio.get(healthUrl);
      final duration = DateTime.now().difference(startTime).inMilliseconds;

      if (response.statusCode == 200) {
        setState(() {
          _pingResult = 'SUCCESS (${duration}ms)\nResponse: ${response.data}';
          _pingColor = Colors.green;
        });
      } else {
        setState(() {
          _pingResult = 'FAILED: Status ${response.statusCode}';
          _pingColor = Colors.red;
        });
      }
    } catch (e) {
      setState(() {
        _pingResult = 'FAILED to connect:\n${e.toString()}';
        _pingColor = Colors.red;
      });
    } finally {
      setState(() {
        _isPinging = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            'Network Diagnostics',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          _buildInfoCard(
            title: 'Phone Local IP (WiFi)',
            value: _wifiIP,
            icon: Icons.wifi,
            actionIcon: Icons.refresh,
            onAction: _fetchIP,
          ),
          const SizedBox(height: 16),
          _buildInfoCard(
            title: 'Configured API Domain',
            value: AppConfig.apiBaseUrl,
            icon: Icons.dns,
          ),
          const SizedBox(height: 32),
          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            onPressed: _isPinging ? null : _pingBackend,
            icon: _isPinging 
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                : const Icon(Icons.network_ping),
            label: const Text('PING BACKEND', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          ),
          const SizedBox(height: 24),
          if (_pingResult.isNotEmpty)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.black87,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: _pingColor, width: 2),
              ),
              child: Text(
                _pingResult,
                style: TextStyle(color: _pingColor, fontFamily: 'monospace'),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildInfoCard({
    required String title,
    required String value,
    required IconData icon,
    IconData? actionIcon,
    VoidCallback? onAction,
  }) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Row(
          children: [
            Icon(icon, size: 32, color: Theme.of(context).colorScheme.primary),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.grey)),
                  const SizedBox(height: 4),
                  Text(value, style: const TextStyle(fontSize: 16, fontFamily: 'monospace')),
                ],
              ),
            ),
            if (actionIcon != null && onAction != null)
              IconButton(
                icon: Icon(actionIcon),
                onPressed: onAction,
              ),
          ],
        ),
      ),
    );
  }
}
