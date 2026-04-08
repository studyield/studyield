import '../../domain/entities/user_entity.dart';

abstract class AuthState {}

class AuthInitial extends AuthState {}

class AuthLoading extends AuthState {}

class AuthSuccess extends AuthState {
  final UserEntity user;

  AuthSuccess({required this.user});
}

class AuthError extends AuthState {
  final String message;

  AuthError({required this.message});
}

class AuthLoggedOut extends AuthState {}
