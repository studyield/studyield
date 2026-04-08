import '../../domain/entities/learning_path_entity.dart';
import 'learning_step_model.dart';

class LearningPathModel extends LearningPathEntity {
  const LearningPathModel({
    required super.id,
    required super.userId,
    required super.title,
    required super.topic,
    required super.currentLevel,
    required super.targetLevel,
    required super.hoursPerWeek,
    required super.totalSteps,
    required super.completedSteps,
    required super.estimatedHours,
    required super.difficulty,
    super.subject,
    super.steps,
    required super.createdAt,
    required super.updatedAt,
  });

  factory LearningPathModel.fromJson(Map<String, dynamic> json) {
    final steps = (json['steps'] as List<dynamic>?)
            ?.map((e) => LearningStepModel.fromJson(e).toEntity())
            .toList() ??
        [];
    // Backend sends steps array + progress, NOT totalSteps/completedSteps
    final totalSteps = json['totalSteps'] ?? steps.length;
    final completedSteps = json['completedSteps'] ?? steps.where((s) => s.isCompleted).length;

    return LearningPathModel(
      id: json['id'] ?? '',
      userId: json['userId'] ?? '',
      title: json['title'] ?? '',
      topic: json['topic'] ?? '',
      currentLevel: json['currentLevel'] ?? '',
      targetLevel: json['targetLevel'] ?? '',
      hoursPerWeek: json['hoursPerWeek'] ?? 5,
      totalSteps: totalSteps,
      completedSteps: completedSteps,
      estimatedHours: json['estimatedHours'] ?? 0,
      difficulty: json['difficulty'] ?? 'medium',
      subject: json['subject'],
      steps: steps,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'])
          : DateTime.now(),
    );
  }

  LearningPathEntity toEntity() => this;
}
