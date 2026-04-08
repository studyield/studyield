import '../../../../core/errors/failures.dart';
import '../../../../core/utils/either.dart';
import '../entities/study_set_entity.dart';
import '../repositories/study_sets_repository.dart';

class GetStudySetsUseCase {
  final StudySetsRepository repository;

  GetStudySetsUseCase({required this.repository});

  Future<Either<Failure, List<StudySetEntity>>> call({
    int page = 1,
    int limit = 20,
  }) async {
    return await repository.getStudySets(page: page, limit: limit);
  }
}
