import 'package:flutter/foundation.dart';
import '../core/network/api_client.dart';

class NotificationProvider extends ChangeNotifier {
  int _unreadCount = 0;
  List<Map<String, dynamic>> _notifications = [];
  bool _isLoading = false;

  int get unreadCount => _unreadCount;
  List<Map<String, dynamic>> get notifications => _notifications;
  bool get isLoading => _isLoading;

  /// Fetch notifications from backend
  Future<void> fetchNotifications({int page = 1, int limit = 20}) async {
    try {
      _isLoading = true;
      notifyListeners();

      final apiClient = ApiClient.instance;
      final response = await apiClient.get('/notifications', queryParameters: {
        'page': page,
        'limit': limit,
      });

      final data = response.data as Map<String, dynamic>;
      _notifications = (data['data'] as List<dynamic>)
          .map((n) => n as Map<String, dynamic>)
          .toList();
      _unreadCount = data['unreadCount'] as int? ?? 0;

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      print('❌ Failed to fetch notifications: $e');
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Increment unread count when new notification arrives
  void incrementUnread() {
    _unreadCount++;
    notifyListeners();
  }

  /// Mark notification as read
  Future<void> markAsRead(String notificationId) async {
    try {
      final apiClient = ApiClient.instance;
      await apiClient.post('/notifications/$notificationId/read');

      // Update local state
      final index = _notifications.indexWhere((n) => n['id'] == notificationId);
      if (index != -1) {
        _notifications[index]['isRead'] = true;
        if (_unreadCount > 0) {
          _unreadCount--;
        }
        notifyListeners();
      }
    } catch (e) {
      print('❌ Failed to mark notification as read: $e');
    }
  }

  /// Mark all as read
  Future<void> markAllAsRead() async {
    try {
      final apiClient = ApiClient.instance;
      await apiClient.post('/notifications/read-all');

      // Update local state
      for (var notification in _notifications) {
        notification['isRead'] = true;
      }
      _unreadCount = 0;
      notifyListeners();
    } catch (e) {
      print('❌ Failed to mark all as read: $e');
    }
  }

  /// Handle new notification from WebSocket or Push
  void handleNewNotification(Map<String, dynamic> notification) {
    print('📬 Handling new notification in provider: ${notification['title']}');

    // Add to local list
    _notifications.insert(0, notification);

    // Increment unread count
    incrementUnread();

    print('🔔 Unread count updated: $_unreadCount');
  }

  /// Clear all data (on logout)
  void clear() {
    _notifications = [];
    _unreadCount = 0;
    notifyListeners();
  }
}
