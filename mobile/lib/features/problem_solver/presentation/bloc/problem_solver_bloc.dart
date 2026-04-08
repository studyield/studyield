import 'package:flutter_bloc/flutter_bloc.dart';
import '../../domain/entities/problem_session_entity.dart';
import '../../domain/entities/graph_data_entity.dart';
import '../../domain/repositories/problem_solver_repository.dart';
import 'problem_solver_event.dart';
import 'problem_solver_state.dart';

class ProblemSolverBloc extends Bloc<ProblemSolverEvent, ProblemSolverState> {
  final ProblemSolverRepository repository;

  ProblemSolverBloc({required this.repository}) : super(ProblemSolverInitial()) {
    on<CreateProblemSession>(_onCreateSession);
    on<LoadSessions>(_onLoadSessions);
    on<LoadSession>(_onLoadSession);
    on<SolveSession>(_onSolveSession);
    on<DeleteSession>(_onDeleteSession);
    on<LoadSimilarProblems>(_onLoadSimilarProblems);
    on<GetNextHint>(_onGetNextHint);
    on<ResetHints>(_onResetHints);
    on<LoadChatMessages>(_onLoadChatMessages);
    on<SendChatMessage>(_onSendChatMessage);
    on<LoadConceptMap>(_onLoadConceptMap);
    on<LoadPracticeQuiz>(_onLoadPracticeQuiz);
    on<SubmitQuizAnswer>(_onSubmitQuizAnswer);
    on<LoadFormulaCards>(_onLoadFormulaCards);
    on<LoadAlternativeMethods>(_onLoadAlternativeMethods);
    on<LoadCodeBlocks>(_onLoadCodeBlocks);
    on<LoadCitations>(_onLoadCitations);
    on<LoadGraphData>(_onLoadGraphData);
    on<LoadExplanation>(_onLoadExplanation);
    on<GenerateNarration>(_onGenerateNarration);
    on<LoadNarration>(_onLoadNarration);
    on<ToggleBookmark>(_onToggleBookmark);
    on<LoadBookmarks>(_onLoadBookmarks);
    on<ExtractProblems>(_onExtractProblems);
    on<UploadBatchFile>(_onUploadBatchFile);
    on<ExtractProblemsFromText>(_onExtractProblemsFromText);
    on<SolveBatchProblems>(_onSolveBatchProblems);
    on<SolveSingleExtractedProblem>(_onSolveSingleExtractedProblem);
    on<ProcessImageOCR>(_onProcessImageOCR);
    on<ConfirmOCRText>(_onConfirmOCRText);
    on<AddBookmark>(_onAddBookmark);
    on<UpdateBookmark>(_onUpdateBookmark);
    on<DeleteBookmark>(_onDeleteBookmark);
    on<LoadBookmarksWithFilters>(_onLoadBookmarksWithFilters);
    on<SearchBookmarks>(_onSearchBookmarks);
  }

  Future<void> _onCreateSession(
    CreateProblemSession event,
    Emitter<ProblemSolverState> emit,
  ) async {
    final currentState = state;
    if (currentState is! SessionsLoaded) {
      emit(ProblemSolverLoading());
    }

    try {
      final session = await repository.createSession(
        problem: event.problem,
        subject: event.subject,
        imageUrl: event.imageUrl,
      );
      emit(SessionCreated(session: session));
    } catch (e) {
      emit(ProblemSolverError(message: e.toString()));
    }
  }

  Future<void> _onLoadSessions(
    LoadSessions event,
    Emitter<ProblemSolverState> emit,
  ) async {
    if (state is! SessionsLoaded) {
      emit(ProblemSolverLoading());
    }

    try {
      final sessions = await repository.getSessions();
      emit(SessionsLoaded(sessions: sessions));
    } catch (e) {
      emit(ProblemSolverError(message: e.toString()));
    }
  }

  Future<void> _onLoadSession(
    LoadSession event,
    Emitter<ProblemSolverState> emit,
  ) async {
    emit(ProblemSolverLoading());

    try {
      final session = await repository.getSession(event.sessionId);
      emit(SessionLoaded(session: session));
    } catch (e) {
      emit(ProblemSolverError(message: e.toString()));
    }
  }

  Future<void> _onSolveSession(
    SolveSession event,
    Emitter<ProblemSolverState> emit,
  ) async {
    emit(SessionSolving(
      sessionId: event.sessionId,
      status: SessionStatus.analyzing,
    ));

    try {
      final session = await repository.solveSession(event.sessionId);
      emit(SessionLoaded(session: session));
    } catch (e) {
      emit(ProblemSolverError(message: e.toString()));
    }
  }

  Future<void> _onDeleteSession(
    DeleteSession event,
    Emitter<ProblemSolverState> emit,
  ) async {
    try {
      await repository.deleteSession(event.sessionId);
      emit(SessionDeleted());
    } catch (e) {
      emit(ProblemSolverError(message: e.toString()));
    }
  }

  Future<void> _onLoadSimilarProblems(
    LoadSimilarProblems event,
    Emitter<ProblemSolverState> emit,
  ) async {
    emit(ProblemSolverLoading());

    try {
      final problems = await repository.getSimilarProblems(event.sessionId);
      emit(SimilarProblemsLoaded(problems: problems));
    } catch (e) {
      emit(ProblemSolverError(message: e.toString()));
    }
  }

  Future<void> _onGetNextHint(
    GetNextHint event,
    Emitter<ProblemSolverState> emit,
  ) async {
    emit(ProblemSolverLoading());

    try {
      final hint = await repository.getNextHint(event.sessionId);
      emit(HintLoaded(hint: hint));
    } catch (e) {
      emit(ProblemSolverError(message: e.toString()));
    }
  }

  Future<void> _onResetHints(
    ResetHints event,
    Emitter<ProblemSolverState> emit,
  ) async {
    try {
      await repository.resetHints(event.sessionId);
      emit(HintsReset());
    } catch (e) {
      emit(ProblemSolverError(message: e.toString()));
    }
  }

  Future<void> _onLoadChatMessages(
    LoadChatMessages event,
    Emitter<ProblemSolverState> emit,
  ) async {
    emit(ProblemSolverLoading());

    try {
      final messages = await repository.getChatMessages(event.sessionId);
      emit(ChatMessagesLoaded(messages: messages));
    } catch (e) {
      emit(ProblemSolverError(message: e.toString()));
    }
  }

  Future<void> _onSendChatMessage(
    SendChatMessage event,
    Emitter<ProblemSolverState> emit,
  ) async {
    try {
      final message = await repository.sendChatMessage(
        event.sessionId,
        event.message,
      );
      emit(ChatMessageSent(message: message));
    } catch (e) {
      emit(ProblemSolverError(message: e.toString()));
    }
  }

  Future<void> _onLoadConceptMap(
    LoadConceptMap event,
    Emitter<ProblemSolverState> emit,
  ) async {
    emit(ProblemSolverLoading());

    try {
      final conceptMap = await repository.getConceptMap(event.sessionId);
      emit(ConceptMapLoaded(conceptMap: conceptMap));
    } catch (e) {
      emit(ProblemSolverError(message: e.toString()));
    }
  }

  Future<void> _onLoadPracticeQuiz(
    LoadPracticeQuiz event,
    Emitter<ProblemSolverState> emit,
  ) async {
    emit(ProblemSolverLoading());

    try {
      final questions = await repository.getPracticeQuiz(event.sessionId);
      emit(PracticeQuizLoaded(questions: questions));
    } catch (e) {
      emit(ProblemSolverError(message: e.toString()));
    }
  }

  Future<void> _onSubmitQuizAnswer(
    SubmitQuizAnswer event,
    Emitter<ProblemSolverState> emit,
  ) async {
    try {
      final result = await repository.submitQuizAnswer(
        event.questionId,
        event.answer,
      );
      emit(QuizAnswerSubmitted(
        questionId: event.questionId,
        isCorrect: result['isCorrect'] as bool,
        correctAnswer: result['correctAnswer'] as String,
        explanation: result['explanation'] as String,
        userAnswer: result['userAnswer'] as String,
      ));
    } catch (e) {
      emit(ProblemSolverError(message: e.toString()));
    }
  }

  Future<void> _onLoadFormulaCards(
    LoadFormulaCards event,
    Emitter<ProblemSolverState> emit,
  ) async {
    emit(ProblemSolverLoading());

    try {
      final cards = await repository.getFormulaCards(event.sessionId);
      emit(FormulaCardsLoaded(cards: cards));
    } catch (e) {
      emit(ProblemSolverError(message: e.toString()));
    }
  }

  Future<void> _onLoadAlternativeMethods(
    LoadAlternativeMethods event,
    Emitter<ProblemSolverState> emit,
  ) async {
    emit(ProblemSolverLoading());

    try {
      final methods = await repository.getAlternativeMethods(event.sessionId);
      emit(AlternativeMethodsLoaded(methods: methods));
    } catch (e) {
      emit(ProblemSolverError(message: e.toString()));
    }
  }

  Future<void> _onLoadCodeBlocks(
    LoadCodeBlocks event,
    Emitter<ProblemSolverState> emit,
  ) async {
    emit(ProblemSolverLoading());

    try {
      final codeBlocks = await repository.getCodeBlocks(event.sessionId);
      emit(CodeBlocksLoaded(codeBlocks: codeBlocks));
    } catch (e) {
      emit(ProblemSolverError(message: e.toString()));
    }
  }

  Future<void> _onLoadCitations(
    LoadCitations event,
    Emitter<ProblemSolverState> emit,
  ) async {
    emit(ProblemSolverLoading());

    try {
      final citations = await repository.getCitations(event.sessionId);
      emit(CitationsLoaded(citations: citations));
    } catch (e) {
      emit(ProblemSolverError(message: e.toString()));
    }
  }

  Future<void> _onLoadGraphData(
    LoadGraphData event,
    Emitter<ProblemSolverState> emit,
  ) async {
    emit(ProblemSolverLoading());

    try {
      final graphData = await repository.getGraphData(event.sessionId);
      emit(GraphDataLoaded(graphData: graphData));
    } catch (e) {
      // Emit empty graph data instead of error to avoid breaking UI
      emit(GraphDataLoaded(
        graphData: GraphDataEntity(
          id: event.sessionId,
          sessionId: event.sessionId,
          functions: const [],
          specialPoints: const [],
          minX: -10,
          maxX: 10,
          minY: -10,
          maxY: 10,
          createdAt: DateTime.now(),
        ),
      ));
    }
  }

  Future<void> _onLoadExplanation(
    LoadExplanation event,
    Emitter<ProblemSolverState> emit,
  ) async {
    emit(ProblemSolverLoading());

    try {
      final explanation = await repository.getExplanation(
        event.sessionId,
        event.level,
      );
      emit(ExplanationLoaded(
        explanation: explanation,
        level: event.level,
      ));
    } catch (e) {
      emit(ProblemSolverError(message: e.toString()));
    }
  }

  Future<void> _onGenerateNarration(
    GenerateNarration event,
    Emitter<ProblemSolverState> emit,
  ) async {
    emit(NarrationGenerating(sessionId: event.sessionId));

    try {
      final narration = await repository.generateNarration(event.sessionId);
      emit(NarrationLoaded(narration: narration));
    } catch (e) {
      emit(ProblemSolverError(message: e.toString()));
    }
  }

  Future<void> _onLoadNarration(
    LoadNarration event,
    Emitter<ProblemSolverState> emit,
  ) async {
    emit(ProblemSolverLoading());

    try {
      final narration = await repository.getNarration(event.sessionId);
      emit(NarrationLoaded(narration: narration));
    } catch (e) {
      emit(ProblemSolverError(message: e.toString()));
    }
  }

  Future<void> _onToggleBookmark(
    ToggleBookmark event,
    Emitter<ProblemSolverState> emit,
  ) async {
    try {
      await repository.toggleBookmark(event.sessionId);
      final isBookmarked = await repository.getBookmarkStatus(event.sessionId);
      emit(BookmarkToggled(isBookmarked: isBookmarked));
    } catch (e) {
      emit(ProblemSolverError(message: e.toString()));
    }
  }

  Future<void> _onLoadBookmarks(
    LoadBookmarks event,
    Emitter<ProblemSolverState> emit,
  ) async {
    emit(ProblemSolverLoading());

    try {
      final bookmarks = await repository.getBookmarks();
      emit(BookmarksLoaded(bookmarks: bookmarks));
    } catch (e) {
      emit(ProblemSolverError(message: e.toString()));
    }
  }

  Future<void> _onExtractProblems(
    ExtractProblems event,
    Emitter<ProblemSolverState> emit,
  ) async {
    emit(ProblemSolverLoading());

    try {
      final problems = await repository.extractProblems(event.text);
      emit(ProblemsExtracted(problems: problems));
    } catch (e) {
      emit(ProblemSolverError(message: e.toString()));
    }
  }

  Future<void> _onUploadBatchFile(
    UploadBatchFile event,
    Emitter<ProblemSolverState> emit,
  ) async {
    emit(const BatchFileUploading(progress: 0.0));

    try {
      // Simulate upload progress
      emit(const BatchFileUploading(progress: 0.5));

      final problems = await repository.uploadPdfFile(event.filePath);

      emit(BatchProblemsExtracted(
        problems: problems,
        extractionId: 'extraction_${DateTime.now().millisecondsSinceEpoch}',
      ));
    } catch (e) {
      emit(ProblemSolverError(message: e.toString()));
    }
  }

  Future<void> _onExtractProblemsFromText(
    ExtractProblemsFromText event,
    Emitter<ProblemSolverState> emit,
  ) async {
    emit(const BatchProblemsExtracting());

    try {
      final problems = await repository.extractProblemsFromText(event.text);

      emit(BatchProblemsExtracted(
        problems: problems,
        extractionId: 'extraction_${DateTime.now().millisecondsSinceEpoch}',
      ));
    } catch (e) {
      emit(ProblemSolverError(message: e.toString()));
    }
  }

  Future<void> _onSolveBatchProblems(
    SolveBatchProblems event,
    Emitter<ProblemSolverState> emit,
  ) async {
    emit(BatchSolving(
      totalProblems: event.problemIndices.length,
      solvedProblems: 0,
    ));

    try {
      final sessions = await repository.solveBatchProblems(
        event.extractionId,
        event.problemIndices,
      );

      emit(BatchSolvingCompleted(sessions: sessions));
    } catch (e) {
      emit(ProblemSolverError(message: e.toString()));
    }
  }

  Future<void> _onSolveSingleExtractedProblem(
    SolveSingleExtractedProblem event,
    Emitter<ProblemSolverState> emit,
  ) async {
    emit(const BatchSolving(totalProblems: 1, solvedProblems: 0));

    try {
      final sessions = await repository.solveBatchProblems(
        event.extractionId,
        [event.problemIndex],
      );

      if (sessions.isNotEmpty) {
        emit(SessionCreated(session: sessions.first));
      }
    } catch (e) {
      emit(ProblemSolverError(message: e.toString()));
    }
  }

  Future<void> _onProcessImageOCR(
    ProcessImageOCR event,
    Emitter<ProblemSolverState> emit,
  ) async {
    emit(OCRProcessing(imagePath: event.imagePath));

    try {
      // This would call ML Kit text recognition in a real implementation
      // For now, we'll simulate OCR processing
      await Future.delayed(const Duration(seconds: 2));

      // Simulated extracted text (in real app, use google_mlkit_text_recognition)
      const extractedText = 'Sample extracted text from image';
      const confidence = 0.85;

      emit(OCRTextExtracted(
        text: extractedText,
        imagePath: event.imagePath,
        confidence: confidence,
      ));
    } catch (e) {
      emit(ProblemSolverError(message: e.toString()));
    }
  }

  Future<void> _onConfirmOCRText(
    ConfirmOCRText event,
    Emitter<ProblemSolverState> emit,
  ) async {
    emit(ProblemSolverLoading());

    try {
      final session = await repository.createSession(
        problem: event.text,
        subject: event.subject,
      );

      emit(SessionCreated(session: session));
    } catch (e) {
      emit(ProblemSolverError(message: e.toString()));
    }
  }

  Future<void> _onAddBookmark(
    AddBookmark event,
    Emitter<ProblemSolverState> emit,
  ) async {
    try {
      final bookmark = await repository.addBookmark(
        sessionId: event.sessionId,
        tags: event.tags,
        notes: event.notes,
      );

      emit(BookmarkAdded(bookmark: bookmark));
    } catch (e) {
      emit(ProblemSolverError(message: e.toString()));
    }
  }

  Future<void> _onUpdateBookmark(
    UpdateBookmark event,
    Emitter<ProblemSolverState> emit,
  ) async {
    try {
      final bookmark = await repository.updateBookmark(
        bookmarkId: event.bookmarkId,
        tags: event.tags,
        notes: event.notes,
      );

      emit(BookmarkUpdated(bookmark: bookmark));
    } catch (e) {
      emit(ProblemSolverError(message: e.toString()));
    }
  }

  Future<void> _onDeleteBookmark(
    DeleteBookmark event,
    Emitter<ProblemSolverState> emit,
  ) async {
    try {
      await repository.deleteBookmark(event.bookmarkId);

      emit(BookmarkDeleted(bookmarkId: event.bookmarkId));
    } catch (e) {
      emit(ProblemSolverError(message: e.toString()));
    }
  }

  Future<void> _onLoadBookmarksWithFilters(
    LoadBookmarksWithFilters event,
    Emitter<ProblemSolverState> emit,
  ) async {
    emit(ProblemSolverLoading());

    try {
      final bookmarks = await repository.getBookmarksWithFilters(
        tags: event.tags,
        searchQuery: event.searchQuery,
      );

      emit(BookmarksLoadedWithDetails(bookmarks: bookmarks));
    } catch (e) {
      emit(ProblemSolverError(message: e.toString()));
    }
  }

  Future<void> _onSearchBookmarks(
    SearchBookmarks event,
    Emitter<ProblemSolverState> emit,
  ) async {
    emit(ProblemSolverLoading());

    try {
      final bookmarks = await repository.getBookmarksWithFilters(
        searchQuery: event.query,
      );

      emit(BookmarksLoadedWithDetails(bookmarks: bookmarks));
    } catch (e) {
      emit(ProblemSolverError(message: e.toString()));
    }
  }
}
