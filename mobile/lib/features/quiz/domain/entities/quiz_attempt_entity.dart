class QuizAttemptEntity {
  final String id;
  final String quizId;
  final String userId;
  final double score;
  final int totalQuestions;
  final int timeSpent;
  final DateTime completedAt;
  final DateTime createdAt;

  QuizAttemptEntity({
    required this.id,
    required this.quizId,
    required this.userId,
    required this.score,
    required this.totalQuestions,
    required this.timeSpent,
    required this.completedAt,
    required this.createdAt,
  });

  factory QuizAttemptEntity.fromJson(Map<String, dynamic> json) {
    return QuizAttemptEntity(
      id: json['id'] as String,
      quizId: json['quizId'] as String,
      userId: json['userId'] as String,
      score: (json['score'] as num).toDouble(),
      totalQuestions: json['totalQuestions'] as int,
      timeSpent: json['timeSpent'] as int,
      completedAt: DateTime.parse(json['completedAt'] as String),
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  int get scorePercentage => score.round();
}

class QuizAttemptAnswerEntity {
  final String id;
  final String attemptId;
  final String questionId;
  final String userAnswer;
  final bool isCorrect;
  final int timeSpent;

  QuizAttemptAnswerEntity({
    required this.id,
    required this.attemptId,
    required this.questionId,
    required this.userAnswer,
    required this.isCorrect,
    required this.timeSpent,
  });

  factory QuizAttemptAnswerEntity.fromJson(Map<String, dynamic> json) {
    return QuizAttemptAnswerEntity(
      id: json['id'] as String,
      attemptId: json['attemptId'] as String,
      questionId: json['questionId'] as String,
      userAnswer: json['userAnswer'] as String,
      isCorrect: json['isCorrect'] as bool,
      timeSpent: json['timeSpent'] as int,
    );
  }
}
