import 'package:equatable/equatable.dart';

enum AgentType { analysis, solver, verifier }

class AgentConfidence {
  final AgentType agent;
  final double confidence;
  final String status;

  const AgentConfidence({
    required this.agent,
    required this.confidence,
    required this.status,
  });
}

class CitationEntity extends Equatable {
  final String id;
  final String sessionId;
  final List<AgentConfidence> agentConfidences;
  final List<String> sources;
  final Map<String, dynamic>? metadata;
  final DateTime createdAt;

  const CitationEntity({
    required this.id,
    required this.sessionId,
    required this.agentConfidences,
    required this.sources,
    this.metadata,
    required this.createdAt,
  });

  @override
  List<Object?> get props => [
        id,
        sessionId,
        agentConfidences,
        sources,
        metadata,
        createdAt,
      ];
}
