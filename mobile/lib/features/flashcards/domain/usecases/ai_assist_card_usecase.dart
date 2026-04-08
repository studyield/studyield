import '../../../../core/errors/failures.dart';
import '../../../../core/utils/either.dart';
import '../repositories/flashcards_repository.dart';
import '../../data/models/ai_assist_request.dart';

class AiAssistCardUseCase {
  final FlashcardsRepository repository;

  AiAssistCardUseCase({required this.repository});

  Future<Either<Failure, String>> call(
    AiAssistRequest request,
  ) async {
    return await repository.assistCard(request);
  }
}
