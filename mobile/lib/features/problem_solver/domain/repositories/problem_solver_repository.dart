import '../entities/problem_session_entity.dart';
import '../entities/similar_problem_entity.dart';
import '../entities/chat_message_entity.dart';
import '../entities/hint_step_entity.dart';
import '../entities/concept_map_entity.dart';
import '../entities/quiz_question_entity.dart';
import '../entities/formula_card_entity.dart';
import '../entities/alternative_method_entity.dart';
import '../entities/code_block_entity.dart';
import '../entities/citation_entity.dart';
import '../entities/graph_data_entity.dart';
import '../entities/complexity_explanation_entity.dart';
import '../entities/narration_entity.dart';
import '../entities/batch_problem_entity.dart';
import '../entities/bookmark_entity.dart';

abstract class ProblemSolverRepository {
  // Session management
  Future<ProblemSessionEntity> createSession({
    required String problem,
    String? subject,
    String? imageUrl,
  });

  Future<List<ProblemSessionEntity>> getSessions();
  Future<ProblemSessionEntity> getSession(String id);
  Future<void> deleteSession(String id);
  Future<ProblemSessionEntity> solveSession(String id);

  // Learning features
  Future<List<SimilarProblemEntity>> getSimilarProblems(String sessionId);
  Future<HintStepEntity> getNextHint(String sessionId);
  Future<void> resetHints(String sessionId);
  Future<List<ChatMessageEntity>> getChatMessages(String sessionId);
  Future<ChatMessageEntity> sendChatMessage(String sessionId, String message);
  Future<ConceptMapEntity> getConceptMap(String sessionId);
  Future<List<QuizQuestionEntity>> getPracticeQuiz(String sessionId);
  Future<Map<String, dynamic>> submitQuizAnswer(String questionId, String answer);
  Future<List<FormulaCardEntity>> getFormulaCards(String sessionId);
  Future<List<AlternativeMethodEntity>> getAlternativeMethods(String sessionId);
  Future<List<CodeBlockEntity>> getCodeBlocks(String sessionId);
  Future<List<CitationEntity>> getCitations(String sessionId);
  Future<GraphDataEntity> getGraphData(String sessionId);
  Future<ComplexityExplanationEntity> getExplanation(String sessionId, String level);
  Future<NarrationEntity> generateNarration(String sessionId);
  Future<NarrationEntity> getNarration(String sessionId);

  // Bookmarks
  Future<void> toggleBookmark(String sessionId);
  Future<bool> getBookmarkStatus(String sessionId);
  Future<List<ProblemSessionEntity>> getBookmarks();

  // Batch extraction
  Future<List<String>> extractProblems(String text);

  // Batch problem solver
  Future<List<BatchProblemEntity>> uploadPdfFile(String filePath);
  Future<List<BatchProblemEntity>> extractProblemsFromText(String text);
  Future<List<ProblemSessionEntity>> solveBatchProblems(
    String extractionId,
    List<int> problemIndices,
  );

  // Enhanced bookmarks
  Future<BookmarkEntity> addBookmark({
    required String sessionId,
    List<String> tags = const [],
    String? notes,
  });
  Future<BookmarkEntity> updateBookmark({
    required String bookmarkId,
    List<String>? tags,
    String? notes,
  });
  Future<void> deleteBookmark(String bookmarkId);
  Future<List<BookmarkEntity>> getBookmarksWithFilters({
    List<String>? tags,
    String? searchQuery,
  });
}
