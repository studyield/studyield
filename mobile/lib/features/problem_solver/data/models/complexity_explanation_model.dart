import '../../domain/entities/complexity_explanation_entity.dart';

class ComplexityExplanationModel extends ComplexityExplanationEntity {
  const ComplexityExplanationModel({
    required super.id,
    required super.sessionId,
    required super.level,
    required super.explanation,
    super.keyPoints,
    super.examples,
    super.visualAids,
    required super.createdAt,
  });

  factory ComplexityExplanationModel.fromJson(Map<String, dynamic> json) {
    return ComplexityExplanationModel(
      id: json['id'] ?? '',
      sessionId: json['sessionId'] ?? '',
      level: _parseExplanationLevel(json['level']),
      explanation: json['explanation'] ?? '',
      keyPoints: (json['keyPoints'] as List<dynamic>?)
          ?.map((e) => e.toString())
          .toList(),
      examples: (json['examples'] as List<dynamic>?)
          ?.map((e) => e.toString())
          .toList(),
      visualAids: json['visualAids'],
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
    );
  }

  static ExplanationLevel _parseExplanationLevel(String? level) {
    switch (level?.toLowerCase()) {
      case 'eli5':
        return ExplanationLevel.eli5;
      case 'beginner':
        return ExplanationLevel.beginner;
      case 'intermediate':
        return ExplanationLevel.intermediate;
      case 'advanced':
        return ExplanationLevel.advanced;
      default:
        return ExplanationLevel.beginner;
    }
  }

  ComplexityExplanationEntity toEntity() => this;
}
