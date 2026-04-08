import '../../domain/entities/teach_back_session_entity.dart';

class TeachBackSessionModel extends TeachBackSessionEntity {
  const TeachBackSessionModel({
    required super.id,
    required super.userId,
    required super.topic,
    required super.difficulty,
    required super.status,
    super.explanation,
    super.evaluation,
    super.overallScore,
    required super.createdAt,
    required super.updatedAt,
  });

  factory TeachBackSessionModel.fromJson(Map<String, dynamic> json) {
    return TeachBackSessionModel(
      id: json['id'] ?? '',
      userId: json['userId'] ?? '',
      topic: json['topic'] ?? '',
      difficulty: json['difficulty'] ?? 'classmate',
      status: _parseStatus(json['status']),
      explanation: json['userExplanation'] ?? json['explanation'], // Backend uses 'userExplanation'
      evaluation: json['evaluation'] as Map<String, dynamic>?,
      overallScore: json['overallScore'] != null
          ? (json['overallScore'] as num).toDouble()
          : null,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'])
          : DateTime.now(),
    );
  }

  static TeachBackStatus _parseStatus(String? status) {
    switch (status?.toLowerCase()) {
      case 'submitted':
        return TeachBackStatus.submitted;
      case 'evaluated':
        return TeachBackStatus.evaluated;
      default:
        return TeachBackStatus.pending;
    }
  }

  TeachBackSessionEntity toEntity() => this;
}
