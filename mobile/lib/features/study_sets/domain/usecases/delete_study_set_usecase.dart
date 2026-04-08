import '../../../../core/errors/failures.dart';
import '../../../../core/utils/either.dart';
import '../repositories/study_sets_repository.dart';

class DeleteStudySetUseCase {
  final StudySetsRepository repository;

  DeleteStudySetUseCase({required this.repository});

  Future<Either<Failure, void>> call(String id) async {
    return await repository.deleteStudySet(id);
  }
}
