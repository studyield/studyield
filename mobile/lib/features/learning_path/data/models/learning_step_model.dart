import '../../domain/entities/learning_step_entity.dart';

class LearningStepModel extends LearningStepEntity {
  const LearningStepModel({
    required super.id,
    required super.pathId,
    required super.stepNumber,
    required super.title,
    required super.description,
    required super.type,
    required super.estimatedMinutes,
    super.isCompleted,
    super.resourceUrl,
    super.completedAt,
    required super.createdAt,
  });

  factory LearningStepModel.fromJson(Map<String, dynamic> json) {
    return LearningStepModel(
      id: json['id'] ?? '',
      pathId: json['pathId'] ?? '',
      stepNumber: json['order'] ?? json['stepNumber'] ?? 0,
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      type: _parseStepType(json['type']),
      estimatedMinutes: json['estimatedMinutes'] ?? 30,
      isCompleted: json['isCompleted'] ?? false,
      resourceUrl: json['resourceUrl'],
      completedAt: json['completedAt'] != null
          ? DateTime.parse(json['completedAt'])
          : null,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
    );
  }

  static StepType _parseStepType(String? type) {
    switch (type?.toLowerCase()) {
      case 'study':
        return StepType.study;
      case 'quiz':
        return StepType.quiz;
      case 'practice':
        return StepType.practice;
      case 'review':
        return StepType.review;
      case 'project':
        return StepType.project;
      default:
        return StepType.study;
    }
  }

  LearningStepEntity toEntity() => this;
}
