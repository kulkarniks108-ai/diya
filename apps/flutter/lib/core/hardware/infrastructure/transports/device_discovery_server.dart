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
      } else if (request.uri.path == '/' && request.method == 'GET') {
        _serveHomePage(request);
      } else {
        request.response.statusCode = HttpStatus.notFound;
        await request.response.close();
      }
    });
  }

  void _serveHomePage(HttpRequest request) async {
    request.response.statusCode = HttpStatus.ok;
    request.response.headers.contentType = ContentType.html;
    request.response.write('''
      <!DOCTYPE html>
      <html>
      <head>
        <title>2ndEye Device Server</title>
        <style>
          body { font-family: -apple-system, sans-serif; padding: 40px; background: #121212; color: #fff; }
          .container { max-width: 600px; margin: 0 auto; background: #1e1e1e; padding: 24px; border-radius: 12px; }
          h1 { color: #00d2ff; }
          .status { display: inline-block; padding: 8px 12px; background: #004d40; color: #1de9b6; border-radius: 6px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>2ndEye Hotspot Server</h1>
          <p>This is the local discovery server running on the user's phone.</p>
          <div class="status">● Server is Active & Listening</div>
          <p style="margin-top: 24px; color: #888;">Hardware devices (like Smart Goggles) connect here via POST /register</p>
        </div>
      </body>
      </html>
    ''');
    await request.response.close();
  }

  Future<void> stop() async {
    await _server?.close(force: true);
    _server = null;
  }
}
