import 'subscription.dart';

class User {
  final String id;
  final String email;
  final String name;
  final String? avatarUrl;
  final String plan;
  final bool profileCompleted;
  final DateTime createdAt;
  final DateTime updatedAt;
  final Subscription? subscription;

  User({
    required this.id,
    required this.email,
    required this.name,
    this.avatarUrl,
    required this.plan,
    this.profileCompleted = false,
    required this.createdAt,
    required this.updatedAt,
    this.subscription,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    final createdAt = json['createdAt'] != null
        ? DateTime.parse(json['createdAt'] as String)
        : DateTime.now();

    // Parse subscription if available
    Subscription? subscription;
    if (json['subscription'] != null) {
      subscription = Subscription.fromJson(json['subscription'] as Map<String, dynamic>);
    }

    return User(
      id: json['id'] as String,
      email: json['email'] as String,
      name: json['name'] as String? ?? '',
      avatarUrl: json['avatarUrl'] as String?,
      plan: json['plan'] as String? ?? subscription?.plan ?? 'free',
      profileCompleted: json['profileCompleted'] as bool? ?? false,
      createdAt: createdAt,
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'] as String)
          : createdAt, // Default to createdAt if updatedAt not provided
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
      'profileCompleted': profileCompleted,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'subscription': subscription?.toJson(),
    };
  }

  User copyWith({
    String? id,
    String? email,
    String? name,
    String? avatarUrl,
    String? plan,
    bool? profileCompleted,
    DateTime? createdAt,
    DateTime? updatedAt,
    Subscription? subscription,
  }) {
    return User(
      id: id ?? this.id,
      email: email ?? this.email,
      name: name ?? this.name,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      plan: plan ?? this.plan,
      profileCompleted: profileCompleted ?? this.profileCompleted,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      subscription: subscription ?? this.subscription,
    );
  }

  bool get isPro => subscription?.isPro ?? (plan != 'free');
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
