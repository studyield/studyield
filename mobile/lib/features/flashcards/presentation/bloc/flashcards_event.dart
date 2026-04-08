abstract class FlashcardsEvent {}

class LoadFlashcards extends FlashcardsEvent {
  final String studySetId;

  LoadFlashcards({required this.studySetId});
}

class CreateFlashcard extends FlashcardsEvent {
  final String studySetId;
  final String front;
  final String back;
  final String? notes;
  final List<String>? tags;

  CreateFlashcard({
    required this.studySetId,
    required this.front,
    required this.back,
    this.notes,
    this.tags,
  });
}

class UpdateFlashcard extends FlashcardsEvent {
  final String id;
  final String studySetId;
  final String front;
  final String back;
  final String? notes;
  final List<String>? tags;

  UpdateFlashcard({
    required this.id,
    required this.studySetId,
    required this.front,
    required this.back,
    this.notes,
    this.tags,
  });
}

class BulkCreateFlashcards extends FlashcardsEvent {
  final String studySetId;
  final List<FlashcardData> flashcards;

  BulkCreateFlashcards({
    required this.studySetId,
    required this.flashcards,
  });
}

class GenerateFlashcards extends FlashcardsEvent {
  final String content;
  final int? count;
  final String? cardType;
  final String? difficulty;

  GenerateFlashcards({
    required this.content,
    this.count,
    this.cardType,
    this.difficulty,
  });
}

class ImportFlashcards extends FlashcardsEvent {
  final String studySetId;
  final String source;
  final String? content;
  final String? filePath;
  final String? separator;

  ImportFlashcards({
    required this.studySetId,
    required this.source,
    this.content,
    this.filePath,
    this.separator,
  });
}

class AiAssistCard extends FlashcardsEvent {
  final String flashcardId;
  final String action;
  final String front;
  final String? back;

  AiAssistCard({
    required this.flashcardId,
    required this.action,
    required this.front,
    this.back,
  });
}

class FlashcardData {
  final String front;
  final String back;
  final String? notes;
  final List<String>? tags;
  final String? type;

  FlashcardData({
    required this.front,
    required this.back,
    this.notes,
    this.tags,
    this.type = 'standard',
  });
}

class DeleteFlashcard extends FlashcardsEvent {
  final String id;

  DeleteFlashcard({required this.id});
}

class RefreshFlashcards extends FlashcardsEvent {
  final String studySetId;

  RefreshFlashcards({required this.studySetId});
}
