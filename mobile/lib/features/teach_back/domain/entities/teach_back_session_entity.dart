import 'package:equatable/equatable.dart';

enum TeachBackStatus { pending, submitted, evaluated }

class TeachBackSessionEntity extends Equatable {
  final String id;
  final String userId;
  final String topic;
  final String difficulty; // 'eli5', 'classmate', 'expert'
  final TeachBackStatus status;
  final String? explanation;
  final Map<String, dynamic>? evaluation;
  final double? overallScore;
  final DateTime createdAt;
  final DateTime updatedAt;

  const TeachBackSessionEntity({
    required this.id,
    required this.userId,
    required this.topic,
    required this.difficulty,
    required this.status,
    this.explanation,
    this.evaluation,
    this.overallScore,
    required this.createdAt,
    required this.updatedAt,
  });

  @override
  List<Object?> get props => [
        id,
        userId,
        topic,
        difficulty,
        status,
        explanation,
        evaluation,
        overallScore,
        createdAt,
        updatedAt,
      ];
}
