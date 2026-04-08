import 'package:equatable/equatable.dart';
import 'learning_step_entity.dart';

class LearningPathEntity extends Equatable {
  final String id;
  final String userId;
  final String title;
  final String topic;
  final String currentLevel;
  final String targetLevel;
  final int hoursPerWeek;
  final int totalSteps;
  final int completedSteps;
  final int estimatedHours;
  final String difficulty;
  final String? subject;
  final List<LearningStepEntity> steps;
  final DateTime createdAt;
  final DateTime updatedAt;

  const LearningPathEntity({
    required this.id,
    required this.userId,
    required this.title,
    required this.topic,
    required this.currentLevel,
    required this.targetLevel,
    required this.hoursPerWeek,
    required this.totalSteps,
    required this.completedSteps,
    required this.estimatedHours,
    required this.difficulty,
    this.subject,
    this.steps = const [],
    required this.createdAt,
    required this.updatedAt,
  });

  double get progress => totalSteps > 0 ? completedSteps / totalSteps : 0.0;

  @override
  List<Object?> get props => [
        id,
        userId,
        title,
        topic,
        currentLevel,
        targetLevel,
        hoursPerWeek,
        totalSteps,
        completedSteps,
        estimatedHours,
        difficulty,
        subject,
        steps,
        createdAt,
        updatedAt,
      ];
}
