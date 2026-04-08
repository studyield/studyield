import '../../../../core/network/api_client.dart';
import '../../domain/entities/teach_back_session_entity.dart';
import '../../domain/entities/teach_back_evaluation_entity.dart';
import '../../domain/repositories/teach_back_repository.dart';
import '../models/teach_back_session_model.dart';
import '../models/teach_back_evaluation_model.dart';

class TeachBackRepositoryImpl implements TeachBackRepository {
  final ApiClient apiClient;

  TeachBackRepositoryImpl({required this.apiClient});

  @override
  Future<TeachBackSessionEntity> createSession({
    required String topic,
    String difficulty = 'classmate',
    String? referenceMaterial,
  }) async {
    final response = await apiClient.post(
      '/teach-back',
      data: {
        'topic': topic,
        if (referenceMaterial != null) 'referenceContent': referenceMaterial,
      },
    );
    return TeachBackSessionModel.fromJson(response.data).toEntity();
  }

  @override
  Future<TeachBackSessionEntity> createFromStudySet(String studySetId) async {
    final response = await apiClient.post(
      '/teach-back/from-study-set',
      data: {'studySetId': studySetId},
    );
    return TeachBackSessionModel.fromJson(response.data).toEntity();
  }

  @override
  Future<List<TeachBackSessionEntity>> getSessions() async {
    final response = await apiClient.get('/teach-back');
    final List<dynamic> data = response.data;
    return data
        .map((json) => TeachBackSessionModel.fromJson(json).toEntity())
        .toList();
  }

  @override
  Future<TeachBackSessionEntity> getSession(String id) async {
    final response = await apiClient.get('/teach-back/$id');
    return TeachBackSessionModel.fromJson(response.data).toEntity();
  }

  @override
  Future<String?> getEssentials(String id) async {
    try {
      final response = await apiClient.get('/teach-back/$id/essentials');
      // Backend returns 'summary' field, not 'essentials'
      return response.data['summary'] as String? ??
             response.data['essentials'] as String?;
    } catch (e) {
      return null;
    }
  }

  @override
  Future<TeachBackSessionEntity> submitExplanation(
    String id,
    String explanation,
  ) async {
    final response = await apiClient.post(
      '/teach-back/$id/submit',
      data: {'explanation': explanation},
    );
    return TeachBackSessionModel.fromJson(response.data).toEntity();
  }

  @override
  Future<TeachBackEvaluationEntity> evaluate(String id) async {
    final response = await apiClient.post('/teach-back/$id/evaluate');

    // Backend returns the updated session with evaluation field
    final sessionData = response.data;
    final evaluationData = sessionData['evaluation'] as Map<String, dynamic>?;

    if (evaluationData == null) {
      throw Exception('No evaluation data returned');
    }

    return TeachBackEvaluationModel.fromJson(evaluationData).toEntity();
  }

  @override
  Future<Map<String, dynamic>> startChallenge(String id) async {
    final response = await apiClient.post('/teach-back/$id/challenge/start');
    return response.data as Map<String, dynamic>;
  }

  @override
  Future<Map<String, dynamic>> respondToChallenge(String id, String message) async {
    final response = await apiClient.post('/teach-back/$id/challenge/respond', data: {'message': message});
    return response.data as Map<String, dynamic>;
  }

  @override
  Future<void> deleteSession(String id) async {
    await apiClient.delete('/teach-back/$id');
  }
}
