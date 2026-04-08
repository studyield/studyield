import 'package:equatable/equatable.dart';
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

abstract class ProblemSolverState extends Equatable {
  const ProblemSolverState();

  @override
  List<Object?> get props => [];
}

class ProblemSolverInitial extends ProblemSolverState {}

class ProblemSolverLoading extends ProblemSolverState {}

// Sessions
class SessionsLoaded extends ProblemSolverState {
  final List<ProblemSessionEntity> sessions;

  const SessionsLoaded({required this.sessions});

  @override
  List<Object?> get props => [sessions];
}

class SessionLoaded extends ProblemSolverState {
  final ProblemSessionEntity session;

  const SessionLoaded({required this.session});

  @override
  List<Object?> get props => [session];
}

class SessionCreated extends ProblemSolverState {
  final ProblemSessionEntity session;

  const SessionCreated({required this.session});

  @override
  List<Object?> get props => [session];
}

class SessionSolving extends ProblemSolverState {
  final String sessionId;
  final SessionStatus status;

  const SessionSolving({
    required this.sessionId,
    required this.status,
  });

  @override
  List<Object?> get props => [sessionId, status];
}

class SessionDeleted extends ProblemSolverState {}

// Similar problems
class SimilarProblemsLoaded extends ProblemSolverState {
  final List<SimilarProblemEntity> problems;

  const SimilarProblemsLoaded({required this.problems});

  @override
  List<Object?> get props => [problems];
}

// Hints
class HintLoaded extends ProblemSolverState {
  final HintStepEntity hint;

  const HintLoaded({required this.hint});

  @override
  List<Object?> get props => [hint];
}

class HintsReset extends ProblemSolverState {}

// Chat
class ChatMessagesLoaded extends ProblemSolverState {
  final List<ChatMessageEntity> messages;

  const ChatMessagesLoaded({required this.messages});

  @override
  List<Object?> get props => [messages];
}

class ChatMessageSent extends ProblemSolverState {
  final ChatMessageEntity message;

  const ChatMessageSent({required this.message});

  @override
  List<Object?> get props => [message];
}

// Concept map
class ConceptMapLoaded extends ProblemSolverState {
  final ConceptMapEntity conceptMap;

  const ConceptMapLoaded({required this.conceptMap});

  @override
  List<Object?> get props => [conceptMap];
}

// Quiz
class PracticeQuizLoaded extends ProblemSolverState {
  final List<QuizQuestionEntity> questions;

  const PracticeQuizLoaded({required this.questions});

  @override
  List<Object?> get props => [questions];
}

class QuizAnswerSubmitted extends ProblemSolverState {
  final String questionId;
  final bool isCorrect;
  final String correctAnswer;
  final String explanation;
  final String userAnswer;

  const QuizAnswerSubmitted({
    required this.questionId,
    required this.isCorrect,
    required this.correctAnswer,
    required this.explanation,
    required this.userAnswer,
  });

  @override
  List<Object?> get props => [questionId, isCorrect, correctAnswer, explanation, userAnswer];
}

// Formula cards
class FormulaCardsLoaded extends ProblemSolverState {
  final List<FormulaCardEntity> cards;

  const FormulaCardsLoaded({required this.cards});

  @override
  List<Object?> get props => [cards];
}

// Alternative methods
class AlternativeMethodsLoaded extends ProblemSolverState {
  final List<AlternativeMethodEntity> methods;

  const AlternativeMethodsLoaded({required this.methods});

  @override
  List<Object?> get props => [methods];
}

// Code blocks
class CodeBlocksLoaded extends ProblemSolverState {
  final List<CodeBlockEntity> codeBlocks;

  const CodeBlocksLoaded({required this.codeBlocks});

  @override
  List<Object?> get props => [codeBlocks];
}

// Citations
class CitationsLoaded extends ProblemSolverState {
  final List<CitationEntity> citations;

  const CitationsLoaded({required this.citations});

  @override
  List<Object?> get props => [citations];
}

// Graph data
class GraphDataLoaded extends ProblemSolverState {
  final GraphDataEntity graphData;

  const GraphDataLoaded({required this.graphData});

  @override
  List<Object?> get props => [graphData];
}

// Explanations
class ExplanationLoaded extends ProblemSolverState {
  final ComplexityExplanationEntity explanation;
  final String level;

  const ExplanationLoaded({
    required this.explanation,
    required this.level,
  });

  @override
  List<Object?> get props => [explanation, level];
}

// Narration
class NarrationGenerating extends ProblemSolverState {
  final String sessionId;

  const NarrationGenerating({required this.sessionId});

  @override
  List<Object?> get props => [sessionId];
}

class NarrationLoaded extends ProblemSolverState {
  final NarrationEntity narration;

  const NarrationLoaded({required this.narration});

  @override
  List<Object?> get props => [narration];
}

// Bookmarks
class BookmarksLoaded extends ProblemSolverState {
  final List<ProblemSessionEntity> bookmarks;

  const BookmarksLoaded({required this.bookmarks});

  @override
  List<Object?> get props => [bookmarks];
}

class BookmarkToggled extends ProblemSolverState {
  final bool isBookmarked;

  const BookmarkToggled({required this.isBookmarked});

  @override
  List<Object?> get props => [isBookmarked];
}

// Enhanced bookmark states
class BookmarkAdded extends ProblemSolverState {
  final BookmarkEntity bookmark;

  const BookmarkAdded({required this.bookmark});

  @override
  List<Object?> get props => [bookmark];
}

class BookmarkUpdated extends ProblemSolverState {
  final BookmarkEntity bookmark;

  const BookmarkUpdated({required this.bookmark});

  @override
  List<Object?> get props => [bookmark];
}

class BookmarkDeleted extends ProblemSolverState {
  final String bookmarkId;

  const BookmarkDeleted({required this.bookmarkId});

  @override
  List<Object?> get props => [bookmarkId];
}

class BookmarksLoadedWithDetails extends ProblemSolverState {
  final List<BookmarkEntity> bookmarks;

  const BookmarksLoadedWithDetails({required this.bookmarks});

  @override
  List<Object?> get props => [bookmarks];
}

// Batch extraction
class ProblemsExtracted extends ProblemSolverState {
  final List<String> problems;

  const ProblemsExtracted({required this.problems});

  @override
  List<Object?> get props => [problems];
}

// Batch problem solver states
class BatchFileUploading extends ProblemSolverState {
  final double progress;

  const BatchFileUploading({required this.progress});

  @override
  List<Object?> get props => [progress];
}

class BatchProblemsExtracting extends ProblemSolverState {
  const BatchProblemsExtracting();
}

class BatchProblemsExtracted extends ProblemSolverState {
  final List<BatchProblemEntity> problems;
  final String extractionId;

  const BatchProblemsExtracted({
    required this.problems,
    required this.extractionId,
  });

  @override
  List<Object?> get props => [problems, extractionId];
}

class BatchSolving extends ProblemSolverState {
  final int totalProblems;
  final int solvedProblems;

  const BatchSolving({
    required this.totalProblems,
    required this.solvedProblems,
  });

  @override
  List<Object?> get props => [totalProblems, solvedProblems];
}

class BatchSolvingCompleted extends ProblemSolverState {
  final List<ProblemSessionEntity> sessions;

  const BatchSolvingCompleted({required this.sessions});

  @override
  List<Object?> get props => [sessions];
}

// OCR states
class OCRProcessing extends ProblemSolverState {
  final String imagePath;

  const OCRProcessing({required this.imagePath});

  @override
  List<Object?> get props => [imagePath];
}

class OCRTextExtracted extends ProblemSolverState {
  final String text;
  final String imagePath;
  final double confidence;

  const OCRTextExtracted({
    required this.text,
    required this.imagePath,
    required this.confidence,
  });

  @override
  List<Object?> get props => [text, imagePath, confidence];
}

// Error
class ProblemSolverError extends ProblemSolverState {
  final String message;

  const ProblemSolverError({required this.message});

  @override
  List<Object?> get props => [message];
}
