import 'package:equatable/equatable.dart';

enum StepType { study, quiz, practice, review, project }

class LearningStepEntity extends Equatable {
  final String id;
  final String pathId;
  final int stepNumber;
  final String title;
  final String description;
  final StepType type;
  final int estimatedMinutes;
  final bool isCompleted;
  final String? resourceUrl;
  final DateTime? completedAt;
  final DateTime createdAt;

  const LearningStepEntity({
    required this.id,
    required this.pathId,
    required this.stepNumber,
    required this.title,
    required this.description,
    required this.type,
    required this.estimatedMinutes,
    this.isCompleted = false,
    this.resourceUrl,
    this.completedAt,
    required this.createdAt,
  });

  @override
  List<Object?> get props => [
        id,
        pathId,
        stepNumber,
        title,
        description,
        type,
        estimatedMinutes,
        isCompleted,
        resourceUrl,
        completedAt,
        createdAt,
      ];
}
