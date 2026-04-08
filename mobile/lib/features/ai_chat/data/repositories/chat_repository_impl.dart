import 'dart:async';
import 'dart:convert';
import '../../../../core/network/api_client.dart';
import '../../domain/entities/conversation_entity.dart';
import '../../domain/entities/chat_message_entity.dart';
import '../../domain/repositories/chat_repository.dart';
import '../models/conversation_model.dart';
import '../models/chat_message_model.dart';
import '../models/citation_model.dart';

class ChatRepositoryImpl implements ChatRepository {
  final ApiClient apiClient;

  ChatRepositoryImpl({required this.apiClient});

  @override
  Future<List<ConversationEntity>> getConversations() async {
    final response = await apiClient.get('/chat/conversations');
    final List<dynamic> data = response.data;
    return data
        .map((json) => ConversationModel.fromJson(json).toEntity())
        .toList();
  }

  @override
  Future<ConversationEntity> createConversation({String? title}) async {
    final response = await apiClient.post(
      '/chat/conversations',
      data: {'title': title ?? 'New Conversation'},
    );
    return ConversationModel.fromJson(response.data).toEntity();
  }

  @override
  Future<ConversationEntity> getConversation(String id) async {
    final response = await apiClient.get('/chat/conversations/$id');
    return ConversationModel.fromJson(response.data).toEntity();
  }

  @override
  Future<void> updateConversation(String id, String title) async {
    await apiClient.put(
      '/chat/conversations/$id',
      data: {'title': title},
    );
  }

  @override
  Future<void> deleteConversation(String id) async {
    await apiClient.delete('/chat/conversations/$id');
  }

  @override
  Future<List<ChatMessageEntity>> getMessages(String conversationId) async {
    final response =
        await apiClient.get('/chat/conversations/$conversationId/messages');
    final List<dynamic> data = response.data;
    return data
        .map((json) => ChatMessageModel.fromJson(json).toEntity())
        .toList();
  }

  @override
  Future<ChatMessageEntity> sendMessage(
      String conversationId, String content) async {
    final response = await apiClient.post(
      '/chat/conversations/$conversationId/messages',
      data: {'content': content},
    );
    return ChatMessageModel.fromJson(response.data).toEntity();
  }

  @override
  Stream<Map<String, dynamic>> sendMessageStream(
    String conversationId,
    String content,
  ) async* {
    // TODO: Implement SSE streaming
    // For now, use regular request and emit single result
    try {
      final message = await sendMessage(conversationId, content);
      yield {
        'type': 'done',
        'data': message,
      };
    } catch (e) {
      yield {
        'type': 'error',
        'data': e.toString(),
      };
    }
  }
}
