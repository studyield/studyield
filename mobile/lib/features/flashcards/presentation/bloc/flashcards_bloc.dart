import 'package:flutter_bloc/flutter_bloc.dart';
import '../../domain/usecases/get_flashcards_by_study_set_usecase.dart';
import '../../domain/usecases/create_flashcard_usecase.dart';
import '../../domain/usecases/update_flashcard_usecase.dart';
import '../../domain/usecases/delete_flashcard_usecase.dart';
import '../../domain/usecases/bulk_create_flashcards_usecase.dart';
import '../../domain/usecases/generate_flashcards_usecase.dart';
import '../../domain/usecases/import_flashcards_usecase.dart';
import '../../domain/usecases/ai_assist_card_usecase.dart';
import '../../data/models/bulk_create_flashcards_request.dart' as models;
import '../../data/models/generate_flashcards_request.dart';
import '../../data/models/import_flashcards_request.dart';
import '../../data/models/ai_assist_request.dart';
import 'flashcards_event.dart';
import 'flashcards_state.dart';

class FlashcardsBloc extends Bloc<FlashcardsEvent, FlashcardsState> {
  final GetFlashcardsByStudySetUseCase getFlashcardsByStudySetUseCase;
  final CreateFlashcardUseCase createFlashcardUseCase;
  final UpdateFlashcardUseCase updateFlashcardUseCase;
  final DeleteFlashcardUseCase deleteFlashcardUseCase;
  final BulkCreateFlashcardsUseCase bulkCreateFlashcardsUseCase;
  final GenerateFlashcardsUseCase generateFlashcardsUseCase;
  final ImportFlashcardsUseCase importFlashcardsUseCase;
  final AiAssistCardUseCase aiAssistCardUseCase;

  FlashcardsBloc({
    required this.getFlashcardsByStudySetUseCase,
    required this.createFlashcardUseCase,
    required this.updateFlashcardUseCase,
    required this.deleteFlashcardUseCase,
    required this.bulkCreateFlashcardsUseCase,
    required this.generateFlashcardsUseCase,
    required this.importFlashcardsUseCase,
    required this.aiAssistCardUseCase,
  }) : super(FlashcardsInitial()) {
    on<LoadFlashcards>(_onLoadFlashcards);
    on<CreateFlashcard>(_onCreateFlashcard);
    on<UpdateFlashcard>(_onUpdateFlashcard);
    on<BulkCreateFlashcards>(_onBulkCreateFlashcards);
    on<GenerateFlashcards>(_onGenerateFlashcards);
    on<ImportFlashcards>(_onImportFlashcards);
    on<AiAssistCard>(_onAiAssistCard);
    on<DeleteFlashcard>(_onDeleteFlashcard);
    on<RefreshFlashcards>(_onRefreshFlashcards);
  }

  Future<void> _onLoadFlashcards(
    LoadFlashcards event,
    Emitter<FlashcardsState> emit,
  ) async {
    emit(FlashcardsLoading());

    final result = await getFlashcardsByStudySetUseCase(event.studySetId);

    result.fold(
      (failure) => emit(FlashcardsError(message: failure.message)),
      (flashcards) => emit(FlashcardsLoaded(flashcards: flashcards)),
    );
  }

  Future<void> _onRefreshFlashcards(
    RefreshFlashcards event,
    Emitter<FlashcardsState> emit,
  ) async {
    final result = await getFlashcardsByStudySetUseCase(event.studySetId);

    result.fold(
      (failure) => emit(FlashcardsError(message: failure.message)),
      (flashcards) => emit(FlashcardsLoaded(flashcards: flashcards)),
    );
  }

  Future<void> _onCreateFlashcard(
    CreateFlashcard event,
    Emitter<FlashcardsState> emit,
  ) async {
    emit(FlashcardCreating());

    final result = await createFlashcardUseCase(
      studySetId: event.studySetId,
      front: event.front,
      back: event.back,
      notes: event.notes,
      tags: event.tags,
    );

    result.fold(
      (failure) => emit(FlashcardsError(message: failure.message)),
      (flashcard) => emit(FlashcardCreated(flashcard: flashcard)),
    );
  }

  Future<void> _onUpdateFlashcard(
    UpdateFlashcard event,
    Emitter<FlashcardsState> emit,
  ) async {
    emit(FlashcardUpdating());

    final result = await updateFlashcardUseCase(
      id: event.id,
      studySetId: event.studySetId,
      front: event.front,
      back: event.back,
      notes: event.notes,
      tags: event.tags,
    );

    result.fold(
      (failure) => emit(FlashcardsError(message: failure.message)),
      (flashcard) => emit(FlashcardUpdated(flashcard: flashcard)),
    );
  }

  Future<void> _onBulkCreateFlashcards(
    BulkCreateFlashcards event,
    Emitter<FlashcardsState> emit,
  ) async {
    emit(FlashcardsBulkCreating());

    // Convert event flashcards to model flashcards
    final modelFlashcards = event.flashcards
        .map((f) => models.FlashcardData(
              front: f.front,
              back: f.back,
              notes: f.notes,
              tags: f.tags,
              type: f.type,
            ))
        .toList();

    final request = models.BulkCreateFlashcardsRequest(
      studySetId: event.studySetId,
      flashcards: modelFlashcards,
    );

    final result = await bulkCreateFlashcardsUseCase(request);

    result.fold(
      (failure) => emit(FlashcardsError(message: failure.message)),
      (flashcards) => emit(FlashcardsBulkCreated(flashcards: flashcards)),
    );
  }

  Future<void> _onGenerateFlashcards(
    GenerateFlashcards event,
    Emitter<FlashcardsState> emit,
  ) async {
    emit(FlashcardsGenerating());

    final request = GenerateFlashcardsRequest(
      content: event.content,
      count: event.count,
      cardType: event.cardType,
      difficulty: event.difficulty,
    );

    final result = await generateFlashcardsUseCase(request);

    result.fold(
      (failure) => emit(FlashcardsError(message: failure.message)),
      (flashcards) => emit(FlashcardsGenerated(flashcards: flashcards)),
    );
  }

  Future<void> _onImportFlashcards(
    ImportFlashcards event,
    Emitter<FlashcardsState> emit,
  ) async {
    emit(FlashcardsImporting());

    final request = ImportFlashcardsRequest(
      studySetId: event.studySetId,
      source: event.source,
      content: event.content,
      filePath: event.filePath,
      separator: event.separator,
    );

    final result = await importFlashcardsUseCase(request);

    result.fold(
      (failure) => emit(FlashcardsError(message: failure.message)),
      (flashcards) => emit(FlashcardsImported(flashcards: flashcards)),
    );
  }

  Future<void> _onAiAssistCard(
    AiAssistCard event,
    Emitter<FlashcardsState> emit,
  ) async {
    emit(FlashcardAiAssisting());

    final request = AiAssistRequest(
      flashcardId: event.flashcardId,
      action: event.action,
      front: event.front,
      back: event.back,
    );

    final result = await aiAssistCardUseCase(request);

    result.fold(
      (failure) => emit(FlashcardsError(message: failure.message)),
      (result) => emit(FlashcardAiAssisted(result: result)),
    );
  }

  Future<void> _onDeleteFlashcard(
    DeleteFlashcard event,
    Emitter<FlashcardsState> emit,
  ) async {
    final result = await deleteFlashcardUseCase(event.id);

    result.fold(
      (failure) => emit(FlashcardsError(message: failure.message)),
      (_) => emit(FlashcardDeleted(id: event.id)),
    );
  }
}
