import 'package:equatable/equatable.dart';

class NoteEntity extends Equatable {
  final String id;
  final String studySetId;
  final String title;
  final String content;
  final String sourceType; // 'manual', 'ai_generated', 'document_upload', 'teaching_moment'
  final String? summary;
  final List<String> tags;
  final bool isPinned;
  final DateTime createdAt;
  final DateTime updatedAt;

  const NoteEntity({
    required this.id,
    required this.studySetId,
    required this.title,
    required this.content,
    required this.sourceType,
    this.summary,
    this.tags = const [],
    this.isPinned = false,
    required this.createdAt,
    required this.updatedAt,
  });

  @override
  List<Object?> get props => [
        id,
        studySetId,
        title,
        content,
        sourceType,
        summary,
        tags,
        isPinned,
        createdAt,
        updatedAt,
      ];

  NoteEntity copyWith({
    String? id,
    String? studySetId,
    String? title,
    String? content,
    String? sourceType,
    String? summary,
    List<String>? tags,
    bool? isPinned,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return NoteEntity(
      id: id ?? this.id,
      studySetId: studySetId ?? this.studySetId,
      title: title ?? this.title,
      content: content ?? this.content,
      sourceType: sourceType ?? this.sourceType,
      summary: summary ?? this.summary,
      tags: tags ?? this.tags,
      isPinned: isPinned ?? this.isPinned,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
