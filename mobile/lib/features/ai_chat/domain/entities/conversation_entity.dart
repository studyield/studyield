import 'package:equatable/equatable.dart';

class ConversationEntity extends Equatable {
  final String id;
  final String userId;
  final String title;
  final String? lastMessage;
  final DateTime createdAt;
  final DateTime updatedAt;

  const ConversationEntity({
    required this.id,
    required this.userId,
    required this.title,
    this.lastMessage,
    required this.createdAt,
    required this.updatedAt,
  });

  @override
  List<Object?> get props => [
        id,
        userId,
        title,
        lastMessage,
        createdAt,
        updatedAt,
      ];
}
