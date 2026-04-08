import 'package:equatable/equatable.dart';

enum ExplanationLevel { eli5, beginner, intermediate, advanced }

class ComplexityExplanationEntity extends Equatable {
  final String id;
  final String sessionId;
  final ExplanationLevel level;
  final String explanation;
  final List<String>? keyPoints;
  final List<String>? examples;
  final Map<String, dynamic>? visualAids;
  final DateTime createdAt;

  const ComplexityExplanationEntity({
    required this.id,
    required this.sessionId,
    required this.level,
    required this.explanation,
    this.keyPoints,
    this.examples,
    this.visualAids,
    required this.createdAt,
  });

  @override
  List<Object?> get props => [
        id,
        sessionId,
        level,
        explanation,
        keyPoints,
        examples,
        visualAids,
        createdAt,
      ];
}
