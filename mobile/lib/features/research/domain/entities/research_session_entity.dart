import 'package:equatable/equatable.dart';

enum ResearchStatus { pending, planning, researching, synthesizing, completed, failed }

class ResearchSessionEntity extends Equatable {
  final String id;
  final String userId;
  final String query;
  final String depth; // 'quick', 'standard', 'comprehensive'
  final List<String> sourceTypes; // ['documents', 'web', 'academic']
  final String outputFormat; // 'detailed', 'summary', 'bullets'
  final ResearchStatus status;
  final String? currentStage;
  final double progress; // 0-100
  final String? progressMessage;
  final DateTime createdAt;
  final DateTime updatedAt;

  const ResearchSessionEntity({
    required this.id,
    required this.userId,
    required this.query,
    required this.depth,
    required this.sourceTypes,
    required this.outputFormat,
    required this.status,
    this.currentStage,
    this.progress = 0.0,
    this.progressMessage,
    required this.createdAt,
    required this.updatedAt,
  });

  @override
  List<Object?> get props => [
        id,
        userId,
        query,
        depth,
        sourceTypes,
        outputFormat,
        status,
        currentStage,
        progress,
        progressMessage,
        createdAt,
        updatedAt,
      ];
}
