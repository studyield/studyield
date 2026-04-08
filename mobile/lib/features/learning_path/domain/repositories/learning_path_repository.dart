import '../entities/learning_path_entity.dart';

abstract class LearningPathRepository {
  Future<List<LearningPathEntity>> getLearningPaths();

  Future<LearningPathEntity> createPath({
    required String topic,
    required String currentLevel,
    required String targetLevel,
    required int hoursPerWeek,
  });

  Future<LearningPathEntity> generatePath({
    required String topic,
    required String currentLevel,
    required String targetLevel,
    required int hoursPerWeek,
  });

  Future<LearningPathEntity> getPathDetail(String id);

  Future<void> completeStep(String pathId, String stepId);

  Future<void> deletePath(String id);
}
