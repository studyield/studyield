import 'package:equatable/equatable.dart';

enum QuestionType { mcq, trueFalse, fillBlank }

class QuizQuestionEntity extends Equatable {
  final String id;
  final String question;
  final QuestionType questionType;
  final List<String> options;
  final String correctAnswer;
  final String explanation;
  final String difficulty;
  final String? userAnswer;
  final bool? isCorrect;
  final DateTime? answeredAt;

  const QuizQuestionEntity({
    required this.id,
    required this.question,
    required this.questionType,
    required this.options,
    required this.correctAnswer,
    required this.explanation,
    required this.difficulty,
    this.userAnswer,
    this.isCorrect,
    this.answeredAt,
  });

  @override
  List<Object?> get props => [
        id,
        question,
        questionType,
        options,
        correctAnswer,
        explanation,
        difficulty,
        userAnswer,
        isCorrect,
        answeredAt,
      ];

  QuizQuestionEntity copyWith({
    String? userAnswer,
    bool? isCorrect,
    DateTime? answeredAt,
  }) {
    return QuizQuestionEntity(
      id: id,
      question: question,
      questionType: questionType,
      options: options,
      correctAnswer: correctAnswer,
      explanation: explanation,
      difficulty: difficulty,
      userAnswer: userAnswer ?? this.userAnswer,
      isCorrect: isCorrect ?? this.isCorrect,
      answeredAt: answeredAt ?? this.answeredAt,
    );
  }
}
