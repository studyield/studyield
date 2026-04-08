import 'package:equatable/equatable.dart';

class AnalyticsEntity extends Equatable {
  final int totalStudyTime; // in minutes
  final int cardsReviewed;
  final int quizzesTaken;
  final double avgScore; // percentage 0-100
  final int currentStreak;
  final int longestStreak;

  const AnalyticsEntity({
    required this.totalStudyTime,
    required this.cardsReviewed,
    required this.quizzesTaken,
    required this.avgScore,
    required this.currentStreak,
    required this.longestStreak,
  });

  @override
  List<Object?> get props => [
        totalStudyTime,
        cardsReviewed,
        quizzesTaken,
        avgScore,
        currentStreak,
        longestStreak,
      ];
}
