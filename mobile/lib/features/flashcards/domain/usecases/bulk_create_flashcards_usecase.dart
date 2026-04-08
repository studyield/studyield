import '../../../../core/errors/failures.dart';
import '../../../../core/utils/either.dart';
import '../entities/flashcard_entity.dart';
import '../repositories/flashcards_repository.dart';
import '../../data/models/bulk_create_flashcards_request.dart';

class BulkCreateFlashcardsUseCase {
  final FlashcardsRepository repository;

  BulkCreateFlashcardsUseCase({required this.repository});

  Future<Either<Failure, List<FlashcardEntity>>> call(
    BulkCreateFlashcardsRequest request,
  ) async {
    return await repository.bulkCreateFlashcards(request);
  }
}
