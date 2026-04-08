import 'package:equatable/equatable.dart';
import '../../domain/entities/learning_path_entity.dart';

abstract class LearningPathState extends Equatable {
  const LearningPathState();

  @override
  List<Object?> get props => [];
}

class LearningPathInitial extends LearningPathState {}

class LearningPathLoading extends LearningPathState {}

class LearningPathsLoaded extends LearningPathState {
  final List<LearningPathEntity> paths;

  const LearningPathsLoaded({required this.paths});

  @override
  List<Object?> get props => [paths];
}

class PathDetailLoaded extends LearningPathState {
  final LearningPathEntity path;

  const PathDetailLoaded({required this.path});

  @override
  List<Object?> get props => [path];
}

class PathGenerating extends LearningPathState {
  final String topic;

  const PathGenerating({required this.topic});

  @override
  List<Object?> get props => [topic];
}

class PathCreated extends LearningPathState {
  final LearningPathEntity path;

  const PathCreated({required this.path});

  @override
  List<Object?> get props => [path];
}

class StepCompleted extends LearningPathState {
  final String stepId;

  const StepCompleted({required this.stepId});

  @override
  List<Object?> get props => [stepId];
}

class PathDeleted extends LearningPathState {
  final String pathId;

  const PathDeleted({required this.pathId});

  @override
  List<Object?> get props => [pathId];
}

class LearningPathError extends LearningPathState {
  final String message;

  const LearningPathError({required this.message});

  @override
  List<Object?> get props => [message];
}
