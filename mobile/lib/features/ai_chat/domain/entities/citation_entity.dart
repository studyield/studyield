import 'package:equatable/equatable.dart';

class CitationEntity extends Equatable {
  final String chunkId;
  final String content;
  final String? documentId;
  final double score; // Relevance score 0-1

  const CitationEntity({
    required this.chunkId,
    required this.content,
    this.documentId,
    required this.score,
  });

  @override
  List<Object?> get props => [
        chunkId,
        content,
        documentId,
        score,
      ];
}
