import '../../domain/entities/research_session_entity.dart';

class ResearchSessionModel extends ResearchSessionEntity {
  const ResearchSessionModel({
    required super.id,
    required super.userId,
    required super.query,
    required super.depth,
    required super.sourceTypes,
    required super.outputFormat,
    required super.status,
    super.currentStage,
    super.progress,
    super.progressMessage,
    required super.createdAt,
    required super.updatedAt,
  });

  factory ResearchSessionModel.fromJson(Map<String, dynamic> json) {
    return ResearchSessionModel(
      id: json['id'] ?? '',
      userId: json['userId'] ?? '',
      query: json['query'] ?? '',
      depth: json['depth'] ?? 'standard',
      sourceTypes: List<String>.from(json['sourceTypes'] ?? ['documents']),
      outputFormat: json['outputFormat'] ?? 'detailed',
      status: _parseStatus(json['status']),
      currentStage: json['currentStage'],
      progress: (json['progress'] ?? 0.0).toDouble(),
      progressMessage: json['progressMessage'],
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'])
          : DateTime.now(),
    );
  }

  static ResearchStatus _parseStatus(String? status) {
    switch (status?.toLowerCase()) {
      case 'pending':
        return ResearchStatus.pending;
      case 'planning':
        return ResearchStatus.planning;
      case 'researching':
        return ResearchStatus.researching;
      case 'synthesizing':
        return ResearchStatus.synthesizing;
      case 'completed':
        return ResearchStatus.completed;
      case 'failed':
        return ResearchStatus.failed;
      default:
        return ResearchStatus.pending;
    }
  }

  ResearchSessionEntity toEntity() => this;
}
