import 'package:equatable/equatable.dart';

class ExamQuestionEntity extends Equatable {
  final String id;
  final String examCloneId;
  final bool isOriginal;
  final String questionText;
  final List<String> options;
  final String correctAnswer;
  final String? explanation;
  final String difficulty;
  final List<String> tags;
  final bool isBookmarked;
  final DateTime? nextReviewDate;
  final int reviewCount;
  final DateTime createdAt;

  const ExamQuestionEntity({
    required this.id,
    required this.examCloneId,
    this.isOriginal = true,
    required this.questionText,
    required this.options,
    required this.correctAnswer,
    this.explanation,
    required this.difficulty,
    this.tags = const [],
    this.isBookmarked = false,
    this.nextReviewDate,
    this.reviewCount = 0,
    required this.createdAt,
  });

  @override
  List<Object?> get props => [
        id,
        examCloneId,
        isOriginal,
        questionText,
        options,
        correctAnswer,
        explanation,
        difficulty,
        tags,
        isBookmarked,
        nextReviewDate,
        reviewCount,
        createdAt,
      ];

  ExamQuestionEntity copyWith({
    String? id,
    String? examCloneId,
    bool? isOriginal,
    String? questionText,
    List<String>? options,
    String? correctAnswer,
    String? explanation,
    String? difficulty,
    List<String>? tags,
    bool? isBookmarked,
    DateTime? nextReviewDate,
    int? reviewCount,
    DateTime? createdAt,
  }) {
    return ExamQuestionEntity(
      id: id ?? this.id,
      examCloneId: examCloneId ?? this.examCloneId,
      isOriginal: isOriginal ?? this.isOriginal,
      questionText: questionText ?? this.questionText,
      options: options ?? this.options,
      correctAnswer: correctAnswer ?? this.correctAnswer,
      explanation: explanation ?? this.explanation,
      difficulty: difficulty ?? this.difficulty,
      tags: tags ?? this.tags,
      isBookmarked: isBookmarked ?? this.isBookmarked,
      nextReviewDate: nextReviewDate ?? this.nextReviewDate,
      reviewCount: reviewCount ?? this.reviewCount,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
