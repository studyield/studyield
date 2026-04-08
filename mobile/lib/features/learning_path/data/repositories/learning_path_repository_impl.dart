import '../../../../core/network/api_client.dart';
import '../../domain/entities/learning_path_entity.dart';
import '../../domain/repositories/learning_path_repository.dart';
import '../models/learning_path_model.dart';

class LearningPathRepositoryImpl implements LearningPathRepository {
  final ApiClient apiClient;

  LearningPathRepositoryImpl({required this.apiClient});

  @override
  Future<List<LearningPathEntity>> getLearningPaths() async {
    final response = await apiClient.get('/learning-paths');
    final List<dynamic> data = response.data;
    return data
        .map((json) => LearningPathModel.fromJson(json).toEntity())
        .toList();
  }

  @override
  Future<LearningPathEntity> createPath({
    required String topic,
    required String currentLevel,
    required String targetLevel,
    required int hoursPerWeek,
  }) async {
    final response = await apiClient.post(
      '/learning-paths',
      data: {
        'topic': topic,
        'currentLevel': currentLevel,
        'targetLevel': targetLevel,
        'hoursPerWeek': hoursPerWeek,
      },
    );
    return LearningPathModel.fromJson(response.data).toEntity();
  }

  @override
  Future<LearningPathEntity> generatePath({
    required String topic,
    required String currentLevel,
    required String targetLevel,
    required int hoursPerWeek,
  }) async {
    final response = await apiClient.post(
      '/learning-paths/generate',
      data: {
        'topic': topic,
        'currentLevel': currentLevel,
        'targetLevel': targetLevel,
        'hoursPerWeek': hoursPerWeek,
      },
    );
    return LearningPathModel.fromJson(response.data).toEntity();
  }

  @override
  Future<LearningPathEntity> getPathDetail(String id) async {
    final response = await apiClient.get('/learning-paths/$id');
    return LearningPathModel.fromJson(response.data).toEntity();
  }

  @override
  Future<void> completeStep(String pathId, String stepId) async {
    await apiClient.post('/learning-paths/$pathId/steps/$stepId/complete');
  }

  @override
  Future<void> deletePath(String id) async {
    await apiClient.delete('/learning-paths/$id');
  }
}
