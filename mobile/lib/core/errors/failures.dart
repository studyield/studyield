/// Failures are returned by repositories
/// They represent business logic errors, not exceptions

abstract class Failure {
  final String message;
  final int? statusCode;

  const Failure({
    required this.message,
    this.statusCode,
  });

  @override
  String toString() => message;
}

class ServerFailure extends Failure {
  const ServerFailure({
    required super.message,
    super.statusCode,
  });
}

class NetworkFailure extends Failure {
  const NetworkFailure({
    super.message = 'No internet connection. Please check your network.',
    super.statusCode,
  });
}

class CacheFailure extends Failure {
  const CacheFailure({
    super.message = 'Failed to load cached data',
    super.statusCode,
  });
}

class UnauthorizedFailure extends Failure {
  const UnauthorizedFailure({
    super.message = 'Session expired. Please login again.',
    super.statusCode = 401,
  });
}

class ValidationFailure extends Failure {
  final Map<String, dynamic> errors;

  const ValidationFailure({
    required this.errors,
    super.message = 'Validation failed',
    super.statusCode = 422,
  });
}

class TimeoutFailure extends Failure {
  const TimeoutFailure({
    super.message = 'Request timeout. Please try again.',
    super.statusCode,
  });
}

class UnknownFailure extends Failure {
  const UnknownFailure({
    super.message = 'An unexpected error occurred',
    super.statusCode,
  });
}
