import '../../domain/entities/research_result_entity.dart';

class ResearchSectionModel extends ResearchSectionEntity {
  const ResearchSectionModel({
    required super.heading,
    required super.content,
    required super.keyPoints,
    required super.sourceIds,
  });

  factory ResearchSectionModel.fromJson(Map<String, dynamic> json) {
    return ResearchSectionModel(
      heading: json['heading'] ?? '',
      content: json['content'] ?? '',
      keyPoints: List<String>.from(json['keyPoints'] ?? []),
      sourceIds: List<String>.from(json['sourceIds'] ?? []),
    );
  }
}

class ResearchSourceModel extends ResearchSourceEntity {
  const ResearchSourceModel({
    required super.id,
    required super.type,
    super.title,
    required super.content,
    super.url,
    required super.relevanceScore,
  });

  factory ResearchSourceModel.fromJson(Map<String, dynamic> json) {
    return ResearchSourceModel(
      id: json['id'] ?? '',
      type: json['type'] ?? 'knowledge_base',
      title: json['title'],
      content: json['content'] ?? '',
      url: json['url'],
      relevanceScore: (json['relevanceScore'] ?? 0.0).toDouble(),
    );
  }

  ResearchSourceEntity toEntity() => this;
}

class ResearchResultModel extends ResearchResultEntity {
  const ResearchResultModel({
    required super.sessionId,
    super.executiveSummary,
    required super.sections,
    required super.sources,
  });

  factory ResearchResultModel.fromJson(Map<String, dynamic> json) {
    return ResearchResultModel(
      sessionId: json['sessionId'] ?? '',
      executiveSummary: json['executiveSummary'],
      sections: (json['sections'] as List<dynamic>?)
              ?.map((e) => ResearchSectionModel.fromJson(e))
              .toList() ??
          [],
      sources: (json['sources'] as List<dynamic>?)
              ?.map((e) => ResearchSourceModel.fromJson(e).toEntity())
              .toList() ??
          [],
    );
  }

  ResearchResultEntity toEntity() => this;
}
