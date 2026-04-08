import '../../../../core/errors/failures.dart';
import '../../../../core/utils/either.dart';
import '../entities/flashcard_entity.dart';
import '../repositories/flashcards_repository.dart';
import '../../data/models/import_flashcards_request.dart';

class ImportFlashcardsUseCase {
  final FlashcardsRepository repository;

  ImportFlashcardsUseCase({required this.repository});

  Future<Either<Failure, List<FlashcardEntity>>> call(
    ImportFlashcardsRequest request,
  ) async {
    return await repository.importFlashcards(request);
  }
}
