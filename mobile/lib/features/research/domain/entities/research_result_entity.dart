import 'package:equatable/equatable.dart';

class ResearchSectionEntity {
  final String heading;
  final String content;
  final List<String> keyPoints;
  final List<String> sourceIds;

  const ResearchSectionEntity({
    required this.heading,
    required this.content,
    required this.keyPoints,
    required this.sourceIds,
  });
}

class ResearchSourceEntity extends Equatable {
  final String id;
  final String type; // 'knowledge_base', 'web', 'academic'
  final String? title;
  final String content;
  final String? url;
  final double relevanceScore; // 0-1

  const ResearchSourceEntity({
    required this.id,
    required this.type,
    this.title,
    required this.content,
    this.url,
    required this.relevanceScore,
  });

  @override
  List<Object?> get props => [id, type, title, content, url, relevanceScore];
}

class ResearchResultEntity extends Equatable {
  final String sessionId;
  final String? executiveSummary;
  final List<ResearchSectionEntity> sections;
  final List<ResearchSourceEntity> sources;

  const ResearchResultEntity({
    required this.sessionId,
    this.executiveSummary,
    required this.sections,
    required this.sources,
  });

  @override
  List<Object?> get props => [sessionId, executiveSummary, sections, sources];
}
