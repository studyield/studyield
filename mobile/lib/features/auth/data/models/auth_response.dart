import '../../domain/entities/user_entity.dart';

class AuthResponse {
  final String accessToken;
  final String refreshToken;
  final UserEntity user;

  AuthResponse({
    required this.accessToken,
    required this.refreshToken,
    required this.user,
  });

  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    // Handle nested tokens object
    final tokens = json['tokens'] as Map<String, dynamic>;

    // Merge subscription data with user data
    final userData = Map<String, dynamic>.from(json['user'] as Map<String, dynamic>);
    if (json['subscription'] != null) {
      userData['subscription'] = json['subscription'];
      print('✅ Subscription data included in user: ${json['subscription']}');
    }

    return AuthResponse(
      accessToken: tokens['accessToken'] as String,
      refreshToken: tokens['refreshToken'] as String,
      user: UserEntity.fromJson(userData),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'tokens': {
        'accessToken': accessToken,
        'refreshToken': refreshToken,
      },
      'user': user.toJson(),
    };
  }
}
