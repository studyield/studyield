import '../../../../core/errors/failures.dart';
import '../../../../core/utils/either.dart';
import '../entities/flashcard_entity.dart';
import '../../data/models/create_flashcard_request.dart';
import '../../data/models/bulk_create_flashcards_request.dart';
import '../../data/models/generate_flashcards_request.dart';
import '../../data/models/import_flashcards_request.dart';
import '../../data/models/ai_assist_request.dart';

abstract class FlashcardsRepository {
  Future<Either<Failure, List<FlashcardEntity>>> getFlashcardsByStudySet(String studySetId);
  Future<Either<Failure, List<FlashcardEntity>>> getDueFlashcardsByStudySet(String studySetId);
  Future<Either<Failure, FlashcardEntity>> getFlashcardById(String id);
  Future<Either<Failure, FlashcardEntity>> createFlashcard(CreateFlashcardRequest request);
  Future<Either<Failure, List<FlashcardEntity>>> bulkCreateFlashcards(BulkCreateFlashcardsRequest request);
  Future<Either<Failure, List<FlashcardEntity>>> generateFlashcards(GenerateFlashcardsRequest request);
  Future<Either<Failure, List<FlashcardEntity>>> importFlashcards(ImportFlashcardsRequest request);
  Future<Either<Failure, String>> assistCard(AiAssistRequest request);
  Future<Either<Failure, FlashcardEntity>> updateFlashcard(String id, CreateFlashcardRequest request);
  Future<Either<Failure, void>> deleteFlashcard(String id);
  Future<Either<Failure, FlashcardEntity>> reviewFlashcard(String id, int quality);
}
