import 'package:equatable/equatable.dart';

enum MessageRole { user, tutor }

class ChatMessageEntity extends Equatable {
  final String id;
  final MessageRole role;
  final String message;
  final DateTime createdAt;

  const ChatMessageEntity({
    required this.id,
    required this.role,
    required this.message,
    required this.createdAt,
  });

  @override
  List<Object?> get props => [id, role, message, createdAt];
}
