import '../../domain/entities/analytics_entity.dart';

class AnalyticsModel extends AnalyticsEntity {
  const AnalyticsModel({
    required super.totalStudyTime,
    required super.cardsReviewed,
    required super.quizzesTaken,
    required super.avgScore,
    required super.currentStreak,
    required super.longestStreak,
  });

  factory AnalyticsModel.fromJson(Map<String, dynamic> json) {
    return AnalyticsModel(
      totalStudyTime: json['totalStudyTime'] ?? 0,
      cardsReviewed: json['flashcardsReviewed'] ?? json['cardsReviewed'] ?? 0,
      quizzesTaken: json['quizzesTaken'] ?? 0,
      avgScore: (json['averageQuizScore'] ?? json['avgScore'] ?? 0.0).toDouble(),
      currentStreak: json['currentStreak'] ?? 0,
      longestStreak: json['longestStreak'] ?? 0,
    );
  }

  AnalyticsEntity toEntity() => this;
}
