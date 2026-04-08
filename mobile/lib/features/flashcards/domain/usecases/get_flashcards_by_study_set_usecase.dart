import '../../../../core/errors/failures.dart';
import '../../../../core/utils/either.dart';
import '../entities/flashcard_entity.dart';
import '../repositories/flashcards_repository.dart';

class GetFlashcardsByStudySetUseCase {
  final FlashcardsRepository repository;

  GetFlashcardsByStudySetUseCase({required this.repository});

  Future<Either<Failure, List<FlashcardEntity>>> call(String studySetId) async {
    return await repository.getFlashcardsByStudySet(studySetId);
  }
}
