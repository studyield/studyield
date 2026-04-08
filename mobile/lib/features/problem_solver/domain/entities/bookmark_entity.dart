import 'package:equatable/equatable.dart';
import 'problem_session_entity.dart';

class BookmarkEntity extends Equatable {
  final String id;
  final String sessionId;
  final ProblemSessionEntity? session;
  final List<String> tags;
  final String? notes;
  final DateTime createdAt;
  final DateTime? updatedAt;

  const BookmarkEntity({
    required this.id,
    required this.sessionId,
    this.session,
    this.tags = const [],
    this.notes,
    required this.createdAt,
    this.updatedAt,
  });

  @override
  List<Object?> get props => [
        id,
        sessionId,
        session,
        tags,
        notes,
        createdAt,
        updatedAt,
      ];
}
