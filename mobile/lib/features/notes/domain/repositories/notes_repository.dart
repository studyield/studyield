import '../entities/note_entity.dart';

abstract class NotesRepository {
  Future<List<NoteEntity>> getNotes(String studySetId);
  Future<NoteEntity> getNoteById(String noteId);
  Future<NoteEntity> createNote({
    required String studySetId,
    required String title,
    required String content,
    required String sourceType,
    String? summary,
    List<String>? tags,
  });
  Future<NoteEntity> updateNote({
    required String noteId,
    String? title,
    String? content,
    String? summary,
    List<String>? tags,
  });
  Future<void> deleteNote(String noteId);
  Future<void> togglePin(String noteId);
  Future<List<NoteEntity>> generateAINotes({
    required String studySetId,
    String? topic,
  });
}
