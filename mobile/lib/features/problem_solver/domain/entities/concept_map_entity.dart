import 'package:equatable/equatable.dart';

class ConceptNode extends Equatable {
  final String name;
  final String description;
  final String? difficulty;
  final String? importance;
  final String? relationship;

  const ConceptNode({
    required this.name,
    required this.description,
    this.difficulty,
    this.importance,
    this.relationship,
  });

  @override
  List<Object?> get props => [name, description, difficulty, importance, relationship];
}

class ConceptMapEntity extends Equatable {
  final String centralTopic;
  final List<ConceptNode> prerequisites;
  final List<ConceptNode> currentConcepts;
  final List<ConceptNode> nextConcepts;
  final List<ConceptNode> relatedConcepts;

  const ConceptMapEntity({
    required this.centralTopic,
    required this.prerequisites,
    required this.currentConcepts,
    required this.nextConcepts,
    required this.relatedConcepts,
  });

  @override
  List<Object?> get props => [
        centralTopic,
        prerequisites,
        currentConcepts,
        nextConcepts,
        relatedConcepts,
      ];
}
