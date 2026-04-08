import '../../../../core/network/api_client.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../../core/services/auth_token_service.dart';
import '../models/login_request.dart';
import '../models/register_request.dart';
import '../models/auth_response.dart';

abstract class AuthRemoteDataSource {
  Future<AuthResponse> login(LoginRequest request);
  Future<AuthResponse> register(RegisterRequest request);
  Future<void> logout();
  Future<void> saveTokens(String accessToken, String refreshToken);
  Future<void> clearTokens();
}

class AuthRemoteDataSourceImpl implements AuthRemoteDataSource {
  final ApiClient apiClient;
  final AuthTokenService _tokenService = AuthTokenService.instance;

  AuthRemoteDataSourceImpl({
    required this.apiClient,
  });

  @override
  Future<AuthResponse> login(LoginRequest request) async {
    print('🔐 LOGIN REQUEST: ${request.email}');

    final response = await apiClient.post(
      ApiConstants.login,
      data: request.toJson(),
    );

    print('✅ LOGIN RESPONSE received');
    print('Response data: ${response.data}');

    final authResponse = AuthResponse.fromJson(response.data);
    print('✅ AuthResponse parsed');
    print('  User ID: ${authResponse.user.id}');
    print('  User Email: ${authResponse.user.email}');

    // Save tokens
    await saveTokens(authResponse.accessToken, authResponse.refreshToken);

    return authResponse;
  }

  @override
  Future<AuthResponse> register(RegisterRequest request) async {
    final response = await apiClient.post(
      ApiConstants.register,
      data: request.toJson(),
    );

    final authResponse = AuthResponse.fromJson(response.data);

    // Save tokens
    await saveTokens(authResponse.accessToken, authResponse.refreshToken);

    return authResponse;
  }

  @override
  Future<void> logout() async {
    try {
      await apiClient.post(ApiConstants.logout);
    } finally {
      await clearTokens();
    }
  }

  @override
  Future<void> saveTokens(String accessToken, String refreshToken) async {
    await _tokenService.setTokens(accessToken, refreshToken);
  }

  @override
  Future<void> clearTokens() async {
    await _tokenService.clearTokens();
  }
}
