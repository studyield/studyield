import 'package:dio/dio.dart';
import '../constants/api_constants.dart';
import '../services/auth_token_service.dart';

/// API Interceptor for handling authentication tokens
/// and automatic token refresh

class ApiInterceptor extends Interceptor {
  final Dio dio;
  final AuthTokenService _tokenService = AuthTokenService.instance;

  // Prevent multiple simultaneous refresh attempts
  Future<String?>? _refreshFuture;

  ApiInterceptor({required this.dio});

  @override
  void onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) {
    // Add access token to request headers (from in-memory cache - fast!)
    final accessToken = _tokenService.accessToken;

    if (accessToken != null) {
      options.headers[ApiConstants.authorization] =
          '${ApiConstants.bearer} $accessToken';
      print('✅ Request to ${options.path} with token');
    } else {
      print('⚠️ Request to ${options.path} without token');
    }

    handler.next(options);
  }

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    print('🔴 ERROR INTERCEPTOR TRIGGERED!');
    print('   Status: ${err.response?.statusCode}');
    print('   Path: ${err.requestOptions.path}');
    print('   Response Body: ${err.response?.data}');
    print('   Message: ${err.message}');

    // Handle 401 Unauthorized - Refresh token
    if (err.response?.statusCode == 401) {
      print('🔑 Received 401 error for path: ${err.requestOptions.path}');

      // Check if this is not the refresh token request
      if (!err.requestOptions.path.contains('/auth/refresh')) {
        print('🔄 Not a refresh request, attempting to refresh token...');

        try {
          // Use existing refresh future if one is in progress
          _refreshFuture ??= _refreshToken();
          final newAccessToken = await _refreshFuture;
          _refreshFuture = null; // Reset for next time

          if (newAccessToken != null) {
            print('✅ Token refreshed successfully, retrying original request');
            // Update request options with new token
            err.requestOptions.headers[ApiConstants.authorization] =
                '${ApiConstants.bearer} $newAccessToken';

            // Retry original request
            try {
              final response = await dio.fetch(err.requestOptions);
              print('✅ Retry successful!');
              return handler.resolve(response);
            } catch (retryError) {
              print('❌ Retry failed after token refresh: $retryError');
              return handler.reject(err);
            }
          } else {
            print('❌ Token refresh returned null, clearing session');
            await _logout();
          }
        } catch (e) {
          print('❌ Token refresh exception: $e');
          // Refresh failed, logout user
          _refreshFuture = null;
          await _logout();
        }
      } else {
        print('❌ Refresh token request itself failed with 401, clearing session');
        await _logout();
      }
    }

    handler.reject(err);
  }

  /// Refresh access token using refresh token
  Future<String?> _refreshToken() async {
    try {
      final refreshToken = _tokenService.refreshToken;

      if (refreshToken == null) {
        print('❌ Token refresh failed: No refresh token available');
        return null;
      }

      print('🔄 Attempting token refresh...');

      // Create a new Dio instance without interceptors to avoid infinite loop
      final tempDio = Dio(BaseOptions(
        baseUrl: dio.options.baseUrl,
        headers: {
          'Content-Type': 'application/json',
        },
      ));

      final response = await tempDio.post(
        ApiConstants.refreshToken,
        data: {'refreshToken': refreshToken},
      );

      if (response.statusCode == 200) {
        final newAccessToken = response.data['accessToken'];
        final newRefreshToken = response.data['refreshToken'];

        // Store new tokens in service (updates both memory and storage)
        await _tokenService.setTokens(newAccessToken, newRefreshToken);

        print('✅ Token refresh successful');
        return newAccessToken;
      }

      print('❌ Token refresh failed: Invalid response status ${response.statusCode}');
      return null;
    } catch (e) {
      print('❌ Token refresh failed: $e');
      return null;
    }
  }

  /// Logout user and clear tokens
  Future<void> _logout() async {
    await _tokenService.clearTokens();
    print('🚪 Session expired. Tokens cleared. Please login again.');
  }
}
