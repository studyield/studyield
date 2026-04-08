/// Custom exceptions for the application
/// Thrown by data sources and caught by repositories

class ServerException implements Exception {
  final String message;
  final int? statusCode;
  final dynamic data;

  ServerException({
    required this.message,
    this.statusCode,
    this.data,
  });

  @override
  String toString() => 'ServerException: $message (Status: $statusCode)';
}

class CacheException implements Exception {
  final String message;

  CacheException({required this.message});

  @override
  String toString() => 'CacheException: $message';
}

class NetworkException implements Exception {
  final String message;

  NetworkException({this.message = 'No internet connection'});

  @override
  String toString() => 'NetworkException: $message';
}

class UnauthorizedException implements Exception {
  final String message;

  UnauthorizedException({this.message = 'Unauthorized access'});

  @override
  String toString() => 'UnauthorizedException: $message';
}

class ValidationException implements Exception {
  final Map<String, dynamic> errors;
  final String message;

  ValidationException({
    required this.errors,
    this.message = 'Validation failed',
  });

  @override
  String toString() => 'ValidationException: $message - $errors';
}

class TimeoutException implements Exception {
  final String message;

  TimeoutException({this.message = 'Request timeout'});

  @override
  String toString() => 'TimeoutException: $message';
}
