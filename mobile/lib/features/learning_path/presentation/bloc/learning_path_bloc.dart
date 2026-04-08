import 'package:flutter_bloc/flutter_bloc.dart';
import '../../domain/repositories/learning_path_repository.dart';
import 'learning_path_event.dart';
import 'learning_path_state.dart';

class LearningPathBloc extends Bloc<LearningPathEvent, LearningPathState> {
  final LearningPathRepository repository;

  LearningPathBloc({required this.repository}) : super(LearningPathInitial()) {
    on<LoadLearningPaths>(_onLoadPaths);
    on<CreateLearningPath>(_onCreatePath);
    on<GenerateLearningPath>(_onGeneratePath);
    on<LoadPathDetail>(_onLoadPathDetail);
    on<CompleteStep>(_onCompleteStep);
    on<DeletePath>(_onDeletePath);
  }

  Future<void> _onLoadPaths(
    LoadLearningPaths event,
    Emitter<LearningPathState> emit,
  ) async {
    emit(LearningPathLoading());

    try {
      final paths = await repository.getLearningPaths();
      emit(LearningPathsLoaded(paths: paths));
    } catch (e) {
      emit(LearningPathError(message: e.toString()));
    }
  }

  Future<void> _onCreatePath(
    CreateLearningPath event,
    Emitter<LearningPathState> emit,
  ) async {
    emit(PathGenerating(topic: event.topic));

    try {
      final path = await repository.createPath(
        topic: event.topic,
        currentLevel: event.currentLevel,
        targetLevel: event.targetLevel,
        hoursPerWeek: event.hoursPerWeek,
      );
      emit(PathCreated(path: path));
    } catch (e) {
      emit(LearningPathError(message: e.toString()));
    }
  }

  Future<void> _onGeneratePath(
    GenerateLearningPath event,
    Emitter<LearningPathState> emit,
  ) async {
    emit(PathGenerating(topic: event.topic));

    try {
      final path = await repository.generatePath(
        topic: event.topic,
        currentLevel: event.currentLevel,
        targetLevel: event.targetLevel,
        hoursPerWeek: event.hoursPerWeek,
      );
      emit(PathCreated(path: path));
    } catch (e) {
      emit(LearningPathError(message: e.toString()));
    }
  }

  Future<void> _onLoadPathDetail(
    LoadPathDetail event,
    Emitter<LearningPathState> emit,
  ) async {
    emit(LearningPathLoading());

    try {
      final path = await repository.getPathDetail(event.pathId);
      emit(PathDetailLoaded(path: path));
    } catch (e) {
      emit(LearningPathError(message: e.toString()));
    }
  }

  Future<void> _onCompleteStep(
    CompleteStep event,
    Emitter<LearningPathState> emit,
  ) async {
    try {
      await repository.completeStep(event.pathId, event.stepId);
      emit(StepCompleted(stepId: event.stepId));

      // Reload path to get updated progress
      final path = await repository.getPathDetail(event.pathId);
      emit(PathDetailLoaded(path: path));
    } catch (e) {
      emit(LearningPathError(message: e.toString()));
    }
  }

  Future<void> _onDeletePath(
    DeletePath event,
    Emitter<LearningPathState> emit,
  ) async {
    try {
      await repository.deletePath(event.pathId);
      emit(PathDeleted(pathId: event.pathId));
    } catch (e) {
      emit(LearningPathError(message: e.toString()));
    }
  }
}
