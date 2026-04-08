import '../../../../core/errors/failures.dart';
import '../../../../core/utils/either.dart';
import '../entities/flashcard_entity.dart';
import '../repositories/flashcards_repository.dart';

class ReviewFlashcardUseCase {
  final FlashcardsRepository repository;

  ReviewFlashcardUseCase({required this.repository});

  Future<Either<Failure, FlashcardEntity>> call({
    required String flashcardId,
    required int quality,
  }) async {
    return await repository.reviewFlashcard(flashcardId, quality);
  }
}
