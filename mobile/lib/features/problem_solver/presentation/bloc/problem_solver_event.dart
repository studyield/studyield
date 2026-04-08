import 'package:equatable/equatable.dart';

abstract class ProblemSolverEvent extends Equatable {
  const ProblemSolverEvent();

  @override
  List<Object?> get props => [];
}

// Session events
class CreateProblemSession extends ProblemSolverEvent {
  final String problem;
  final String? subject;
  final String? imageUrl;

  const CreateProblemSession({
    required this.problem,
    this.subject,
    this.imageUrl,
  });

  @override
  List<Object?> get props => [problem, subject, imageUrl];
}

class LoadSessions extends ProblemSolverEvent {
  const LoadSessions();
}

class LoadSession extends ProblemSolverEvent {
  final String sessionId;

  const LoadSession({required this.sessionId});

  @override
  List<Object?> get props => [sessionId];
}

class SolveSession extends ProblemSolverEvent {
  final String sessionId;

  const SolveSession({required this.sessionId});

  @override
  List<Object?> get props => [sessionId];
}

class DeleteSession extends ProblemSolverEvent {
  final String sessionId;

  const DeleteSession({required this.sessionId});

  @override
  List<Object?> get props => [sessionId];
}

// Learning features
class LoadSimilarProblems extends ProblemSolverEvent {
  final String sessionId;

  const LoadSimilarProblems({required this.sessionId});

  @override
  List<Object?> get props => [sessionId];
}

class GetNextHint extends ProblemSolverEvent {
  final String sessionId;

  const GetNextHint({required this.sessionId});

  @override
  List<Object?> get props => [sessionId];
}

class ResetHints extends ProblemSolverEvent {
  final String sessionId;

  const ResetHints({required this.sessionId});

  @override
  List<Object?> get props => [sessionId];
}

class LoadChatMessages extends ProblemSolverEvent {
  final String sessionId;

  const LoadChatMessages({required this.sessionId});

  @override
  List<Object?> get props => [sessionId];
}

class SendChatMessage extends ProblemSolverEvent {
  final String sessionId;
  final String message;

  const SendChatMessage({
    required this.sessionId,
    required this.message,
  });

  @override
  List<Object?> get props => [sessionId, message];
}

class LoadConceptMap extends ProblemSolverEvent {
  final String sessionId;

  const LoadConceptMap({required this.sessionId});

  @override
  List<Object?> get props => [sessionId];
}

class LoadPracticeQuiz extends ProblemSolverEvent {
  final String sessionId;

  const LoadPracticeQuiz({required this.sessionId});

  @override
  List<Object?> get props => [sessionId];
}

class SubmitQuizAnswer extends ProblemSolverEvent {
  final String questionId;
  final String answer;

  const SubmitQuizAnswer({
    required this.questionId,
    required this.answer,
  });

  @override
  List<Object?> get props => [questionId, answer];
}

class LoadFormulaCards extends ProblemSolverEvent {
  final String sessionId;

  const LoadFormulaCards({required this.sessionId});

  @override
  List<Object?> get props => [sessionId];
}

class LoadAlternativeMethods extends ProblemSolverEvent {
  final String sessionId;

  const LoadAlternativeMethods({required this.sessionId});

  @override
  List<Object?> get props => [sessionId];
}

class LoadCodeBlocks extends ProblemSolverEvent {
  final String sessionId;

  const LoadCodeBlocks({required this.sessionId});

  @override
  List<Object?> get props => [sessionId];
}

class LoadCitations extends ProblemSolverEvent {
  final String sessionId;

  const LoadCitations({required this.sessionId});

  @override
  List<Object?> get props => [sessionId];
}

class LoadGraphData extends ProblemSolverEvent {
  final String sessionId;

  const LoadGraphData({required this.sessionId});

  @override
  List<Object?> get props => [sessionId];
}

class LoadExplanation extends ProblemSolverEvent {
  final String sessionId;
  final String level; // 'eli5', 'beginner', 'intermediate', 'advanced'

  const LoadExplanation({
    required this.sessionId,
    required this.level,
  });

  @override
  List<Object?> get props => [sessionId, level];
}

class GenerateNarration extends ProblemSolverEvent {
  final String sessionId;

  const GenerateNarration({required this.sessionId});

  @override
  List<Object?> get props => [sessionId];
}

class LoadNarration extends ProblemSolverEvent {
  final String sessionId;

  const LoadNarration({required this.sessionId});

  @override
  List<Object?> get props => [sessionId];
}

class ToggleBookmark extends ProblemSolverEvent {
  final String sessionId;

  const ToggleBookmark({required this.sessionId});

  @override
  List<Object?> get props => [sessionId];
}

class LoadBookmarks extends ProblemSolverEvent {
  const LoadBookmarks();
}

// Enhanced bookmark events
class AddBookmark extends ProblemSolverEvent {
  final String sessionId;
  final List<String> tags;
  final String? notes;

  const AddBookmark({
    required this.sessionId,
    this.tags = const [],
    this.notes,
  });

  @override
  List<Object?> get props => [sessionId, tags, notes];
}

class UpdateBookmark extends ProblemSolverEvent {
  final String bookmarkId;
  final List<String>? tags;
  final String? notes;

  const UpdateBookmark({
    required this.bookmarkId,
    this.tags,
    this.notes,
  });

  @override
  List<Object?> get props => [bookmarkId, tags, notes];
}

class DeleteBookmark extends ProblemSolverEvent {
  final String bookmarkId;

  const DeleteBookmark({required this.bookmarkId});

  @override
  List<Object?> get props => [bookmarkId];
}

class LoadBookmarksWithFilters extends ProblemSolverEvent {
  final List<String>? tags;
  final String? searchQuery;

  const LoadBookmarksWithFilters({
    this.tags,
    this.searchQuery,
  });

  @override
  List<Object?> get props => [tags, searchQuery];
}

class SearchBookmarks extends ProblemSolverEvent {
  final String query;

  const SearchBookmarks({required this.query});

  @override
  List<Object?> get props => [query];
}

class ExtractProblems extends ProblemSolverEvent {
  final String text;

  const ExtractProblems({required this.text});

  @override
  List<Object?> get props => [text];
}

// Batch problem solver events
class UploadBatchFile extends ProblemSolverEvent {
  final String filePath;
  final String fileType;

  const UploadBatchFile({
    required this.filePath,
    required this.fileType,
  });

  @override
  List<Object?> get props => [filePath, fileType];
}

class ExtractProblemsFromText extends ProblemSolverEvent {
  final String text;

  const ExtractProblemsFromText({required this.text});

  @override
  List<Object?> get props => [text];
}

class SolveBatchProblems extends ProblemSolverEvent {
  final String extractionId;
  final List<int> problemIndices;

  const SolveBatchProblems({
    required this.extractionId,
    required this.problemIndices,
  });

  @override
  List<Object?> get props => [extractionId, problemIndices];
}

class SolveSingleExtractedProblem extends ProblemSolverEvent {
  final String extractionId;
  final int problemIndex;

  const SolveSingleExtractedProblem({
    required this.extractionId,
    required this.problemIndex,
  });

  @override
  List<Object?> get props => [extractionId, problemIndex];
}

// Camera OCR events
class ProcessImageOCR extends ProblemSolverEvent {
  final String imagePath;

  const ProcessImageOCR({required this.imagePath});

  @override
  List<Object?> get props => [imagePath];
}

class ConfirmOCRText extends ProblemSolverEvent {
  final String text;
  final String? subject;

  const ConfirmOCRText({
    required this.text,
    this.subject,
  });

  @override
  List<Object?> get props => [text, subject];
}
