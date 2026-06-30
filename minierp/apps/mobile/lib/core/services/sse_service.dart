import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../config/api_config.dart';

class SSEEvent {
  final String event;
  final Map<String, dynamic> data;

  SSEEvent({required this.event, required this.data});
}

class SSEService {
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  StreamController<SSEEvent>? _controller;
  bool _isConnected = false;
  bool _shouldReconnect = true;
  int _reconnectAttempts = 0;
  static const int _maxReconnectAttempts = 10;
  static const int _baseDelay = 1000;

  bool get isConnected => _isConnected;
  Stream<SSEEvent>? get eventStream => _controller?.stream;

  Future<void> connect() async {
    if (_isConnected) return;

    _shouldReconnect = true;
    _controller = StreamController<SSEEvent>.broadcast();

    try {
      final token = await _storage.read(key: 'access_token');
      if (token == null) {
        debugPrint('SSE: No access token found');
        return;
      }

      final uri = Uri.parse('${ApiConfig.baseUrl}/api/tramites/stream');
      final request = await HttpClient().getUrl(uri);
      request.headers.set('Authorization', 'Bearer $token');
      request.headers.set('Accept', 'text/event-stream');
      request.headers.set('Cache-Control', 'no-cache');

      final response = await request.close();
      _isConnected = true;
      _reconnectAttempts = 0;
      debugPrint('SSE: Connected');

      response
          .transform(utf8.decoder)
          .transform(const LineSplitter())
          .listen(
            (line) {
              if (line.startsWith('event: ')) {
                final eventType = line.substring(7).trim();
                _currentEventType = eventType;
              } else if (line.startsWith('data: ')) {
                final jsonData = line.substring(6).trim();
                try {
                  final data = json.decode(jsonData) as Map<String, dynamic>;
                  final event = SSEEvent(
                    event: _currentEventType ?? 'message',
                    data: data,
                  );
                  _controller?.add(event);
                } catch (e) {
                  debugPrint('SSE: Parse error: $e');
                }
              } else if (line.startsWith(':')) {
                // Comment line (heartbeat), ignore
              }
            },
            onError: (error) {
              debugPrint('SSE: Error: $error');
              _isConnected = false;
              _controller?.addError(error);
              _scheduleReconnect();
            },
            onDone: () {
              debugPrint('SSE: Connection closed');
              _isConnected = false;
              _scheduleReconnect();
            },
          );
    } catch (e) {
      debugPrint('SSE: Connection error: $e');
      _isConnected = false;
      _scheduleReconnect();
    }
  }

  String? _currentEventType;

  void _scheduleReconnect() {
    if (!_shouldReconnect || _reconnectAttempts >= _maxReconnectAttempts) {
      debugPrint('SSE: Max reconnect attempts reached');
      return;
    }

    final delay = _baseDelay * (1 << _reconnectAttempts);
    final cappedDelay = delay > 30000 ? 30000 : delay;
    debugPrint(
      'SSE: Reconnecting in ${cappedDelay}ms (attempt ${_reconnectAttempts + 1})',
    );

    Future.delayed(Duration(milliseconds: cappedDelay), () {
      _reconnectAttempts++;
      connect();
    });
  }

  void disconnect() {
    _shouldReconnect = false;
    _isConnected = false;
    _controller?.close();
    _controller = null;
    debugPrint('SSE: Disconnected');
  }

  void dispose() {
    disconnect();
  }
}
