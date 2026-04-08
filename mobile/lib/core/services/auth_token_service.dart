import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Singleton service for managing auth tokens with in-memory caching
/// Uses SharedPreferences on web, FlutterSecureStorage on mobile
class AuthTokenService {
  static AuthTokenService? _instance;
  static AuthTokenService get instance {
    _instance ??= AuthTokenService._();
    return _instance!;
  }

  AuthTokenService._();

  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage();

  // In-memory cache for fast access
  String? _accessToken;
  String? _refreshToken;
  bool _isInitialized = false;

  /// Initialize by loading tokens from storage
  Future<void> initialize() async {
    if (_isInitialized) return;

    if (kIsWeb) {
      final prefs = await SharedPreferences.getInstance();
      _accessToken = prefs.getString('access_token');
      _refreshToken = prefs.getString('refresh_token');
    } else {
      _accessToken = await _secureStorage.read(key: 'access_token');
      _refreshToken = await _secureStorage.read(key: 'refresh_token');
    }
    _isInitialized = true;
  }

  /// Get access token (from memory - fast!)
  String? get accessToken => _accessToken;

  /// Get refresh token (from memory - fast!)
  String? get refreshToken => _refreshToken;

  /// Check if tokens exist
  bool get hasTokens => _accessToken != null && _refreshToken != null;

  /// Set both tokens (updates memory AND storage)
  Future<void> setTokens(String accessToken, String refreshToken) async {
    _accessToken = accessToken;
    _refreshToken = refreshToken;

    if (kIsWeb) {
      final prefs = await SharedPreferences.getInstance();
      await Future.wait([
        prefs.setString('access_token', accessToken),
        prefs.setString('refresh_token', refreshToken),
      ]);
    } else {
      await Future.wait([
        _secureStorage.write(key: 'access_token', value: accessToken),
        _secureStorage.write(key: 'refresh_token', value: refreshToken),
      ]);
    }
  }

  /// Update only access token (after refresh)
  Future<void> setAccessToken(String accessToken) async {
    _accessToken = accessToken;

    if (kIsWeb) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('access_token', accessToken);
    } else {
      await _secureStorage.write(key: 'access_token', value: accessToken);
    }
  }

  /// Clear all tokens (memory AND storage)
  Future<void> clearTokens() async {
    _accessToken = null;
    _refreshToken = null;

    if (kIsWeb) {
      final prefs = await SharedPreferences.getInstance();
      await Future.wait([
        prefs.remove('access_token'),
        prefs.remove('refresh_token'),
      ]);
    } else {
      await Future.wait([
        _secureStorage.delete(key: 'access_token'),
        _secureStorage.delete(key: 'refresh_token'),
      ]);
    }
  }

  /// Check token status (no logging for security)
  Map<String, bool> get tokenStatus => {
    'initialized': _isInitialized,
    'hasAccessToken': _accessToken != null,
    'hasRefreshToken': _refreshToken != null,
  };
}
