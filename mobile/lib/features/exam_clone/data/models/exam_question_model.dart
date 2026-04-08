import '../../domain/entities/exam_question_entity.dart';

class ExamQuestionModel extends ExamQuestionEntity {
  const ExamQuestionModel({
    required super.id,
    required super.examCloneId,
    super.isOriginal = true,
    required super.questionText,
    required super.options,
    required super.correctAnswer,
    super.explanation,
    required super.difficulty,
    super.tags,
    super.isBookmarked,
    super.nextReviewDate,
    super.reviewCount,
    required super.createdAt,
  });

  factory ExamQuestionModel.fromJson(Map<String, dynamic> json) {
    return ExamQuestionModel(
      id: json['id'] as String,
      examCloneId: json['examCloneId'] as String,
      isOriginal: json['isOriginal'] as bool? ?? true,
      questionText: json['question'] as String, // Backend uses 'question'
      options: json['options'] != null
          ? List<String>.from(json['options'] as List)
          : [],
      correctAnswer: json['correctAnswer'] as String,
      explanation: json['explanation'] as String?,
      difficulty: json['difficulty'] as String? ?? 'medium',
      tags: json['topic'] != null ? [json['topic'] as String] : [],
      isBookmarked: json['isBookmarked'] as bool? ?? false,
      nextReviewDate: json['nextReviewDate'] != null
          ? DateTime.parse(json['nextReviewDate'] as String)
          : null,
      reviewCount: json['reviewCount'] as int? ?? 0,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'] as String)
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'examCloneId': examCloneId,
      'questionText': questionText,
      'options': options,
      'correctAnswer': correctAnswer,
      'explanation': explanation,
      'difficulty': difficulty,
      'tags': tags,
      'isBookmarked': isBookmarked,
      'nextReviewDate': nextReviewDate?.toIso8601String(),
      'reviewCount': reviewCount,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  ExamQuestionEntity toEntity() {
    return ExamQuestionEntity(
      id: id,
      examCloneId: examCloneId,
      isOriginal: isOriginal,
      questionText: questionText,
      options: options,
      correctAnswer: correctAnswer,
      explanation: explanation,
      difficulty: difficulty,
      tags: tags,
      isBookmarked: isBookmarked,
      nextReviewDate: nextReviewDate,
      reviewCount: reviewCount,
      createdAt: createdAt,
    );
  }
}
