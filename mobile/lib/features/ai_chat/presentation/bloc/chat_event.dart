import 'package:equatable/equatable.dart';

abstract class ChatEvent extends Equatable {
  const ChatEvent();

  @override
  List<Object?> get props => [];
}

// Conversation events
class LoadConversations extends ChatEvent {
  const LoadConversations();
}

class CreateConversation extends ChatEvent {
  final String? title;

  const CreateConversation({this.title});

  @override
  List<Object?> get props => [title];
}

class LoadConversation extends ChatEvent {
  final String conversationId;

  const LoadConversation({required this.conversationId});

  @override
  List<Object?> get props => [conversationId];
}

class DeleteConversation extends ChatEvent {
  final String conversationId;

  const DeleteConversation({required this.conversationId});

  @override
  List<Object?> get props => [conversationId];
}

// Message events
class LoadMessages extends ChatEvent {
  final String conversationId;

  const LoadMessages({required this.conversationId});

  @override
  List<Object?> get props => [conversationId];
}

class SendMessage extends ChatEvent {
  final String conversationId;
  final String content;
  final bool useStreaming;

  const SendMessage({
    required this.conversationId,
    required this.content,
    this.useStreaming = true,
  });

  @override
  List<Object?> get props => [conversationId, content, useStreaming];
}

class StopStreaming extends ChatEvent {
  const StopStreaming();
}
