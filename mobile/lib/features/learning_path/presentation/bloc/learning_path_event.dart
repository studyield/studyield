import 'package:equatable/equatable.dart';

abstract class LearningPathEvent extends Equatable {
  const LearningPathEvent();

  @override
  List<Object?> get props => [];
}

class LoadLearningPaths extends LearningPathEvent {
  const LoadLearningPaths();
}

class CreateLearningPath extends LearningPathEvent {
  final String topic;
  final String currentLevel;
  final String targetLevel;
  final int hoursPerWeek;

  const CreateLearningPath({
    required this.topic,
    required this.currentLevel,
    required this.targetLevel,
    required this.hoursPerWeek,
  });

  @override
  List<Object?> get props => [topic, currentLevel, targetLevel, hoursPerWeek];
}

class GenerateLearningPath extends LearningPathEvent {
  final String topic;
  final String currentLevel;
  final String targetLevel;
  final int hoursPerWeek;

  const GenerateLearningPath({
    required this.topic,
    required this.currentLevel,
    required this.targetLevel,
    required this.hoursPerWeek,
  });

  @override
  List<Object?> get props => [topic, currentLevel, targetLevel, hoursPerWeek];
}

class LoadPathDetail extends LearningPathEvent {
  final String pathId;

  const LoadPathDetail({required this.pathId});

  @override
  List<Object?> get props => [pathId];
}

class CompleteStep extends LearningPathEvent {
  final String pathId;
  final String stepId;

  const CompleteStep({
    required this.pathId,
    required this.stepId,
  });

  @override
  List<Object?> get props => [pathId, stepId];
}

class DeletePath extends LearningPathEvent {
  final String pathId;

  const DeletePath({required this.pathId});

  @override
  List<Object?> get props => [pathId];
}
