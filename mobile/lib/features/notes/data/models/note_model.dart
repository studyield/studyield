import '../../domain/entities/note_entity.dart';

class NoteModel extends NoteEntity {
  const NoteModel({
    required super.id,
    required super.studySetId,
    required super.title,
    required super.content,
    required super.sourceType,
    super.summary,
    super.tags,
    super.isPinned,
    required super.createdAt,
    required super.updatedAt,
  });

  factory NoteModel.fromJson(Map<String, dynamic> json) {
    return NoteModel(
      id: json['id'] as String,
      studySetId: json['studySetId'] as String,
      title: json['title'] as String,
      content: json['content'] as String,
      sourceType: json['sourceType'] as String? ?? 'manual',
      summary: json['summary'] as String?,
      tags: json['tags'] != null
          ? List<String>.from(json['tags'] as List)
          : [],
      isPinned: json['isPinned'] as bool? ?? false,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'studySetId': studySetId,
      'title': title,
      'content': content,
      'sourceType': sourceType,
      'summary': summary,
      'tags': tags,
      'isPinned': isPinned,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  NoteEntity toEntity() {
    return NoteEntity(
      id: id,
      studySetId: studySetId,
      title: title,
      content: content,
      sourceType: sourceType,
      summary: summary,
      tags: tags,
      isPinned: isPinned,
      createdAt: createdAt,
      updatedAt: updatedAt,
    );
  }
}
