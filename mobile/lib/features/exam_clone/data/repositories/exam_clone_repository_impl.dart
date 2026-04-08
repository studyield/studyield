import '../../../../core/network/api_client.dart';
import '../../domain/entities/exam_clone_entity.dart';
import '../../domain/entities/exam_question_entity.dart';
import '../../domain/entities/exam_stats_entity.dart';
import '../../domain/repositories/exam_clone_repository.dart';
import '../models/exam_clone_model.dart';
import '../models/exam_question_model.dart';

class ExamCloneRepositoryImpl implements ExamCloneRepository {
  final ApiClient apiClient;

  ExamCloneRepositoryImpl({required this.apiClient});

  @override
  Future<List<ExamCloneEntity>> getExams() async {
    try {
      final response = await apiClient.get('/exam-clones');
      final List<dynamic> examsData = response.data as List<dynamic>;
      return examsData
          .map((json) =>
              ExamCloneModel.fromJson(json as Map<String, dynamic>).toEntity())
          .toList();
    } catch (e) {
      throw Exception('Failed to load exams: $e');
    }
  }

  @override
  Future<ExamCloneEntity> getExamById(String examId) async {
    try {
      final response = await apiClient.get('/exam-clones/$examId');
      return ExamCloneModel.fromJson(response.data as Map<String, dynamic>)
          .toEntity();
    } catch (e) {
      throw Exception('Failed to load exam: $e');
    }
  }

  @override
  Future<ExamCloneEntity> createExam({
    required String title,
    String? subject,
    String? examText,
  }) async {
    try {
      final response = await apiClient.post(
        '/exam-clones',
        data: {
          'title': title,
          if (subject != null && subject.isNotEmpty) 'subject': subject,
          if (examText != null && examText.isNotEmpty) 'examText': examText,
        },
      );
      return ExamCloneModel.fromJson(response.data as Map<String, dynamic>)
          .toEntity();
    } catch (e) {
      throw Exception('Failed to create exam: $e');
    }
  }

  @override
  Future<ExamCloneEntity> uploadExamFile({
    required String examId,
    required String filePath,
  }) async {
    try {
      // Upload file
      await apiClient.uploadFile(
        '/exam-clones/$examId/upload',
        filePath: filePath,
        fieldName: 'file',
      );

      // Fetch updated exam after upload
      final examResponse = await apiClient.get('/exam-clones/$examId');
      return ExamCloneModel.fromJson(examResponse.data as Map<String, dynamic>)
          .toEntity();
    } catch (e) {
      throw Exception('Failed to upload exam file: $e');
    }
  }

  @override
  Future<void> deleteExam(String examId) async {
    try {
      await apiClient.delete('/exam-clones/$examId');
    } catch (e) {
      throw Exception('Failed to delete exam: $e');
    }
  }

  @override
  Future<List<ExamQuestionEntity>> getQuestions(String examId) async {
    try {
      final response = await apiClient.get('/exam-clones/$examId/questions');
      final List<dynamic> questionsData = response.data as List<dynamic>;
      return questionsData
          .map((json) => ExamQuestionModel.fromJson(json as Map<String, dynamic>)
              .toEntity())
          .toList();
    } catch (e) {
      throw Exception('Failed to load questions: $e');
    }
  }

  @override
  Future<ExamQuestionEntity> getQuestionById(String questionId) async {
    try {
      final response = await apiClient.get('/exam-clones/questions/$questionId');
      return ExamQuestionModel.fromJson(response.data as Map<String, dynamic>)
          .toEntity();
    } catch (e) {
      throw Exception('Failed to load question: $e');
    }
  }

  @override
  Future<List<ExamQuestionEntity>> getReviewQueue() async {
    try {
      final response = await apiClient.get('/exam-clones/review-queue');
      final List<dynamic> questionsData = response.data as List<dynamic>;
      return questionsData
          .map((json) => ExamQuestionModel.fromJson(json as Map<String, dynamic>)
              .toEntity())
          .toList();
    } catch (e) {
      throw Exception('Failed to load review queue: $e');
    }
  }

  @override
  Future<void> completeReview({
    required String questionId,
    required String quality,
  }) async {
    try {
      await apiClient.post(
        '/exam-clones/review/$questionId',
        data: {'quality': quality},
      );
    } catch (e) {
      throw Exception('Failed to complete review: $e');
    }
  }

  @override
  Future<List<ExamQuestionEntity>> getBookmarks() async {
    try {
      final response = await apiClient.get('/exam-clones/bookmarks');
      final List<dynamic> questionsData = response.data as List<dynamic>;
      return questionsData
          .map((json) => ExamQuestionModel.fromJson(json as Map<String, dynamic>)
              .toEntity())
          .toList();
    } catch (e) {
      throw Exception('Failed to load bookmarks: $e');
    }
  }

  @override
  Future<void> toggleBookmark(String questionId) async {
    try {
      await apiClient.post('/exam-clones/bookmarks/$questionId');
    } catch (e) {
      throw Exception('Failed to toggle bookmark: $e');
    }
  }

  @override
  Future<void> submitAttempt({
    required String examId,
    required String questionId,
    required String userAnswer,
  }) async {
    try {
      await apiClient.post(
        '/exam-clones/$examId/attempt',
        data: {
          'questionId': questionId,
          'userAnswer': userAnswer,
        },
      );
    } catch (e) {
      throw Exception('Failed to submit attempt: $e');
    }
  }

  @override
  Future<ExamStatsEntity> getStats() async {
    try {
      final exams = await getExams();
      final reviewQueue = await getReviewQueue();

      return ExamStatsEntity(
        totalExams: exams.length,
        totalOriginalQuestions: exams.fold(
            0, (sum, exam) => sum + exam.originalQuestionCount),
        totalGeneratedQuestions: exams.fold(
            0, (sum, exam) => sum + exam.generatedQuestionCount),
        readyToPractice: exams
            .where((exam) => exam.status == ExamCloneStatus.completed)
            .length,
        reviewQueueCount: reviewQueue.length,
      );
    } catch (e) {
      throw Exception('Failed to load stats: $e');
    }
  }
}
