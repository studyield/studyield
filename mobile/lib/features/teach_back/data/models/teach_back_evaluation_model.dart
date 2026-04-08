import '../../domain/entities/teach_back_evaluation_entity.dart';

class TeachBackEvaluationModel extends TeachBackEvaluationEntity {
  const TeachBackEvaluationModel({
    required super.overallScore,
    required super.accuracy,
    required super.clarity,
    required super.completeness,
    required super.understanding,
    required super.strengths,
    required super.misconceptions,
    required super.suggestions,
    required super.followUpQuestions,
  });

  factory TeachBackEvaluationModel.fromJson(Map<String, dynamic> json) {
    return TeachBackEvaluationModel(
      overallScore: (json['overallScore'] ?? 0.0).toDouble(),
      accuracy: MetricScore(
        metric: 'Accuracy',
        score: (json['accuracy']?['score'] ?? 0.0).toDouble(),
        feedback: json['accuracy']?['feedback'] ?? '',
      ),
      clarity: MetricScore(
        metric: 'Clarity',
        score: (json['clarity']?['score'] ?? 0.0).toDouble(),
        feedback: json['clarity']?['feedback'] ?? '',
      ),
      completeness: MetricScore(
        metric: 'Completeness',
        score: (json['completeness']?['score'] ?? 0.0).toDouble(),
        feedback: json['completeness']?['feedback'] ?? '',
      ),
      understanding: MetricScore(
        metric: 'Understanding',
        score: (json['understanding']?['score'] ?? 0.0).toDouble(),
        feedback: json['understanding']?['feedback'] ?? '',
      ),
      strengths: List<String>.from(json['strengths'] ?? []),
      misconceptions: List<String>.from(json['misconceptions'] ?? []),
      suggestions: List<String>.from(json['suggestions'] ?? []),
      followUpQuestions: List<String>.from(json['followUpQuestions'] ?? []),
    );
  }

  TeachBackEvaluationEntity toEntity() => this;
}
