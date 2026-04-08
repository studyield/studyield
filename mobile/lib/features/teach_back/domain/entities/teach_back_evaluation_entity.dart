import 'package:equatable/equatable.dart';

class MetricScore {
  final String metric;
  final double score; // 0-100
  final String feedback;

  const MetricScore({
    required this.metric,
    required this.score,
    required this.feedback,
  });
}

class TeachBackEvaluationEntity extends Equatable {
  final double overallScore; // 0-100
  final MetricScore accuracy;
  final MetricScore clarity;
  final MetricScore completeness;
  final MetricScore understanding;
  final List<String> strengths;
  final List<String> misconceptions;
  final List<String> suggestions;
  final List<String> followUpQuestions;

  const TeachBackEvaluationEntity({
    required this.overallScore,
    required this.accuracy,
    required this.clarity,
    required this.completeness,
    required this.understanding,
    required this.strengths,
    required this.misconceptions,
    required this.suggestions,
    required this.followUpQuestions,
  });

  @override
  List<Object?> get props => [
        overallScore,
        accuracy,
        clarity,
        completeness,
        understanding,
        strengths,
        misconceptions,
        suggestions,
        followUpQuestions,
      ];
}
