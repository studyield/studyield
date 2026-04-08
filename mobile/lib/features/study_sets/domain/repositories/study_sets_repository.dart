import '../../../../core/errors/failures.dart';
import '../../../../core/utils/either.dart';
import '../entities/study_set_entity.dart';
import '../../data/models/create_study_set_request.dart';

abstract class StudySetsRepository {
  Future<Either<Failure, List<StudySetEntity>>> getStudySets({int page = 1, int limit = 20});
  Future<Either<Failure, StudySetEntity>> getStudySetById(String id);
  Future<Either<Failure, StudySetEntity>> createStudySet(CreateStudySetRequest request);
  Future<Either<Failure, StudySetEntity>> updateStudySet(String id, CreateStudySetRequest request);
  Future<Either<Failure, void>> deleteStudySet(String id);
}
