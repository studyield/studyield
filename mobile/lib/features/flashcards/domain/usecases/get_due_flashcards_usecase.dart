import '../../../../core/errors/failures.dart';
import '../../../../core/utils/either.dart';
import '../entities/flashcard_entity.dart';
import '../repositories/flashcards_repository.dart';

class GetDueFlashcardsUseCase {
  final FlashcardsRepository repository;

  GetDueFlashcardsUseCase({required this.repository});

  Future<Either<Failure, List<FlashcardEntity>>> call(String studySetId) async {
    return await repository.getDueFlashcardsByStudySet(studySetId);
  }
}
