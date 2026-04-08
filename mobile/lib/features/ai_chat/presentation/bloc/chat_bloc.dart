import 'package:flutter_bloc/flutter_bloc.dart';
import '../../domain/entities/chat_message_entity.dart';
import '../../domain/repositories/chat_repository.dart';
import 'chat_event.dart';
import 'chat_state.dart';

class ChatBloc extends Bloc<ChatEvent, ChatState> {
  final ChatRepository repository;

  ChatBloc({required this.repository}) : super(ChatInitial()) {
    on<LoadConversations>(_onLoadConversations);
    on<CreateConversation>(_onCreateConversation);
    on<LoadConversation>(_onLoadConversation);
    on<DeleteConversation>(_onDeleteConversation);
    on<LoadMessages>(_onLoadMessages);
    on<SendMessage>(_onSendMessage);
  }

  Future<void> _onLoadConversations(
    LoadConversations event,
    Emitter<ChatState> emit,
  ) async {
    emit(ChatLoading());

    try {
      final conversations = await repository.getConversations();
      emit(ConversationsLoaded(conversations: conversations));
    } catch (e) {
      emit(ChatError(message: e.toString()));
    }
  }

  Future<void> _onCreateConversation(
    CreateConversation event,
    Emitter<ChatState> emit,
  ) async {
    try {
      final conversation = await repository.createConversation(title: event.title);
      emit(ConversationCreated(conversation: conversation));
    } catch (e) {
      emit(ChatError(message: e.toString()));
    }
  }

  Future<void> _onLoadConversation(
    LoadConversation event,
    Emitter<ChatState> emit,
  ) async {
    emit(ChatLoading());

    try {
      final conversation = await repository.getConversation(event.conversationId);
      // After loading conversation, load its messages
      final messages = await repository.getMessages(event.conversationId);
      emit(MessagesLoaded(messages: messages));
    } catch (e) {
      emit(ChatError(message: e.toString()));
    }
  }

  Future<void> _onDeleteConversation(
    DeleteConversation event,
    Emitter<ChatState> emit,
  ) async {
    try {
      await repository.deleteConversation(event.conversationId);
      emit(ConversationDeleted(conversationId: event.conversationId));
    } catch (e) {
      emit(ChatError(message: e.toString()));
    }
  }

  Future<void> _onLoadMessages(
    LoadMessages event,
    Emitter<ChatState> emit,
  ) async {
    emit(ChatLoading());

    try {
      final messages = await repository.getMessages(event.conversationId);
      emit(MessagesLoaded(messages: messages));
    } catch (e) {
      emit(ChatError(message: e.toString()));
    }
  }

  Future<void> _onSendMessage(
    SendMessage event,
    Emitter<ChatState> emit,
  ) async {
    emit(MessageSending(content: event.content));

    try {
      if (event.useStreaming) {
        // Use streaming for real-time responses
        await for (final chunk in repository.sendMessageStream(
          event.conversationId,
          event.content,
        )) {
          if (chunk['type'] == 'content') {
            // Streaming content chunk
            emit(MessageStreaming(
              streamingContent: chunk['data'] as String,
              citations: const [],
            ));
          } else if (chunk['type'] == 'citation') {
            // Citation received
            // Update current streaming state with citation
          } else if (chunk['type'] == 'done') {
            // Message completed
            final message = chunk['data'] as ChatMessageEntity;
            emit(MessageSent(message: message));

            // Reload messages to show in list
            final messages = await repository.getMessages(event.conversationId);
            emit(MessagesLoaded(messages: messages));
          }
        }
      } else {
        // Non-streaming
        final message = await repository.sendMessage(
          event.conversationId,
          event.content,
        );
        emit(MessageSent(message: message));

        // Reload messages
        final messages = await repository.getMessages(event.conversationId);
        emit(MessagesLoaded(messages: messages));
      }
    } catch (e) {
      emit(ChatError(message: e.toString()));
    }
  }
}
