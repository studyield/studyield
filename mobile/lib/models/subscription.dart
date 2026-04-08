class Subscription {
  final String plan;
  final String status;
  final DateTime? currentPeriodStart;
  final DateTime? currentPeriodEnd;
  final bool cancelAtPeriodEnd;

  Subscription({
    required this.plan,
    required this.status,
    this.currentPeriodStart,
    this.currentPeriodEnd,
    required this.cancelAtPeriodEnd,
  });

  factory Subscription.fromJson(Map<String, dynamic> json) {
    return Subscription(
      plan: json['plan'] as String,
      status: json['status'] as String,
      currentPeriodStart: json['currentPeriodStart'] != null
          ? DateTime.parse(json['currentPeriodStart'] as String)
          : null,
      currentPeriodEnd: json['currentPeriodEnd'] != null
          ? DateTime.parse(json['currentPeriodEnd'] as String)
          : null,
      cancelAtPeriodEnd: json['cancelAtPeriodEnd'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'plan': plan,
      'status': status,
      'currentPeriodStart': currentPeriodStart?.toIso8601String(),
      'currentPeriodEnd': currentPeriodEnd?.toIso8601String(),
      'cancelAtPeriodEnd': cancelAtPeriodEnd,
    };
  }

  // Helper getters
  bool get isFree => plan == 'free';
  bool get isMonthly => plan == 'monthly';
  bool get isYearly => plan == 'yearly';
  bool get isPro => isMonthly || isYearly;

  bool get isActive => status == 'active';
  bool get isCanceled => status == 'canceled';
  bool get isPastDue => status == 'past_due';
  bool get isTrialing => status == 'trialing';

  String get planDisplayName {
    switch (plan) {
      case 'monthly':
        return 'Pro (Monthly)';
      case 'yearly':
        return 'Pro (Yearly)';
      case 'free':
      default:
        return 'Free';
    }
  }

  String get statusDisplayName {
    switch (status) {
      case 'active':
        return 'Active';
      case 'canceled':
        return 'Canceled';
      case 'past_due':
        return 'Past Due';
      case 'trialing':
        return 'Trial';
      default:
        return status;
    }
  }

  // Get days remaining in subscription
  int? get daysRemaining {
    if (currentPeriodEnd == null) return null;
    final now = DateTime.now();
    final difference = currentPeriodEnd!.difference(now);
    return difference.inDays;
  }

  // Check if subscription is expiring soon (within 7 days)
  bool get isExpiringSoon {
    final days = daysRemaining;
    return days != null && days > 0 && days <= 7;
  }

  Subscription copyWith({
    String? plan,
    String? status,
    DateTime? currentPeriodStart,
    DateTime? currentPeriodEnd,
    bool? cancelAtPeriodEnd,
  }) {
    return Subscription(
      plan: plan ?? this.plan,
      status: status ?? this.status,
      currentPeriodStart: currentPeriodStart ?? this.currentPeriodStart,
      currentPeriodEnd: currentPeriodEnd ?? this.currentPeriodEnd,
      cancelAtPeriodEnd: cancelAtPeriodEnd ?? this.cancelAtPeriodEnd,
    );
  }
}
