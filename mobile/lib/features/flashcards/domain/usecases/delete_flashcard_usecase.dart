import '../../../../core/errors/failures.dart';
import '../../../../core/utils/either.dart';
import '../repositories/flashcards_repository.dart';

class DeleteFlashcardUseCase {
  final FlashcardsRepository repository;

  DeleteFlashcardUseCase({required this.repository});

  Future<Either<Failure, void>> call(String id) async {
    return await repository.deleteFlashcard(id);
  }
}
