import 'package:equatable/equatable.dart';
import '../../domain/entities/conversation_entity.dart';
import '../../domain/entities/chat_message_entity.dart';
import '../../domain/entities/citation_entity.dart';

abstract class ChatState extends Equatable {
  const ChatState();

  @override
  List<Object?> get props => [];
}

class ChatInitial extends ChatState {}

class ChatLoading extends ChatState {}

// Conversations
class ConversationsLoaded extends ChatState {
  final List<ConversationEntity> conversations;

  const ConversationsLoaded({required this.conversations});

  @override
  List<Object?> get props => [conversations];
}

class ConversationCreated extends ChatState {
  final ConversationEntity conversation;

  const ConversationCreated({required this.conversation});

  @override
  List<Object?> get props => [conversation];
}

class ConversationDeleted extends ChatState {
  final String conversationId;

  const ConversationDeleted({required this.conversationId});

  @override
  List<Object?> get props => [conversationId];
}

// Messages
class MessagesLoaded extends ChatState {
  final List<ChatMessageEntity> messages;

  const MessagesLoaded({required this.messages});

  @override
  List<Object?> get props => [messages];
}

class MessageSending extends ChatState {
  final String content;

  const MessageSending({required this.content});

  @override
  List<Object?> get props => [content];
}

class MessageStreaming extends ChatState {
  final String streamingContent;
  final List<CitationEntity> citations;

  const MessageStreaming({
    required this.streamingContent,
    this.citations = const [],
  });

  @override
  List<Object?> get props => [streamingContent, citations];
}

class MessageSent extends ChatState {
  final ChatMessageEntity message;

  const MessageSent({required this.message});

  @override
  List<Object?> get props => [message];
}

// Error
class ChatError extends ChatState {
  final String message;

  const ChatError({required this.message});

  @override
  List<Object?> get props => [message];
}
