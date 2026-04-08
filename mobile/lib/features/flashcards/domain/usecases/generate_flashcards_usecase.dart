import '../../../../core/errors/failures.dart';
import '../../../../core/utils/either.dart';
import '../entities/flashcard_entity.dart';
import '../repositories/flashcards_repository.dart';
import '../../data/models/generate_flashcards_request.dart';

class GenerateFlashcardsUseCase {
  final FlashcardsRepository repository;

  GenerateFlashcardsUseCase({required this.repository});

  Future<Either<Failure, List<FlashcardEntity>>> call(
    GenerateFlashcardsRequest request,
  ) async {
    return await repository.generateFlashcards(request);
  }
}
