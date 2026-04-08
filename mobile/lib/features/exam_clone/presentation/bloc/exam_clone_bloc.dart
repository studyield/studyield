import 'package:flutter_bloc/flutter_bloc.dart';
import '../../domain/entities/exam_clone_entity.dart';
import '../../domain/entities/exam_stats_entity.dart';
import '../../domain/repositories/exam_clone_repository.dart';
import 'exam_clone_event.dart';
import 'exam_clone_state.dart';

class ExamCloneBloc extends Bloc<ExamCloneEvent, ExamCloneState> {
  final ExamCloneRepository repository;

  ExamCloneBloc({required this.repository}) : super(ExamCloneInitial()) {
    on<LoadExams>(_onLoadExams);
    on<LoadExamDetail>(_onLoadExamDetail);
    on<CreateExam>(_onCreateExam);
    on<UploadExamFile>(_onUploadExamFile);
    on<DeleteExam>(_onDeleteExam);
    on<LoadQuestions>(_onLoadQuestions);
    on<LoadReviewQueue>(_onLoadReviewQueue);
    on<CompleteReview>(_onCompleteReview);
    on<LoadBookmarks>(_onLoadBookmarks);
    on<ToggleBookmark>(_onToggleBookmark);
    on<SubmitAttempt>(_onSubmitAttempt);
    on<LoadStats>(_onLoadStats);
    on<RefreshReviewQueueCount>(_onRefreshReviewQueueCount);
  }

  Future<void> _onLoadExams(LoadExams event, Emitter<ExamCloneState> emit) async {
    final currentState = state;

    // Only show loading on initial load, not on refresh
    if (currentState is! ExamsLoaded) {
      emit(ExamCloneLoading());
    }

    try {
      final exams = await repository.getExams();
      // Compute stats from exams list directly (avoid redundant getExams call)
      int reviewQueueCount = 0;
      try {
        final reviewQueue = await repository.getReviewQueue();
        reviewQueueCount = reviewQueue.length;
      } catch (_) {}

      final stats = ExamStatsEntity(
        totalExams: exams.length,
        totalOriginalQuestions: exams.fold(0, (sum, exam) => sum + exam.originalQuestionCount),
        totalGeneratedQuestions: exams.fold(0, (sum, exam) => sum + exam.generatedQuestionCount),
        readyToPractice: exams.where((exam) => exam.status == ExamCloneStatus.completed).length,
        reviewQueueCount: reviewQueueCount,
      );

      emit(ExamsLoaded(
        exams: exams,
        stats: stats,
        reviewQueueCount: reviewQueueCount,
      ));
    } catch (e) {
      emit(ExamCloneError(message: e.toString()));
    }
  }

  Future<void> _onLoadExamDetail(
      LoadExamDetail event, Emitter<ExamCloneState> emit) async {
    emit(ExamCloneLoading());
    try {
      final exam = await repository.getExamById(event.examId);
      emit(ExamDetailLoaded(exam: exam));
    } catch (e) {
      emit(ExamCloneError(message: e.toString()));
    }
  }

  Future<void> _onCreateExam(CreateExam event, Emitter<ExamCloneState> emit) async {
    final currentState = state;

    try {
      // Step 1: Create exam (like web: POST /exam-clones)
      print('📝 Step 1: Creating exam...');
      final exam = await repository.createExam(
        title: event.title,
        subject: event.subject,
        examText: event.examText,
      );
      print('✅ Step 1 complete: Exam created with ID: ${exam.id}');

      // Step 2: Upload file if provided (like web: POST /exam-clones/{id}/upload)
      if (event.filePath != null) {
        print('📤 Step 2: Uploading file for exam ${exam.id}...');
        final updatedExam = await repository.uploadExamFile(
          examId: exam.id,
          filePath: event.filePath!,
        );
        print('✅ Step 2 complete: File uploaded');

        // Step 3: Add to list with uploaded exam (like web: optimistic update)
        if (currentState is ExamsLoaded) {
          emit(currentState.copyWith(
            exams: [updatedExam, ...currentState.exams],
          ));
        } else {
          final exams = await repository.getExams();
          final stats = await repository.getStats();
          emit(ExamsLoaded(
            exams: exams,
            stats: stats,
            reviewQueueCount: stats.reviewQueueCount,
          ));
        }
      } else {
        // Text mode - add to list immediately
        if (currentState is ExamsLoaded) {
          emit(currentState.copyWith(
            exams: [exam, ...currentState.exams],
          ));
        } else {
          final exams = await repository.getExams();
          final stats = await repository.getStats();
          emit(ExamsLoaded(
            exams: exams,
            stats: stats,
            reviewQueueCount: stats.reviewQueueCount,
          ));
        }
      }
    } catch (e) {
      print('❌ Upload failed: $e');
      emit(ExamCloneError(message: e.toString()));
    }
  }

  Future<void> _onUploadExamFile(
      UploadExamFile event, Emitter<ExamCloneState> emit) async {
    // DON'T emit progress states that trigger full screen changes
    try {
      final exam = await repository.uploadExamFile(
        examId: event.examId,
        filePath: event.filePath,
      );

      emit(ExamUploaded(exam: exam));
    } catch (e) {
      emit(ExamCloneError(message: e.toString()));
    }
  }

  Future<void> _onDeleteExam(DeleteExam event, Emitter<ExamCloneState> emit) async {
    final currentState = state;

    try {
      await repository.deleteExam(event.examId);

      // Remove from existing list (like web - optimistic update)
      if (currentState is ExamsLoaded) {
        final updatedExams = currentState.exams
            .where((exam) => exam.id != event.examId)
            .toList();

        emit(currentState.copyWith(exams: updatedExams));
      }
    } catch (e) {
      emit(ExamCloneError(message: e.toString()));
    }
  }

  Future<void> _onLoadQuestions(
      LoadQuestions event, Emitter<ExamCloneState> emit) async {
    // Don't emit Loading here to avoid overriding ExamDetailLoaded state
    // which causes the AppBar title to disappear
    try {
      final questions = await repository.getQuestions(event.examId);
      emit(QuestionsLoaded(questions: questions, examId: event.examId));
    } catch (e) {
      emit(ExamCloneError(message: e.toString()));
    }
  }

  Future<void> _onLoadReviewQueue(
      LoadReviewQueue event, Emitter<ExamCloneState> emit) async {
    emit(ExamCloneLoading());
    try {
      final questions = await repository.getReviewQueue();
      emit(ReviewQueueLoaded(questions: questions));
    } catch (e) {
      emit(ExamCloneError(message: e.toString()));
    }
  }

  Future<void> _onCompleteReview(
      CompleteReview event, Emitter<ExamCloneState> emit) async {
    try {
      await repository.completeReview(
        questionId: event.questionId,
        quality: event.quality,
      );
      emit(ReviewCompleted());
    } catch (e) {
      emit(ExamCloneError(message: e.toString()));
    }
  }

  Future<void> _onLoadBookmarks(
      LoadBookmarks event, Emitter<ExamCloneState> emit) async {
    emit(ExamCloneLoading());
    try {
      final questions = await repository.getBookmarks();
      emit(BookmarksLoaded(questions: questions));
    } catch (e) {
      emit(ExamCloneError(message: e.toString()));
    }
  }

  Future<void> _onToggleBookmark(
      ToggleBookmark event, Emitter<ExamCloneState> emit) async {
    try {
      await repository.toggleBookmark(event.questionId);
      emit(BookmarkToggled());
    } catch (e) {
      emit(ExamCloneError(message: e.toString()));
    }
  }

  Future<void> _onSubmitAttempt(
      SubmitAttempt event, Emitter<ExamCloneState> emit) async {
    try {
      await repository.submitAttempt(
        examId: event.examId,
        questionId: event.questionId,
        userAnswer: event.userAnswer,
      );
      // You could fetch the question to check if answer is correct
      emit(const AttemptSubmitted(isCorrect: true));
    } catch (e) {
      emit(ExamCloneError(message: e.toString()));
    }
  }

  Future<void> _onLoadStats(LoadStats event, Emitter<ExamCloneState> emit) async {
    try {
      final stats = await repository.getStats();
      emit(StatsLoaded(stats: stats));
    } catch (e) {
      emit(ExamCloneError(message: e.toString()));
    }
  }

  Future<void> _onRefreshReviewQueueCount(
      RefreshReviewQueueCount event, Emitter<ExamCloneState> emit) async {
    try {
      if (state is ExamsLoaded) {
        final currentState = state as ExamsLoaded;
        final reviewQueue = await repository.getReviewQueue();
        emit(currentState.copyWith(reviewQueueCount: reviewQueue.length));
      }
    } catch (e) {
      // Silent fail for background refresh
    }
  }
}
