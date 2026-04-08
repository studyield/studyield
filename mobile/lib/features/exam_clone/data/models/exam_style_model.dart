import '../../domain/entities/exam_style_entity.dart';

class ExamStyleModel extends ExamStyleEntity {
  const ExamStyleModel({
    required super.questionTypes,
    required super.difficultyDistribution,
    required super.averageQuestionLength,
    required super.topicsCovered,
    required super.formatPatterns,
    required super.languageStyle,
  });

  factory ExamStyleModel.fromJson(Map<String, dynamic> json) {
    return ExamStyleModel(
      questionTypes: json['questionTypes'] != null
          ? List<String>.from(json['questionTypes'] as List)
          : [],
      difficultyDistribution: json['difficultyDistribution'] != null
          ? DifficultyDistributionModel.fromJson(
              json['difficultyDistribution'] as Map<String, dynamic>)
          : const DifficultyDistribution(easy: 0, medium: 0, hard: 0),
      averageQuestionLength:
          (json['averageQuestionLength'] as num?)?.toDouble() ?? 0.0,
      topicsCovered: json['topicsCovered'] != null
          ? List<String>.from(json['topicsCovered'] as List)
          : [],
      formatPatterns: json['formatPatterns'] != null
          ? List<String>.from(json['formatPatterns'] as List)
          : [],
      languageStyle: json['languageStyle'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'questionTypes': questionTypes,
      'difficultyDistribution': {
        'easy': difficultyDistribution.easy,
        'medium': difficultyDistribution.medium,
        'hard': difficultyDistribution.hard,
      },
      'averageQuestionLength': averageQuestionLength,
      'topicsCovered': topicsCovered,
      'formatPatterns': formatPatterns,
      'languageStyle': languageStyle,
    };
  }

  ExamStyleEntity toEntity() {
    return ExamStyleEntity(
      questionTypes: questionTypes,
      difficultyDistribution: difficultyDistribution,
      averageQuestionLength: averageQuestionLength,
      topicsCovered: topicsCovered,
      formatPatterns: formatPatterns,
      languageStyle: languageStyle,
    );
  }
}

class DifficultyDistributionModel extends DifficultyDistribution {
  const DifficultyDistributionModel({
    required super.easy,
    required super.medium,
    required super.hard,
  });

  factory DifficultyDistributionModel.fromJson(Map<String, dynamic> json) {
    return DifficultyDistributionModel(
      easy: json['easy'] as int? ?? 0,
      medium: json['medium'] as int? ?? 0,
      hard: json['hard'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'easy': easy,
      'medium': medium,
      'hard': hard,
    };
  }
}
