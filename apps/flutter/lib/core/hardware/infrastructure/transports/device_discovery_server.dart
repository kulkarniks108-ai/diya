import 'dart:async';
import 'dart:convert';
import 'dart:io';

/// Hosts a lightweight server on the phone's hotspot interface.
/// Goggles and other Wi-Fi devices send POST /register to this server
/// when they connect to the phone's hotspot.
class DeviceDiscoveryServer {
  HttpServer? _server;
  final _registrationController = StreamController<Map<String, dynamic>>.broadcast();

  Stream<Map<String, dynamic>> get onDeviceRegistered => _registrationController.stream;

  Future<void> start({int port = 8080}) async {
    if (_server != null) return;
    
    // Bind to all interfaces so hotspot clients can reach it
    _server = await HttpServer.bind(InternetAddress.anyIPv4, port);
    
    _server!.listen((HttpRequest request) async {
      if (request.uri.path == '/register' && request.method == 'POST') {
        final content = await utf8.decoder.bind(request).join();
        try {
          final data = jsonDecode(content) as Map<String, dynamic>;
          
          // Inject the source IP so the DeviceManager knows where to send HTTP commands
          data['source_ip'] = request.connectionInfo?.remoteAddress.address;
          _registrationController.add(data);
          
          request.response.statusCode = HttpStatus.ok;
          request.response.headers.contentType = ContentType.json;
          request.response.write('{"status":"registered"}');
        } catch (e) {
          request.response.statusCode = HttpStatus.badRequest;
        } finally {
          await request.response.close();
        }
      } else {
        request.response.statusCode = HttpStatus.notFound;
        await request.response.close();
      }
    });
  }

  Future<void> stop() async {
    await _server?.close(force: true);
    _server = null;
  }
}
