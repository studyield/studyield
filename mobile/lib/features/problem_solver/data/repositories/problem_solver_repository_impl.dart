import '../../../../core/network/api_client.dart';
import '../../domain/entities/problem_session_entity.dart';
import '../../domain/entities/similar_problem_entity.dart';
import '../../domain/entities/chat_message_entity.dart';
import '../../domain/entities/hint_step_entity.dart';
import '../../domain/entities/concept_map_entity.dart';
import '../../domain/entities/quiz_question_entity.dart';
import '../../domain/entities/formula_card_entity.dart';
import '../../domain/entities/alternative_method_entity.dart';
import '../../domain/entities/code_block_entity.dart';
import '../../domain/entities/citation_entity.dart';
import '../../domain/entities/graph_data_entity.dart';
import '../../domain/entities/complexity_explanation_entity.dart';
import '../../domain/entities/narration_entity.dart';
import '../../domain/entities/batch_problem_entity.dart';
import '../../domain/entities/bookmark_entity.dart';
import '../../domain/repositories/problem_solver_repository.dart';
import '../models/problem_session_model.dart';
import '../models/alternative_method_model.dart';
import '../models/code_block_model.dart';
import '../models/citation_model.dart';
import '../models/graph_data_model.dart';
import '../models/complexity_explanation_model.dart';
import '../models/narration_model.dart';
import '../models/batch_problem_model.dart';
import '../models/bookmark_model.dart';

class ProblemSolverRepositoryImpl implements ProblemSolverRepository {
  final ApiClient apiClient;

  ProblemSolverRepositoryImpl({required this.apiClient});

  @override
  Future<ProblemSessionEntity> createSession({
    required String problem,
    String? subject,
    String? imageUrl,
  }) async {
    final response = await apiClient.post(
      '/problem-solver',
      data: {
        'problem': problem,
        if (subject != null) 'subject': subject,
        if (imageUrl != null) 'imageUrl': imageUrl,
      },
    );
    return ProblemSessionModel.fromJson(response.data).toEntity();
  }

  @override
  Future<List<ProblemSessionEntity>> getSessions() async {
    final response = await apiClient.get('/problem-solver');
    final List<dynamic> data = response.data;
    return data.map((json) => ProblemSessionModel.fromJson(json).toEntity()).toList();
  }

  @override
  Future<ProblemSessionEntity> getSession(String id) async {
    final response = await apiClient.get('/problem-solver/$id');
    return ProblemSessionModel.fromJson(response.data).toEntity();
  }

  @override
  Future<void> deleteSession(String id) async {
    await apiClient.delete('/problem-solver/$id');
  }

  @override
  Future<ProblemSessionEntity> solveSession(String id) async {
    final response = await apiClient.post('/problem-solver/$id/solve');
    return ProblemSessionModel.fromJson(response.data).toEntity();
  }

  @override
  Future<List<SimilarProblemEntity>> getSimilarProblems(String sessionId) async {
    final response = await apiClient.get('/problem-solver/$sessionId/similar');
    final responseData = response.data;
    final List<dynamic> data = responseData is Map
        ? (responseData['problems'] as List<dynamic>)
        : responseData as List<dynamic>;
    return data.map((json) {
      return SimilarProblemEntity(
        id: json['id'],
        problem: json['problem'],
        difficulty: _parseDifficulty(json['difficulty']),
        similarity: json['similarity'],
        hint: json['hint'],
      );
    }).toList();
  }

  @override
  Future<HintStepEntity> getNextHint(String sessionId) async {
    final response = await apiClient.post('/problem-solver/$sessionId/hint');
    return HintStepEntity(
      hint: response.data['hint'],
      hintNumber: response.data['hintNumber'],
      totalHintsNeeded: response.data['totalHintsNeeded'],
      isLastHint: response.data['isLastHint'],
      nextHintPreview: response.data['nextHintPreview'],
    );
  }

  @override
  Future<void> resetHints(String sessionId) async {
    await apiClient.post('/problem-solver/$sessionId/hint/reset');
  }

  @override
  Future<List<ChatMessageEntity>> getChatMessages(String sessionId) async {
    final response = await apiClient.get('/problem-solver/$sessionId/chat/messages');
    final List<dynamic> data = response.data;
    return data.map((json) {
      return ChatMessageEntity(
        id: json['id'],
        role: json['role'] == 'user' ? MessageRole.user : MessageRole.tutor,
        message: json['message'],
        createdAt: DateTime.parse(json['createdAt']),
      );
    }).toList();
  }

  @override
  Future<ChatMessageEntity> sendChatMessage(String sessionId, String message) async {
    final response = await apiClient.post(
      '/problem-solver/$sessionId/chat',
      data: {'message': message},
    );
    return ChatMessageEntity(
      id: response.data['id'],
      role: MessageRole.tutor,
      message: response.data['message'],
      createdAt: DateTime.parse(response.data['createdAt']),
    );
  }

  @override
  Future<ConceptMapEntity> getConceptMap(String sessionId) async {
    final response = await apiClient.get('/problem-solver/$sessionId/concept-map');
    final data = response.data;
    return ConceptMapEntity(
      centralTopic: data['centralTopic'],
      prerequisites: (data['prerequisites'] as List).map((c) => ConceptNode(
        name: c['name'],
        description: c['description'],
        difficulty: c['difficulty'],
      )).toList(),
      currentConcepts: (data['currentConcepts'] as List).map((c) => ConceptNode(
        name: c['name'],
        description: c['description'],
        importance: c['importance'],
      )).toList(),
      nextConcepts: (data['nextConcepts'] as List).map((c) => ConceptNode(
        name: c['name'],
        description: c['description'],
        difficulty: c['difficulty'],
      )).toList(),
      relatedConcepts: (data['relatedConcepts'] as List).map((c) => ConceptNode(
        name: c['name'],
        description: c['description'],
        relationship: c['relationship'],
      )).toList(),
    );
  }

  @override
  Future<List<QuizQuestionEntity>> getPracticeQuiz(String sessionId) async {
    final response = await apiClient.post('/problem-solver/$sessionId/practice-quiz');
    final List<dynamic> data = response.data;
    return data.map((json) {
      return QuizQuestionEntity(
        id: json['id'],
        question: json['question'],
        questionType: _parseQuestionType(json['questionType']),
        options: List<String>.from(json['options']),
        correctAnswer: json['correctAnswer'],
        explanation: json['explanation'],
        difficulty: json['difficulty'],
      );
    }).toList();
  }

  @override
  Future<Map<String, dynamic>> submitQuizAnswer(String questionId, String answer) async {
    final response = await apiClient.post(
      '/problem-solver/quiz/$questionId/answer',
      data: {'answer': answer},
    );
    // Backend returns: {isCorrect, correctAnswer, explanation}
    return {
      'isCorrect': response.data['isCorrect'] as bool,
      'correctAnswer': response.data['correctAnswer'] as String,
      'explanation': response.data['explanation'] as String,
      'userAnswer': answer,
    };
  }

  @override
  Future<List<FormulaCardEntity>> getFormulaCards(String sessionId) async {
    final response = await apiClient.get('/problem-solver/$sessionId/formula-cards');
    final responseData = response.data;
    final List<dynamic> data = responseData is Map
        ? (responseData['flashcards'] as List<dynamic>)
        : responseData as List<dynamic>;
    return data.map((json) {
      return FormulaCardEntity(
        front: json['front'],
        back: json['back'],
        category: json['category'],
        subject: json['subject'],
      );
    }).toList();
  }

  @override
  Future<List<AlternativeMethodEntity>> getAlternativeMethods(String sessionId) async {
    final response = await apiClient.get('/problem-solver/$sessionId/alternative-methods');
    final List<dynamic> data = response.data;
    return data.map((json) => AlternativeMethodModel.fromJson(json).toEntity()).toList();
  }

  @override
  Future<List<CodeBlockEntity>> getCodeBlocks(String sessionId) async {
    // TODO: Backend endpoint not implemented yet
    // Backend needs: GET /problem-solver/:id/code-blocks
    // For now, return empty list to prevent 404 errors
    return [];
  }

  @override
  Future<List<CitationEntity>> getCitations(String sessionId) async {
    // TODO: Backend endpoint not implemented yet
    // Backend needs: GET /problem-solver/:id/citations
    // For now, return empty list to prevent 404 errors
    return [];
  }

  @override
  Future<GraphDataEntity> getGraphData(String sessionId) async {
    try {
      final response = await apiClient.get('/problem-solver/$sessionId/graph');

      // If response is null or empty, return empty graph data
      if (response.data == null) {
        return GraphDataEntity(
          id: sessionId,
          sessionId: sessionId,
          functions: const [],
          specialPoints: const [],
          minX: -10,
          maxX: 10,
          minY: -10,
          maxY: 10,
          createdAt: DateTime.now(),
        );
      }

      return GraphDataModel.fromJson(response.data).toEntity();
    } catch (e) {
      // Return empty graph data on error
      return GraphDataEntity(
        id: sessionId,
        sessionId: sessionId,
        functions: const [],
        specialPoints: const [],
        minX: -10,
        maxX: 10,
        minY: -10,
        maxY: 10,
        createdAt: DateTime.now(),
      );
    }
  }

  @override
  Future<ComplexityExplanationEntity> getExplanation(String sessionId, String level) async {
    final response = await apiClient.post(
      '/problem-solver/$sessionId/explain',
      data: {'level': level},
    );
    return ComplexityExplanationModel.fromJson(response.data).toEntity();
  }

  @override
  Future<NarrationEntity> generateNarration(String sessionId) async {
    // Backend only has GET /narration, not POST /narration/generate
    // Use the existing narration endpoint instead
    return getNarration(sessionId);
  }

  @override
  Future<NarrationEntity> getNarration(String sessionId) async {
    try {
      final response = await apiClient.get('/problem-solver/$sessionId/narration');

      // Backend returns plain text, not structured narration
      final narrationText = response.data['narration'] as String? ??
                           response.data['text'] as String? ??
                           response.data.toString();

      // Create a simple narration entity with the text as a single segment
      return NarrationEntity(
        id: sessionId,
        sessionId: sessionId,
        audioUrl: '',
        segments: [
          NarrationSegment(
            text: narrationText,
            startTime: 0,
            endTime: 0,
          ),
        ],
        duration: 0,
        status: 'ready',
        createdAt: DateTime.now(),
      );
    } catch (e) {
      // If narration doesn't exist yet, return a placeholder
      return NarrationEntity(
        id: sessionId,
        sessionId: sessionId,
        audioUrl: '',
        segments: const [],
        duration: 0,
        status: 'not_available',
        createdAt: DateTime.now(),
      );
    }
  }

  @override
  Future<void> toggleBookmark(String sessionId) async {
    final status = await getBookmarkStatus(sessionId);
    if (status) {
      await apiClient.delete('/problem-solver/$sessionId/bookmark');
    } else {
      await apiClient.post('/problem-solver/$sessionId/bookmark');
    }
  }

  @override
  Future<bool> getBookmarkStatus(String sessionId) async {
    final response = await apiClient.get('/problem-solver/$sessionId/bookmark/status');
    return response.data['isBookmarked'] ?? false;
  }

  @override
  Future<List<ProblemSessionEntity>> getBookmarks() async {
    final response = await apiClient.get('/problem-solver/bookmarks');
    final List<dynamic> data = response.data;
    return data.map((json) => ProblemSessionModel.fromJson(json).toEntity()).toList();
  }

  @override
  Future<List<String>> extractProblems(String text) async {
    final response = await apiClient.post(
      '/problem-solver/batch/extract',
      data: {'text': text},
    );
    return List<String>.from(response.data);
  }

  @override
  Future<List<BatchProblemEntity>> uploadPdfFile(String filePath) async {
    // TODO: Backend endpoint not implemented yet
    // Backend needs: POST /problem-solver/batch/upload
    // For now, return empty list
    return [];
  }

  @override
  Future<List<BatchProblemEntity>> extractProblemsFromText(String text) async {
    // Use the existing /batch/extract endpoint
    final response = await apiClient.post(
      '/problem-solver/batch/extract',
      data: {'text': text},
    );

    // Backend returns List<string> of problem texts
    // Convert to BatchProblemEntity list
    final List<dynamic> problems = response.data;
    return problems.asMap().entries.map((entry) {
      return BatchProblemEntity(
        id: 'temp_${entry.key}',
        problem: entry.value.toString(),
        sequenceNumber: entry.key + 1,
        status: BatchProblemStatus.pending,
        createdAt: DateTime.now(),
      );
    }).toList();
  }

  @override
  Future<List<ProblemSessionEntity>> solveBatchProblems(
    String extractionId,
    List<int> problemIndices,
  ) async {
    // TODO: Backend endpoint not implemented yet
    // Backend needs: POST /problem-solver/batch/solve
    // For now, return empty list
    return [];
  }

  @override
  Future<BookmarkEntity> addBookmark({
    required String sessionId,
    List<String> tags = const [],
    String? notes,
  }) async {
    final response = await apiClient.post(
      '/problem-solver/$sessionId/bookmark',
      data: {
        'tags': tags,
        'notes': notes,
      },
    );
    return BookmarkModel.fromJson(response.data).toEntity();
  }

  @override
  Future<BookmarkEntity> updateBookmark({
    required String bookmarkId,
    List<String>? tags,
    String? notes,
  }) async {
    // TODO: Backend endpoint not implemented yet
    // Backend needs: PATCH /problem-solver/bookmarks/:id
    // For now, throw unimplemented error
    throw UnimplementedError('Update bookmark endpoint not available in backend yet');
  }

  @override
  Future<void> deleteBookmark(String bookmarkId) async {
    // TODO: Backend endpoint not implemented yet
    // Backend needs: DELETE /problem-solver/bookmarks/:id
    // For now, throw unimplemented error
    throw UnimplementedError('Delete specific bookmark endpoint not available in backend yet');
  }

  @override
  Future<List<BookmarkEntity>> getBookmarksWithFilters({
    List<String>? tags,
    String? searchQuery,
  }) async {
    // Backend has GET /problem-solver/bookmarks but doesn't support filtering yet
    // Get all bookmarks and filter client-side
    final response = await apiClient.get('/problem-solver/bookmarks');

    List<BookmarkEntity> bookmarks = [];

    // Check if response.data is a list
    if (response.data is List) {
      final List<dynamic> data = response.data;

      // Map to bookmark entities
      for (var item in data) {
        try {
          // Backend returns sessions with bookmark info, not separate bookmark entities
          // We need to adapt the response structure
          final session = ProblemSessionModel.fromJson(item);

          // Create a bookmark entity from the session
          bookmarks.add(BookmarkEntity(
            id: session.id,
            sessionId: session.id,
            session: session,
            tags: const [], // Backend doesn't return tags yet
            notes: null, // Backend doesn't return notes yet
            createdAt: session.createdAt,
          ));
        } catch (e) {
          // Skip invalid items
          continue;
        }
      }
    }

    // Client-side filtering
    if (searchQuery != null && searchQuery.isNotEmpty) {
      bookmarks = bookmarks.where((b) {
        final problem = b.session?.problem.toLowerCase() ?? '';
        final subject = b.session?.subject?.toLowerCase() ?? '';
        final query = searchQuery.toLowerCase();
        return problem.contains(query) || subject.contains(query);
      }).toList();
    }

    if (tags != null && tags.isNotEmpty) {
      bookmarks = bookmarks.where((b) {
        return b.tags.any((tag) => tags.contains(tag));
      }).toList();
    }

    return bookmarks;
  }

  // Helper methods
  Difficulty _parseDifficulty(String? difficulty) {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return Difficulty.easy;
      case 'medium':
        return Difficulty.medium;
      case 'hard':
        return Difficulty.hard;
      default:
        return Difficulty.medium;
    }
  }

  QuestionType _parseQuestionType(String? type) {
    switch (type) {
      case 'mcq':
        return QuestionType.mcq;
      case 'true_false':
        return QuestionType.trueFalse;
      case 'fill_blank':
        return QuestionType.fillBlank;
      default:
        return QuestionType.mcq;
    }
  }
}
