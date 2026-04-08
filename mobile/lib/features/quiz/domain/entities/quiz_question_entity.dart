class QuizQuestionEntity {
  final String id;
  final String quizId;
  final String type;
  final String question;
  final List<String>? options;
  final String correctAnswer;
  final String? explanation;
  final String difficulty;
  final int order;

  QuizQuestionEntity({
    required this.id,
    required this.quizId,
    required this.type,
    required this.question,
    this.options,
    required this.correctAnswer,
    this.explanation,
    required this.difficulty,
    required this.order,
  });

  factory QuizQuestionEntity.fromJson(Map<String, dynamic> json) {
    return QuizQuestionEntity(
      id: json['id'] as String,
      quizId: json['quizId'] as String,
      type: json['type'] as String,
      question: json['question'] as String,
      options: (json['options'] as List<dynamic>?)?.map((e) => e as String).toList(),
      correctAnswer: json['correctAnswer'] as String,
      explanation: json['explanation'] as String?,
      difficulty: json['difficulty'] as String? ?? 'medium',
      order: json['order'] as int? ?? 0,
    );
  }

  bool get isMultipleChoice => type == 'multiple_choice';
  bool get isTrueFalse => type == 'true_false';
}
