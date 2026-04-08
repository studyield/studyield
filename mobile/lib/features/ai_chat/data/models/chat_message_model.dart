import '../../domain/entities/chat_message_entity.dart';
import 'citation_model.dart';

class ChatMessageModel extends ChatMessageEntity {
  const ChatMessageModel({
    required super.id,
    required super.conversationId,
    required super.role,
    required super.content,
    super.citations,
    super.metadata,
    required super.createdAt,
  });

  factory ChatMessageModel.fromJson(Map<String, dynamic> json) {
    return ChatMessageModel(
      id: json['id'] ?? '',
      conversationId: json['conversationId'] ?? '',
      role: _parseRole(json['role']),
      content: json['content'] ?? '',
      citations: (json['citations'] as List<dynamic>?)
              ?.map((e) => CitationModel.fromJson(e).toEntity())
              .toList() ??
          [],
      metadata: json['metadata'] as Map<String, dynamic>?,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt']).toLocal()
          : DateTime.now(),
    );
  }

  static MessageRole _parseRole(String? role) {
    switch (role?.toLowerCase()) {
      case 'user':
        return MessageRole.user;
      case 'assistant':
        return MessageRole.assistant;
      case 'system':
        return MessageRole.system;
      default:
        return MessageRole.user;
    }
  }

  ChatMessageEntity toEntity() => this;
}
