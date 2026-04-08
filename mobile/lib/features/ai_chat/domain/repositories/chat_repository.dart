import '../entities/conversation_entity.dart';
import '../entities/chat_message_entity.dart';

abstract class ChatRepository {
  // Conversations
  Future<List<ConversationEntity>> getConversations();
  Future<ConversationEntity> createConversation({String? title});
  Future<ConversationEntity> getConversation(String id);
  Future<void> updateConversation(String id, String title);
  Future<void> deleteConversation(String id);

  // Messages
  Future<List<ChatMessageEntity>> getMessages(String conversationId);
  Future<ChatMessageEntity> sendMessage(String conversationId, String content);

  // Streaming
  Stream<Map<String, dynamic>> sendMessageStream(
    String conversationId,
    String content,
  );
}
