import 'dart:io';
import 'package:dio/dio.dart';
import 'exceptions.dart';
import 'failures.dart';

/// Global error handler that converts exceptions to failures
/// and provides user-friendly error messages

class ErrorHandler {
  /// Convert Dio errors to custom exceptions
  static Exception handleDioError(DioException error) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return TimeoutException(
          message: 'Request timeout. Please try again.',
        );

      case DioExceptionType.badResponse:
        return _handleStatusCode(error.response);

      case DioExceptionType.cancel:
        return ServerException(
          message: 'Request cancelled',
          statusCode: 499,
        );

      case DioExceptionType.connectionError:
        return NetworkException(
          message: 'No internet connection',
        );

      case DioExceptionType.badCertificate:
        return ServerException(
          message: 'SSL certificate error',
          statusCode: 495,
        );

      case DioExceptionType.unknown:
        if (error.error is SocketException) {
          return NetworkException();
        }
        return ServerException(
          message: error.message ?? 'Unknown error occurred',
        );
    }
  }

  /// Handle HTTP status codes
  static Exception _handleStatusCode(Response? response) {
    final statusCode = response?.statusCode ?? 0;
    final data = response?.data;

    // Convert data to Map<String, dynamic> if it's a Map
    Map<String, dynamic>? dataMap;
    if (data is Map) {
      dataMap = Map<String, dynamic>.from(data);
    }

    // Extract error message from response
    String message = 'Something went wrong';
    if (dataMap != null) {
      message = dataMap['message'] ?? dataMap['error'] ?? message;
    }

    switch (statusCode) {
      case 400:
        return ServerException(
          message: message,
          statusCode: statusCode,
          data: data,
        );

      case 401:
        return UnauthorizedException(
          message: message,
        );

      case 403:
        return ServerException(
          message: 'Access forbidden',
          statusCode: statusCode,
        );

      case 404:
        return ServerException(
          message: 'Resource not found',
          statusCode: statusCode,
        );

      case 422:
        return ValidationException(
          message: message,
          errors: dataMap ?? {},
        );

      case 429:
        return ServerException(
          message: 'Too many requests. Please try again later.',
          statusCode: statusCode,
        );

      case 500:
      case 502:
      case 503:
      case 504:
        return ServerException(
          message: 'Server error. Please try again later.',
          statusCode: statusCode,
        );

      default:
        return ServerException(
          message: message,
          statusCode: statusCode,
          data: data,
        );
    }
  }

  /// Convert exception to failure (for repositories)
  static Failure exceptionToFailure(Exception exception) {
    if (exception is ServerException) {
      return ServerFailure(
        message: exception.message,
        statusCode: exception.statusCode,
      );
    } else if (exception is NetworkException) {
      return NetworkFailure(message: exception.message);
    } else if (exception is CacheException) {
      return CacheFailure(message: exception.message);
    } else if (exception is UnauthorizedException) {
      return UnauthorizedFailure(message: exception.message);
    } else if (exception is ValidationException) {
      return ValidationFailure(
        message: exception.message,
        errors: exception.errors,
      );
    } else if (exception is TimeoutException) {
      return TimeoutFailure(message: exception.message);
    } else {
      return UnknownFailure(
        message: exception.toString(),
      );
    }
  }

  /// Get user-friendly error message from failure
  static String getErrorMessage(Failure failure) {
    return failure.message;
  }
}
