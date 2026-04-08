import '../entities/user_entity.dart';
import '../../../../core/errors/failures.dart';
import '../../../../core/utils/either.dart';

abstract class AuthRepository {
  Future<Either<Failure, UserEntity>> login(String email, String password);
  Future<Either<Failure, UserEntity>> register(String name, String email, String password);
  Future<Either<Failure, void>> logout();
}
