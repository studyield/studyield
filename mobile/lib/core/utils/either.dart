/// Either type for functional error handling
/// Represents a value that can be either Left (error) or Right (success)
class Either<L, R> {
  final L? _left;
  final R? _right;
  final bool isLeft;

  Either.left(L value)
      : _left = value,
        _right = null,
        isLeft = true;

  Either.right(R value)
      : _left = null,
        _right = value,
        isLeft = false;

  bool get isRight => !isLeft;

  L get left {
    if (!isLeft) throw Exception('Either is Right, cannot access left value');
    return _left!;
  }

  R get right {
    if (isLeft) throw Exception('Either is Left, cannot access right value');
    return _right!;
  }

  /// Execute function based on which value is present
  T fold<T>(
    T Function(L) onLeft,
    T Function(R) onRight,
  ) {
    if (isLeft) {
      return onLeft(_left!);
    } else {
      return onRight(_right!);
    }
  }

  /// Map the right value
  Either<L, T> map<T>(T Function(R) mapper) {
    if (isLeft) {
      return Either.left(_left!);
    } else {
      return Either.right(mapper(_right!));
    }
  }

  /// FlatMap the right value
  Either<L, T> flatMap<T>(Either<L, T> Function(R) mapper) {
    if (isLeft) {
      return Either.left(_left!);
    } else {
      return mapper(_right!);
    }
  }
}
