import '../../../../models/subscription.dart';

class UserEntity {
  final String id;
  final String email;
  final String? name;
  final String? avatarUrl;
  final String? plan;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final Subscription? subscription;

  UserEntity({
    required this.id,
    required this.email,
    this.name,
    this.avatarUrl,
    this.plan,
    this.createdAt,
    this.updatedAt,
    this.subscription,
  });

  factory UserEntity.fromJson(Map<String, dynamic> json) {
    // Parse subscription if available
    Subscription? subscription;
    if (json['subscription'] != null) {
      subscription = Subscription.fromJson(json['subscription'] as Map<String, dynamic>);
      print('✅ UserEntity: Subscription parsed - ${subscription.planDisplayName} (${subscription.statusDisplayName})');
    } else {
      print('⚠️ UserEntity: No subscription data found in JSON');
    }

    return UserEntity(
      id: json['id'] as String,
      email: json['email'] as String,
      name: json['name'] as String?,
      avatarUrl: json['avatarUrl'] as String?,
      plan: json['plan'] as String? ?? subscription?.plan,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'] as String)
          : null,
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'] as String)
          : null,
      subscription: subscription,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'name': name,
      'avatarUrl': avatarUrl,
      'plan': plan,
      'createdAt': createdAt?.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
      'subscription': subscription?.toJson(),
    };
  }

  bool get isPro => subscription?.isPro ?? (plan == 'pro' || plan == 'monthly' || plan == 'yearly' || plan == 'team');
  bool get isTeam => plan == 'team';
  bool get isMonthly => subscription?.isMonthly ?? (plan == 'monthly');

  String get planDisplayName {
    if (subscription != null) {
      return subscription!.planDisplayName;
    }
    if (plan == 'monthly') return 'Pro (Monthly)';
    if (plan == 'pro' || plan == 'yearly') return 'Pro (Yearly)';
    if (plan == 'team') return 'Team';
    return 'Free';
  }
}
