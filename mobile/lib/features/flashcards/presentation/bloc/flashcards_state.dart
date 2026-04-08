import '../../domain/entities/flashcard_entity.dart';

abstract class FlashcardsState {}

class FlashcardsInitial extends FlashcardsState {}

class FlashcardsLoading extends FlashcardsState {}

class FlashcardsLoaded extends FlashcardsState {
  final List<FlashcardEntity> flashcards;

  FlashcardsLoaded({required this.flashcards});
}

class FlashcardsError extends FlashcardsState {
  final String message;

  FlashcardsError({required this.message});
}

class FlashcardCreating extends FlashcardsState {}

class FlashcardCreated extends FlashcardsState {
  final FlashcardEntity flashcard;

  FlashcardCreated({required this.flashcard});
}

class FlashcardUpdating extends FlashcardsState {}

class FlashcardUpdated extends FlashcardsState {
  final FlashcardEntity flashcard;

  FlashcardUpdated({required this.flashcard});
}

class FlashcardsBulkCreating extends FlashcardsState {}

class FlashcardsBulkCreated extends FlashcardsState {
  final List<FlashcardEntity> flashcards;

  FlashcardsBulkCreated({required this.flashcards});
}

class FlashcardsGenerating extends FlashcardsState {}

class FlashcardsGenerated extends FlashcardsState {
  final List<FlashcardEntity> flashcards;

  FlashcardsGenerated({required this.flashcards});
}

class FlashcardsImporting extends FlashcardsState {}

class FlashcardsImported extends FlashcardsState {
  final List<FlashcardEntity> flashcards;

  FlashcardsImported({required this.flashcards});
}

class FlashcardAiAssisting extends FlashcardsState {}

class FlashcardAiAssisted extends FlashcardsState {
  final String result;

  FlashcardAiAssisted({required this.result});
}

class FlashcardDeleted extends FlashcardsState {
  final String id;

  FlashcardDeleted({required this.id});
}
