import '../../../../core/errors/error_handler.dart';
import '../../../../core/errors/failures.dart';
import '../../../../core/utils/either.dart';
import '../../domain/entities/flashcard_entity.dart';
import '../../domain/repositories/flashcards_repository.dart';
import '../datasources/flashcards_remote_datasource.dart';
import '../models/create_flashcard_request.dart';
import '../models/bulk_create_flashcards_request.dart';
import '../models/generate_flashcards_request.dart';
import '../models/import_flashcards_request.dart';
import '../models/ai_assist_request.dart';

class FlashcardsRepositoryImpl implements FlashcardsRepository {
  final FlashcardsRemoteDataSource remoteDataSource;

  FlashcardsRepositoryImpl({required this.remoteDataSource});

  @override
  Future<Either<Failure, List<FlashcardEntity>>> getFlashcardsByStudySet(
    String studySetId,
  ) async {
    try {
      final flashcards = await remoteDataSource.getFlashcardsByStudySet(studySetId);
      return Either.right(flashcards);
    } on Exception catch (e) {
      return Either.left(ErrorHandler.exceptionToFailure(e));
    }
  }

  @override
  Future<Either<Failure, FlashcardEntity>> getFlashcardById(String id) async {
    try {
      final flashcard = await remoteDataSource.getFlashcardById(id);
      return Either.right(flashcard);
    } on Exception catch (e) {
      return Either.left(ErrorHandler.exceptionToFailure(e));
    }
  }

  @override
  Future<Either<Failure, FlashcardEntity>> createFlashcard(
    CreateFlashcardRequest request,
  ) async {
    try {
      final flashcard = await remoteDataSource.createFlashcard(request);
      return Either.right(flashcard);
    } on Exception catch (e) {
      return Either.left(ErrorHandler.exceptionToFailure(e));
    }
  }

  @override
  Future<Either<Failure, List<FlashcardEntity>>> bulkCreateFlashcards(
    BulkCreateFlashcardsRequest request,
  ) async {
    try {
      final flashcards = await remoteDataSource.bulkCreateFlashcards(request);
      return Either.right(flashcards);
    } on Exception catch (e) {
      return Either.left(ErrorHandler.exceptionToFailure(e));
    }
  }

  @override
  Future<Either<Failure, List<FlashcardEntity>>> generateFlashcards(
    GenerateFlashcardsRequest request,
  ) async {
    try {
      final flashcards = await remoteDataSource.generateFlashcards(request);
      return Either.right(flashcards);
    } on Exception catch (e) {
      return Either.left(ErrorHandler.exceptionToFailure(e));
    }
  }

  @override
  Future<Either<Failure, List<FlashcardEntity>>> importFlashcards(
    ImportFlashcardsRequest request,
  ) async {
    try {
      final flashcards = await remoteDataSource.importFlashcards(request);
      return Either.right(flashcards);
    } on Exception catch (e) {
      return Either.left(ErrorHandler.exceptionToFailure(e));
    }
  }

  @override
  Future<Either<Failure, String>> assistCard(
    AiAssistRequest request,
  ) async {
    try {
      final result = await remoteDataSource.assistCard(request);
      return Either.right(result);
    } on Exception catch (e) {
      return Either.left(ErrorHandler.exceptionToFailure(e));
    }
  }

  @override
  Future<Either<Failure, FlashcardEntity>> updateFlashcard(
    String id,
    CreateFlashcardRequest request,
  ) async {
    try {
      final flashcard = await remoteDataSource.updateFlashcard(id, request);
      return Either.right(flashcard);
    } on Exception catch (e) {
      return Either.left(ErrorHandler.exceptionToFailure(e));
    }
  }

  @override
  Future<Either<Failure, List<FlashcardEntity>>> getDueFlashcardsByStudySet(
    String studySetId,
  ) async {
    try {
      final flashcards = await remoteDataSource.getDueFlashcardsByStudySet(studySetId);
      return Either.right(flashcards);
    } on Exception catch (e) {
      return Either.left(ErrorHandler.exceptionToFailure(e));
    }
  }

  @override
  Future<Either<Failure, FlashcardEntity>> reviewFlashcard(
    String id,
    int quality,
  ) async {
    try {
      final flashcard = await remoteDataSource.reviewFlashcard(id, quality);
      return Either.right(flashcard);
    } on Exception catch (e) {
      return Either.left(ErrorHandler.exceptionToFailure(e));
    }
  }

  @override
  Future<Either<Failure, void>> deleteFlashcard(String id) async {
    try {
      await remoteDataSource.deleteFlashcard(id);
      return Either.right(null);
    } on Exception catch (e) {
      return Either.left(ErrorHandler.exceptionToFailure(e));
    }
  }
}
