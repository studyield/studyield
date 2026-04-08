import '../../../../core/errors/failures.dart';
import '../../../../core/utils/either.dart';
import '../entities/study_set_entity.dart';
import '../repositories/study_sets_repository.dart';
import '../../data/models/create_study_set_request.dart';

class CreateStudySetUseCase {
  final StudySetsRepository repository;

  CreateStudySetUseCase({required this.repository});

  Future<Either<Failure, StudySetEntity>> call({
    required String title,
    String? description,
    bool? isPublic,
    List<String>? tags,
  }) async {
    final request = CreateStudySetRequest(
      title: title,
      description: description,
      isPublic: isPublic,
      tags: tags,
    );

    return await repository.createStudySet(request);
  }
}
