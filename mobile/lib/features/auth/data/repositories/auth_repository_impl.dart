import '../../../../core/errors/error_handler.dart';
import '../../../../core/errors/failures.dart';
import '../../../../core/utils/either.dart';
import '../../domain/entities/user_entity.dart';
import '../../domain/repositories/auth_repository.dart';
import '../datasources/auth_remote_datasource.dart';
import '../models/login_request.dart';
import '../models/register_request.dart';

class AuthRepositoryImpl implements AuthRepository {
  final AuthRemoteDataSource remoteDataSource;

  AuthRepositoryImpl({required this.remoteDataSource});

  @override
  Future<Either<Failure, UserEntity>> login(
    String email,
    String password,
  ) async {
    try {
      final request = LoginRequest(email: email, password: password);
      final response = await remoteDataSource.login(request);
      return Either.right(response.user);
    } on Exception catch (e) {
      return Either.left(ErrorHandler.exceptionToFailure(e));
    }
  }

  @override
  Future<Either<Failure, UserEntity>> register(
    String name,
    String email,
    String password,
  ) async {
    try {
      final request = RegisterRequest(
        name: name,
        email: email,
        password: password,
      );
      final response = await remoteDataSource.register(request);
      return Either.right(response.user);
    } on Exception catch (e) {
      return Either.left(ErrorHandler.exceptionToFailure(e));
    }
  }

  @override
  Future<Either<Failure, void>> logout() async {
    try {
      await remoteDataSource.logout();
      return Either.right(null);
    } on Exception catch (e) {
      return Either.left(ErrorHandler.exceptionToFailure(e));
    }
  }
}
