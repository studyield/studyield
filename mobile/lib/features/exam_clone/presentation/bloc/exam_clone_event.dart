import 'package:equatable/equatable.dart';

abstract class ExamCloneEvent extends Equatable {
  const ExamCloneEvent();

  @override
  List<Object?> get props => [];
}

// Load exams
class LoadExams extends ExamCloneEvent {
  const LoadExams();
}

// Load exam detail
class LoadExamDetail extends ExamCloneEvent {
  final String examId;

  const LoadExamDetail({required this.examId});

  @override
  List<Object?> get props => [examId];
}

// Create exam
class CreateExam extends ExamCloneEvent {
  final String title;
  final String? subject;
  final String? examText;
  final String? filePath;

  const CreateExam({
    required this.title,
    this.subject,
    this.examText,
    this.filePath,
  });

  @override
  List<Object?> get props => [title, subject, examText, filePath];
}

// Upload exam file
class UploadExamFile extends ExamCloneEvent {
  final String examId;
  final String filePath;

  const UploadExamFile({
    required this.examId,
    required this.filePath,
  });

  @override
  List<Object?> get props => [examId, filePath];
}

// Delete exam
class DeleteExam extends ExamCloneEvent {
  final String examId;

  const DeleteExam({required this.examId});

  @override
  List<Object?> get props => [examId];
}

// Load questions
class LoadQuestions extends ExamCloneEvent {
  final String examId;

  const LoadQuestions({required this.examId});

  @override
  List<Object?> get props => [examId];
}

// Load review queue
class LoadReviewQueue extends ExamCloneEvent {
  const LoadReviewQueue();
}

// Complete review
class CompleteReview extends ExamCloneEvent {
  final String questionId;
  final String quality;

  const CompleteReview({
    required this.questionId,
    required this.quality,
  });

  @override
  List<Object?> get props => [questionId, quality];
}

// Load bookmarks
class LoadBookmarks extends ExamCloneEvent {
  const LoadBookmarks();
}

// Toggle bookmark
class ToggleBookmark extends ExamCloneEvent {
  final String questionId;

  const ToggleBookmark({required this.questionId});

  @override
  List<Object?> get props => [questionId];
}

// Submit attempt
class SubmitAttempt extends ExamCloneEvent {
  final String examId;
  final String questionId;
  final String userAnswer;

  const SubmitAttempt({
    required this.examId,
    required this.questionId,
    required this.userAnswer,
  });

  @override
  List<Object?> get props => [examId, questionId, userAnswer];
}

// Load stats
class LoadStats extends ExamCloneEvent {
  const LoadStats();
}

// Refresh review queue count
class RefreshReviewQueueCount extends ExamCloneEvent {
  const RefreshReviewQueueCount();
}
