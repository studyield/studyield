import 'package:flutter/foundation.dart';
import '../config/api_config.dart';
import '../core/network/api_client.dart';
import '../core/services/auth_token_service.dart';
import '../core/services/firebase_messaging_service.dart';
import '../core/services/websocket_service.dart';
import '../models/user.dart';

enum AuthStatus { initial, authenticated, unauthenticated, loading }

class AuthProvider extends ChangeNotifier {
  final ApiClient _apiClient = ApiClient.instance;

  AuthStatus _status = AuthStatus.initial;
  User? _user;
  String? _error;

  AuthStatus get status => _status;
  User? get user => _user;
  String? get error => _error;
  bool get isAuthenticated => _status == AuthStatus.authenticated;
  bool get isLoading => _status == AuthStatus.loading;

  Future<void> init() async {
    try {
      _status = AuthStatus.loading;
      notifyListeners();

      // Check if we have stored tokens in AuthTokenService
      final hasTokens = AuthTokenService.instance.hasTokens;
      print('🔐 AuthProvider init - Has tokens: $hasTokens');

      if (hasTokens) {
        // Try to fetch user profile to verify token is valid
        print('✅ Tokens found, fetching user profile...');
        await fetchUser();
      } else {
        // No tokens, user needs to login
        print('⚠️ No tokens found, showing login');
        _status = AuthStatus.unauthenticated;
        notifyListeners();
      }
    } catch (e) {
      // Error checking auth, assume unauthenticated
      print('❌ Auth init error: $e');
      _status = AuthStatus.unauthenticated;
      notifyListeners();
    }
  }

  // Mock login for development
  void _mockLogin() {
    _user = User(
      id: 'dev-user-123',
      email: 'developer@studyield.com',
      name: 'Developer',
      avatarUrl: null,
      plan: 'free',
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );
    _status = AuthStatus.authenticated;
    notifyListeners();
  }

  Future<void> fetchUser() async {
    try {
      _status = AuthStatus.loading;
      notifyListeners();

      print('📡 Fetching user profile from /users/me...');
      final response = await _apiClient.get('/users/me');
      print('✅ User profile response received');
      print('Response data: ${response.data}');

      // Parse user with subscription data from /users/me endpoint
      final userData = Map<String, dynamic>.from(response.data);
      _user = User.fromJson(userData);

      print('✅ User parsed: ${_user?.email}');
      if (_user?.subscription != null) {
        print('✅ Subscription loaded: ${_user?.subscription?.planDisplayName} (${_user?.subscription?.statusDisplayName})');
      } else {
        print('⚠️ No subscription data in response');
      }

      _status = AuthStatus.authenticated;
      _error = null;
      print('✅ Status set to AUTHENTICATED');
      print('🏠 isAuthenticated: $isAuthenticated');

      // Send FCM token to backend after successful authentication
      await FirebaseMessagingService.refreshToken();

      // Connect to WebSocket for real-time notifications
      await WebSocketService.instance.connect();
    } catch (e) {
      print('❌ fetchUser failed: $e');
      print('Stack trace: ${StackTrace.current}');
      _status = AuthStatus.unauthenticated;
      _user = null;
      await AuthTokenService.instance.clearTokens();
    }
    print('📢 Notifying listeners with status: $_status');
    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    try {
      _status = AuthStatus.loading;
      _error = null;
      notifyListeners();

      final response = await _apiClient.post(
        '/auth/login',
        data: {'email': email, 'password': password},
      );

      print('📥 Login response: ${response.data}');

      final tokens = response.data['tokens'];
      await AuthTokenService.instance.setTokens(
        tokens['accessToken'],
        tokens['refreshToken'],
      );

      // Parse user with subscription data
      final userData = Map<String, dynamic>.from(response.data['user']);
      if (response.data['subscription'] != null) {
        userData['subscription'] = response.data['subscription'];
      }

      _user = User.fromJson(userData);
      print('✅ User logged in: ${_user?.email}, Plan: ${_user?.subscription?.planDisplayName}');

      _status = AuthStatus.authenticated;
      notifyListeners();

      // Send FCM token to backend after successful login
      await FirebaseMessagingService.refreshToken();

      // Connect to WebSocket for real-time notifications
      await WebSocketService.instance.connect();

      return true;
    } catch (e) {
      print('❌ Login failed: $e');
      _status = AuthStatus.unauthenticated;
      _error = _extractError(e);
      notifyListeners();
      return false;
    }
  }

  Future<bool> register(String name, String email, String password) async {
    try {
      _status = AuthStatus.loading;
      _error = null;
      notifyListeners();

      final response = await _apiClient.post(
        '/auth/register',
        data: {'name': name, 'email': email, 'password': password},
      );

      print('📥 Register response: ${response.data}');

      final tokens = response.data['tokens'];
      await AuthTokenService.instance.setTokens(
        tokens['accessToken'],
        tokens['refreshToken'],
      );

      // Parse user with subscription data
      final userData = Map<String, dynamic>.from(response.data['user']);
      if (response.data['subscription'] != null) {
        userData['subscription'] = response.data['subscription'];
      }

      _user = User.fromJson(userData);
      print('✅ User registered: ${_user?.email}, Plan: ${_user?.subscription?.planDisplayName}');

      _status = AuthStatus.authenticated;
      notifyListeners();

      // Send FCM token to backend after successful registration
      await FirebaseMessagingService.refreshToken();

      // Connect to WebSocket for real-time notifications
      await WebSocketService.instance.connect();

      return true;
    } catch (e) {
      print('❌ Register failed: $e');
      _status = AuthStatus.unauthenticated;
      _error = _extractError(e);
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    try {
      final refreshToken = AuthTokenService.instance.refreshToken;
      if (refreshToken != null) {
        await _apiClient.post(
          '/auth/logout',
          data: {'refreshToken': refreshToken},
        );
      }
    } catch (e) {
      print('Logout API error: $e');
      // Continue with local logout even if API fails
    } finally {
      // Delete FCM token on logout
      await FirebaseMessagingService.deleteToken();

      // Disconnect WebSocket
      WebSocketService.instance.disconnect();

      await AuthTokenService.instance.clearTokens();
      _user = null;
      _status = AuthStatus.unauthenticated;
      notifyListeners();
    }
  }

  String _extractError(dynamic e) {
    if (e is Exception) {
      return e.toString().replaceFirst('Exception: ', '');
    }
    return 'An unexpected error occurred';
  }
}
