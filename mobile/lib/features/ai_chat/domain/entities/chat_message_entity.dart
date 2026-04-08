import 'package:equatable/equatable.dart';
import 'citation_entity.dart';

enum MessageRole { user, assistant, system }

class ChatMessageEntity extends Equatable {
  final String id;
  final String conversationId;
  final MessageRole role;
  final String content;
  final List<CitationEntity> citations;
  final Map<String, dynamic>? metadata;
  final DateTime createdAt;

  const ChatMessageEntity({
    required this.id,
    required this.conversationId,
    required this.role,
    required this.content,
    this.citations = const [],
    this.metadata,
    required this.createdAt,
  });

  @override
  List<Object?> get props => [
        id,
        conversationId,
        role,
        content,
        citations,
        metadata,
        createdAt,
      ];
}
