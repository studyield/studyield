import '../../domain/entities/citation_entity.dart';

class AgentConfidenceModel extends AgentConfidence {
  const AgentConfidenceModel({
    required super.agent,
    required super.confidence,
    required super.status,
  });

  factory AgentConfidenceModel.fromJson(Map<String, dynamic> json) {
    return AgentConfidenceModel(
      agent: _parseAgentType(json['agent']),
      confidence: (json['confidence'] ?? 0.0).toDouble(),
      status: json['status'] ?? '',
    );
  }

  static AgentType _parseAgentType(String? type) {
    switch (type?.toLowerCase()) {
      case 'analysis':
        return AgentType.analysis;
      case 'solver':
        return AgentType.solver;
      case 'verifier':
        return AgentType.verifier;
      default:
        return AgentType.analysis;
    }
  }
}

class CitationModel extends CitationEntity {
  const CitationModel({
    required super.id,
    required super.sessionId,
    required super.agentConfidences,
    required super.sources,
    super.metadata,
    required super.createdAt,
  });

  factory CitationModel.fromJson(Map<String, dynamic> json) {
    return CitationModel(
      id: json['id'] ?? '',
      sessionId: json['sessionId'] ?? '',
      agentConfidences: (json['agentConfidences'] as List<dynamic>?)
              ?.map((e) => AgentConfidenceModel.fromJson(e))
              .toList() ??
          [],
      sources: (json['sources'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      metadata: json['metadata'],
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
    );
  }

  CitationEntity toEntity() => this;
}
