import '../../../../core/errors/failures.dart';
import '../../../../core/utils/either.dart';
import '../entities/study_set_entity.dart';
import '../repositories/study_sets_repository.dart';

class GetStudySetByIdUseCase {
  final StudySetsRepository repository;

  GetStudySetByIdUseCase({required this.repository});

  Future<Either<Failure, StudySetEntity>> call(String id) async {
    return await repository.getStudySetById(id);
  }
}
