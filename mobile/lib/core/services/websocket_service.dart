import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'auth_token_service.dart';

// Global callback for notification handler
Function(Map<String, dynamic>)? _notificationCallback;

class WebSocketService {
  static WebSocketService? _instance;
  static WebSocketService get instance => _instance ??= WebSocketService._();

  WebSocketService._();

  IO.Socket? _socket;
  bool _isConnected = false;

  bool get isConnected => _isConnected;

  /// Set callback for notification handling
  static void setNotificationCallback(Function(Map<String, dynamic>) callback) {
    _notificationCallback = callback;
  }

  /// Initialize WebSocket connection
  Future<void> connect() async {
    if (_socket != null && _isConnected) {
      print('⚠️ WebSocket already connected');
      return;
    }

    try {
      final apiUrl = dotenv.env['API_URL'] ?? 'http://localhost:3010/api/v1';
      // Remove /api/v1 from URL and add /app namespace
      final wsUrl = apiUrl.replaceAll('/api/v1', '');

      final accessToken = AuthTokenService.instance.accessToken;

      if (accessToken == null) {
        print('⚠️ No access token, skipping WebSocket connection');
        return;
      }

      print('🔌 Connecting to WebSocket: $wsUrl/app');

      _socket = IO.io(
        '$wsUrl/app',
        IO.OptionBuilder()
            .setTransports(['websocket'])
            .enableAutoConnect()
            .enableReconnection()
            .setReconnectionDelay(1000)
            .setReconnectionDelayMax(5000)
            .setReconnectionAttempts(5)
            .setAuth({
              'token': 'Bearer $accessToken',
            })
            .build(),
      );

      _socket!.onConnect((_) {
        _isConnected = true;
        print('✅ WebSocket connected');
      });

      _socket!.onDisconnect((_) {
        _isConnected = false;
        print('❌ WebSocket disconnected');
      });

      _socket!.onError((error) {
        print('❌ WebSocket error: $error');
      });

      _socket!.on('notification', (data) {
        print('📬 WebSocket notification received: $data');
        _handleNotification(data);
      });

      _socket!.connect();
    } catch (e) {
      print('❌ Failed to connect WebSocket: $e');
    }
  }

  /// Disconnect WebSocket
  void disconnect() {
    if (_socket != null) {
      _socket!.disconnect();
      _socket!.dispose();
      _socket = null;
      _isConnected = false;
      print('🔌 WebSocket disconnected');
    }
  }

  /// Handle incoming notification
  void _handleNotification(dynamic data) {
    try {
      print('📬 New notification:');
      print('  Title: ${data['title']}');
      print('  Message: ${data['message']}');
      print('  Type: ${data['type']}');

      // Call the notification callback to update UI
      if (_notificationCallback != null) {
        _notificationCallback!(data as Map<String, dynamic>);
      }
    } catch (e) {
      print('❌ Error handling notification: $e');
    }
  }

  /// Subscribe to a channel
  void subscribe(String channel) {
    if (_socket == null || !_isConnected) {
      print('⚠️ WebSocket not connected, cannot subscribe to $channel');
      return;
    }

    _socket!.emit('subscribe', {'channel': channel});
    print('📡 Subscribed to channel: $channel');
  }

  /// Unsubscribe from a channel
  void unsubscribe(String channel) {
    if (_socket == null || !_isConnected) return;

    _socket!.emit('unsubscribe', {'channel': channel});
    print('📡 Unsubscribed from channel: $channel');
  }

  /// Send a ping to check connection
  void ping() {
    if (_socket == null || !_isConnected) return;

    _socket!.emit('ping');
    print('🏓 Ping sent');
  }
}
