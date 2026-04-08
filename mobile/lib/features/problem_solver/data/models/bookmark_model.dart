import '../../domain/entities/bookmark_entity.dart';
import 'problem_session_model.dart';

class BookmarkModel extends BookmarkEntity {
  const BookmarkModel({
    required super.id,
    required super.sessionId,
    super.session,
    super.tags,
    super.notes,
    required super.createdAt,
    super.updatedAt,
  });

  factory BookmarkModel.fromJson(Map<String, dynamic> json) {
    return BookmarkModel(
      id: json['id'] ?? '',
      sessionId: json['sessionId'] ?? '',
      session: json['session'] != null
          ? ProblemSessionModel.fromJson(json['session']).toEntity()
          : null,
      tags: json['tags'] != null
          ? List<String>.from(json['tags'])
          : [],
      notes: json['notes'],
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'])
          : null,
    );
  }

  BookmarkEntity toEntity() => this;
}
