import '../entities/teach_back_session_entity.dart';
import '../entities/teach_back_evaluation_entity.dart';

abstract class TeachBackRepository {
  Future<TeachBackSessionEntity> createSession({
    required String topic,
    String difficulty = 'classmate',
    String? referenceMaterial,
  });

  Future<TeachBackSessionEntity> createFromStudySet(String studySetId);

  Future<List<TeachBackSessionEntity>> getSessions();

  Future<TeachBackSessionEntity> getSession(String id);

  Future<String?> getEssentials(String id);

  Future<TeachBackSessionEntity> submitExplanation(
    String id,
    String explanation,
  );

  Future<TeachBackEvaluationEntity> evaluate(String id);

  Future<Map<String, dynamic>> startChallenge(String id);

  Future<Map<String, dynamic>> respondToChallenge(String id, String message);

  Future<void> deleteSession(String id);
}
