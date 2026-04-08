import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import '../network/api_client.dart';
import 'auth_token_service.dart';

// Global callback for notification handler
Function(Map<String, dynamic>)? _notificationCallback;

class FirebaseMessagingService {
  static final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  static String? _fcmToken;

  static String? get fcmToken => _fcmToken;

  /// Set callback for notification handling
  static void setNotificationCallback(Function(Map<String, dynamic>) callback) {
    _notificationCallback = callback;
  }

  /// Initialize Firebase Messaging
  static Future<void> initialize() async {
    try {
      // Request permission for notifications
      final settings = await _messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
        provisional: false,
      );

      if (settings.authorizationStatus == AuthorizationStatus.authorized) {
        print('✅ User granted notification permission');

        // Get FCM token
        _fcmToken = await _messaging.getToken();
        print('🔑 FCM Token: $_fcmToken');

        // Send token to backend
        if (_fcmToken != null) {
          await _sendTokenToBackend(_fcmToken!);
        }

        // Listen for token refresh
        _messaging.onTokenRefresh.listen((newToken) {
          print('🔄 FCM Token refreshed: $newToken');
          _fcmToken = newToken;
          _sendTokenToBackend(newToken);
        });

        // Handle foreground messages
        FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

        // Handle notification taps when app is in background/terminated
        FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);

        // Check if app was opened from a notification
        final initialMessage = await _messaging.getInitialMessage();
        if (initialMessage != null) {
          _handleNotificationTap(initialMessage);
        }

      } else if (settings.authorizationStatus == AuthorizationStatus.provisional) {
        print('⚠️ User granted provisional permission');
      } else {
        print('❌ User denied notification permission');
      }
    } catch (e) {
      print('❌ Error initializing Firebase Messaging: $e');
    }
  }

  /// Send FCM token to backend
  static Future<void> _sendTokenToBackend(String token) async {
    try {
      // Only send if user is authenticated
      if (!AuthTokenService.instance.hasTokens) {
        print('⏭️ Skipping FCM token upload - user not authenticated');
        return;
      }

      final apiClient = ApiClient.instance;
      await apiClient.post('/notifications/register-device', data: {
        'fcmToken': token,
        'platform': defaultTargetPlatform.name,
      });
      print('✅ FCM token sent to backend');
    } catch (e) {
      print('❌ Error sending FCM token to backend: $e');
    }
  }

  /// Handle foreground messages (when app is open)
  static void _handleForegroundMessage(RemoteMessage message) {
    print('📬 Foreground message received:');
    print('  Title: ${message.notification?.title}');
    print('  Body: ${message.notification?.body}');
    print('  Data: ${message.data}');

    // Call the notification callback to update UI
    if (_notificationCallback != null && message.notification != null) {
      _notificationCallback!({
        'title': message.notification!.title ?? '',
        'message': message.notification!.body ?? '',
        'type': message.data['type'] ?? 'info',
        'id': message.data['notificationId'] ?? '',
        'data': message.data,
      });
    }
  }

  /// Handle notification tap (when user taps notification)
  static void _handleNotificationTap(RemoteMessage message) {
    print('👆 Notification tapped:');
    print('  Title: ${message.notification?.title}');
    print('  Data: ${message.data}');

    // Navigate to appropriate screen based on message.data
    // Example: if (message.data['type'] == 'achievement') { navigate to achievements }
  }

  /// Manually refresh and send token (call after login)
  static Future<void> refreshToken() async {
    try {
      _fcmToken = await _messaging.getToken();
      if (_fcmToken != null) {
        await _sendTokenToBackend(_fcmToken!);
      }
    } catch (e) {
      print('❌ Error refreshing FCM token: $e');
    }
  }

  /// Delete token (call on logout)
  static Future<void> deleteToken() async {
    try {
      await _messaging.deleteToken();
      _fcmToken = null;
      print('✅ FCM token deleted');
    } catch (e) {
      print('❌ Error deleting FCM token: $e');
    }
  }
}
