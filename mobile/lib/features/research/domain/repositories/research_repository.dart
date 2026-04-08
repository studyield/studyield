import '../entities/research_session_entity.dart';
import '../entities/research_result_entity.dart';

abstract class ResearchRepository {
  Future<ResearchSessionEntity> createSession({
    required String query,
    String depth = 'standard',
    List<String> sourceTypes = const ['documents'],
    String outputFormat = 'detailed',
  });

  Future<List<ResearchSessionEntity>> getSessions();

  Future<ResearchSessionEntity> getSession(String id);

  Future<void> startResearch(String id);

  Future<ResearchResultEntity?> getResult(String id);

  Future<void> deleteSession(String id);
}
