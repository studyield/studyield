import '../../../../core/errors/failures.dart';
import '../../../../core/utils/either.dart';
import '../entities/flashcard_entity.dart';
import '../repositories/flashcards_repository.dart';
import '../../data/models/create_flashcard_request.dart';

class CreateFlashcardUseCase {
  final FlashcardsRepository repository;

  CreateFlashcardUseCase({required this.repository});

  Future<Either<Failure, FlashcardEntity>> call({
    required String studySetId,
    required String front,
    required String back,
    String? notes,
    List<String>? tags,
  }) async {
    final request = CreateFlashcardRequest(
      studySetId: studySetId,
      front: front,
      back: back,
      notes: notes,
      tags: tags,
    );

    return await repository.createFlashcard(request);
  }
}
