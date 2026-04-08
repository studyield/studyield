import '../../../../core/errors/error_handler.dart';
import '../../../../core/errors/failures.dart';
import '../../../../core/utils/either.dart';
import '../../domain/entities/study_set_entity.dart';
import '../../domain/repositories/study_sets_repository.dart';
import '../datasources/study_sets_remote_datasource.dart';
import '../models/create_study_set_request.dart';

class StudySetsRepositoryImpl implements StudySetsRepository {
  final StudySetsRemoteDataSource remoteDataSource;

  StudySetsRepositoryImpl({required this.remoteDataSource});

  @override
  Future<Either<Failure, List<StudySetEntity>>> getStudySets({
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final studySets = await remoteDataSource.getStudySets(
        page: page,
        limit: limit,
      );
      return Either.right(studySets);
    } on Exception catch (e) {
      return Either.left(ErrorHandler.exceptionToFailure(e));
    }
  }

  @override
  Future<Either<Failure, StudySetEntity>> getStudySetById(String id) async {
    try {
      final studySet = await remoteDataSource.getStudySetById(id);
      return Either.right(studySet);
    } on Exception catch (e) {
      return Either.left(ErrorHandler.exceptionToFailure(e));
    }
  }

  @override
  Future<Either<Failure, StudySetEntity>> createStudySet(
    CreateStudySetRequest request,
  ) async {
    try {
      final studySet = await remoteDataSource.createStudySet(request);
      return Either.right(studySet);
    } on Exception catch (e) {
      return Either.left(ErrorHandler.exceptionToFailure(e));
    }
  }

  @override
  Future<Either<Failure, StudySetEntity>> updateStudySet(
    String id,
    CreateStudySetRequest request,
  ) async {
    try {
      final studySet = await remoteDataSource.updateStudySet(id, request);
      return Either.right(studySet);
    } on Exception catch (e) {
      return Either.left(ErrorHandler.exceptionToFailure(e));
    }
  }

  @override
  Future<Either<Failure, void>> deleteStudySet(String id) async {
    try {
      await remoteDataSource.deleteStudySet(id);
      return Either.right(null);
    } on Exception catch (e) {
      return Either.left(ErrorHandler.exceptionToFailure(e));
    }
  }
}
