import 'package:equatable/equatable.dart';

class ExamStyleEntity extends Equatable {
  final List<String> questionTypes;
  final DifficultyDistribution difficultyDistribution;
  final double averageQuestionLength;
  final List<String> topicsCovered;
  final List<String> formatPatterns;
  final String languageStyle;

  const ExamStyleEntity({
    required this.questionTypes,
    required this.difficultyDistribution,
    required this.averageQuestionLength,
    required this.topicsCovered,
    required this.formatPatterns,
    required this.languageStyle,
  });

  @override
  List<Object?> get props => [
        questionTypes,
        difficultyDistribution,
        averageQuestionLength,
        topicsCovered,
        formatPatterns,
        languageStyle,
      ];
}

class DifficultyDistribution extends Equatable {
  final int easy;
  final int medium;
  final int hard;

  const DifficultyDistribution({
    required this.easy,
    required this.medium,
    required this.hard,
  });

  @override
  List<Object?> get props => [easy, medium, hard];
}
