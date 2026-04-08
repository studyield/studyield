import '../../domain/entities/citation_entity.dart';

class CitationModel extends CitationEntity {
  const CitationModel({
    required super.chunkId,
    required super.content,
    super.documentId,
    required super.score,
  });

  factory CitationModel.fromJson(Map<String, dynamic> json) {
    return CitationModel(
      chunkId: json['chunkId'] ?? '',
      content: json['content'] ?? '',
      documentId: json['documentId'],
      score: (json['score'] ?? 0.0).toDouble(),
    );
  }

  CitationEntity toEntity() => this;
}
