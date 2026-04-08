import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../services/auth_token_service.dart';
import '../../config/api_config.dart';

class ChatSocketService {
  static final ChatSocketService instance = ChatSocketService._internal();
  factory ChatSocketService() => instance;
  ChatSocketService._internal();

  IO.Socket? _socket;
  bool _isConnected = false;

  bool get isConnected => _isConnected;
  IO.Socket? get socket => _socket;

  void reconnect() {
    print('🔄 Reconnecting socket with fresh token...');
    disconnect();
    connect();
  }

  void connect() {
    // Always disconnect first to ensure fresh connection
    if (_socket != null) {
      print('🔌 Disconnecting old socket before connecting...');
      _socket!.disconnect();
      _socket!.dispose();
      _socket = null;
    }

    final token = AuthTokenService.instance.accessToken;
    if (token == null) {
      print('❌ No access token, cannot connect to socket');
      return;
    }

    print('🔌 Connecting to Socket.IO: ${ApiConfig.baseUrl}/chat');
    print('🔑 Using token: ${token.substring(0, 20)}...');
    print('🔑 Token length: ${token.length}');

    _socket = IO.io(
      '${ApiConfig.baseUrl}/chat',
      IO.OptionBuilder()
          .setTransports(['websocket'])
          .setAuth({'token': token})
          .enableAutoConnect()
          .enableReconnection()
          .setReconnectionAttempts(5)
          .setReconnectionDelay(1000)
          .build(),
    );

    _socket!.onConnect((_) {
      print('✅ Socket connected: ${_socket!.id}');
      _isConnected = true;
    });

    _socket!.onDisconnect((_) {
      print('❌ Socket disconnected');
      _isConnected = false;
    });

    _socket!.onConnectError((error) {
      print('❌ Socket connection error: $error');
      _isConnected = false;
    });

    _socket!.onError((error) {
      print('❌ Socket error: $error');
    });

    _socket!.on('joined', (data) {
      print('✅ Joined conversation: ${data['conversationId']}');
    });

    _socket!.on('left', (data) {
      print('✅ Left conversation: ${data['conversationId']}');
    });

    _socket!.connect();
  }

  void disconnect() {
    if (_socket != null) {
      print('🔌 Disconnecting socket...');
      _socket!.disconnect();
      _socket!.dispose();
      _socket = null;
      _isConnected = false;
    }
  }

  void joinConversation(String conversationId) {
    if (_socket == null || !_socket!.connected) {
      print('❌ Socket not connected, cannot join conversation');
      return;
    }

    print('📥 Joining conversation: $conversationId');
    _socket!.emit('join', {'conversationId': conversationId});
  }

  void leaveConversation(String conversationId) {
    if (_socket == null || !_socket!.connected) {
      return;
    }

    print('📤 Leaving conversation: $conversationId');
    _socket!.emit('leave', {'conversationId': conversationId});
  }

  void sendMessage(String conversationId, String content) {
    if (_socket == null || !_socket!.connected) {
      print('❌ Socket not connected, cannot send message');
      return;
    }

    print('💬 Sending message via socket: $content');
    _socket!.emit('message', {
      'conversationId': conversationId,
      'content': content,
    });
  }

  void onMessageChunk(Function(Map<String, dynamic>) callback) {
    _socket?.on('message:chunk', (data) {
      print('📨 Received message chunk: ${data['type']}');
      callback(data as Map<String, dynamic>);
    });
  }

  void onMessageComplete(Function(Map<String, dynamic>) callback) {
    _socket?.on('message:complete', (data) {
      print('✅ Message complete');
      callback(data as Map<String, dynamic>);
    });
  }

  void onError(Function(Map<String, dynamic>) callback) {
    _socket?.on('error', (data) {
      print('❌ Socket error event: $data');
      callback(data as Map<String, dynamic>);
    });
  }

  void removeAllListeners() {
    _socket?.off('message:chunk');
    _socket?.off('message:complete');
    _socket?.off('error');
  }
}
