import '../entities/exam_clone_entity.dart';
import '../entities/exam_question_entity.dart';
import '../entities/exam_stats_entity.dart';

abstract class ExamCloneRepository {
  // Exam CRUD
  Future<List<ExamCloneEntity>> getExams();
  Future<ExamCloneEntity> getExamById(String examId);
  Future<ExamCloneEntity> createExam({
    required String title,
    String? subject,
    String? examText,
  });
  Future<ExamCloneEntity> uploadExamFile({
    required String examId,
    required String filePath,
  });
  Future<void> deleteExam(String examId);

  // Questions
  Future<List<ExamQuestionEntity>> getQuestions(String examId);
  Future<ExamQuestionEntity> getQuestionById(String questionId);

  // Review Queue
  Future<List<ExamQuestionEntity>> getReviewQueue();
  Future<void> completeReview({
    required String questionId,
    required String quality, // '0' to '5'
  });

  // Bookmarks
  Future<List<ExamQuestionEntity>> getBookmarks();
  Future<void> toggleBookmark(String questionId);

  // Practice
  Future<void> submitAttempt({
    required String examId,
    required String questionId,
    required String userAnswer,
  });

  // Analytics
  Future<ExamStatsEntity> getStats();
}
