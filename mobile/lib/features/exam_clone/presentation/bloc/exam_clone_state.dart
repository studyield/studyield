import 'package:equatable/equatable.dart';
import '../../domain/entities/exam_clone_entity.dart';
import '../../domain/entities/exam_question_entity.dart';
import '../../domain/entities/exam_stats_entity.dart';

abstract class ExamCloneState extends Equatable {
  const ExamCloneState();

  @override
  List<Object?> get props => [];
}

class ExamCloneInitial extends ExamCloneState {}

class ExamCloneLoading extends ExamCloneState {}

// Exams list loaded
class ExamsLoaded extends ExamCloneState {
  final List<ExamCloneEntity> exams;
  final ExamStatsEntity? stats;
  final int reviewQueueCount;

  const ExamsLoaded({
    required this.exams,
    this.stats,
    this.reviewQueueCount = 0,
  });

  @override
  List<Object?> get props => [exams, stats, reviewQueueCount];

  ExamsLoaded copyWith({
    List<ExamCloneEntity>? exams,
    ExamStatsEntity? stats,
    int? reviewQueueCount,
  }) {
    return ExamsLoaded(
      exams: exams ?? this.exams,
      stats: stats ?? this.stats,
      reviewQueueCount: reviewQueueCount ?? this.reviewQueueCount,
    );
  }
}

// Exam detail loaded
class ExamDetailLoaded extends ExamCloneState {
  final ExamCloneEntity exam;

  const ExamDetailLoaded({required this.exam});

  @override
  List<Object?> get props => [exam];
}

// Questions loaded
class QuestionsLoaded extends ExamCloneState {
  final List<ExamQuestionEntity> questions;
  final String examId;

  const QuestionsLoaded({
    required this.questions,
    required this.examId,
  });

  @override
  List<Object?> get props => [questions, examId];
}

// Review queue loaded
class ReviewQueueLoaded extends ExamCloneState {
  final List<ExamQuestionEntity> questions;

  const ReviewQueueLoaded({required this.questions});

  @override
  List<Object?> get props => [questions];
}

// Bookmarks loaded
class BookmarksLoaded extends ExamCloneState {
  final List<ExamQuestionEntity> questions;

  const BookmarksLoaded({required this.questions});

  @override
  List<Object?> get props => [questions];
}

// Exam created
class ExamCreated extends ExamCloneState {
  final ExamCloneEntity exam;

  const ExamCreated({required this.exam});

  @override
  List<Object?> get props => [exam];
}

// Exam uploaded
class ExamUploaded extends ExamCloneState {
  final ExamCloneEntity exam;

  const ExamUploaded({required this.exam});

  @override
  List<Object?> get props => [exam];
}

// Exam deleted
class ExamDeleted extends ExamCloneState {}

// Review completed
class ReviewCompleted extends ExamCloneState {}

// Bookmark toggled
class BookmarkToggled extends ExamCloneState {}

// Attempt submitted
class AttemptSubmitted extends ExamCloneState {
  final bool isCorrect;

  const AttemptSubmitted({required this.isCorrect});

  @override
  List<Object?> get props => [isCorrect];
}

// Upload progress
class ExamUploadProgress extends ExamCloneState {
  final double progress;

  const ExamUploadProgress({required this.progress});

  @override
  List<Object?> get props => [progress];
}

// Stats loaded
class StatsLoaded extends ExamCloneState {
  final ExamStatsEntity stats;

  const StatsLoaded({required this.stats});

  @override
  List<Object?> get props => [stats];
}

// Error
class ExamCloneError extends ExamCloneState {
  final String message;

  const ExamCloneError({required this.message});

  @override
  List<Object?> get props => [message];
}
