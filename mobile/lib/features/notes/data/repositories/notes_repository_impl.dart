import '../../../../core/network/api_client.dart';
import '../../domain/entities/note_entity.dart';
import '../../domain/repositories/notes_repository.dart';
import '../models/note_model.dart';

class NotesRepositoryImpl implements NotesRepository {
  final ApiClient apiClient;

  NotesRepositoryImpl({required this.apiClient});

  @override
  Future<List<NoteEntity>> getNotes(String studySetId) async {
    try {
      final response = await apiClient.get('/study-sets/$studySetId/notes');
      final List<dynamic> notesData = response.data as List<dynamic>;
      return notesData
          .map((json) => NoteModel.fromJson(json as Map<String, dynamic>).toEntity())
          .toList();
    } catch (e) {
      throw Exception('Failed to load notes: $e');
    }
  }

  @override
  Future<NoteEntity> getNoteById(String noteId) async {
    try {
      final response = await apiClient.get('/notes/$noteId');
      return NoteModel.fromJson(response.data as Map<String, dynamic>).toEntity();
    } catch (e) {
      throw Exception('Failed to load note: $e');
    }
  }

  @override
  Future<NoteEntity> createNote({
    required String studySetId,
    required String title,
    required String content,
    required String sourceType,
    String? summary,
    List<String>? tags,
  }) async {
    try {
      final response = await apiClient.post(
        '/study-sets/$studySetId/notes',
        data: {
          'studySetId': studySetId,
          'title': title,
          'content': content,
          'sourceType': sourceType,
          if (summary != null) 'summary': summary,
          if (tags != null && tags.isNotEmpty) 'tags': tags,
        },
      );
      return NoteModel.fromJson(response.data as Map<String, dynamic>).toEntity();
    } catch (e) {
      throw Exception('Failed to create note: $e');
    }
  }

  @override
  Future<NoteEntity> updateNote({
    required String noteId,
    String? title,
    String? content,
    String? summary,
    List<String>? tags,
  }) async {
    try {
      final response = await apiClient.put(
        '/notes/$noteId',
        data: {
          if (title != null) 'title': title,
          if (content != null) 'content': content,
          if (summary != null) 'summary': summary,
          if (tags != null) 'tags': tags,
        },
      );
      return NoteModel.fromJson(response.data as Map<String, dynamic>).toEntity();
    } catch (e) {
      throw Exception('Failed to update note: $e');
    }
  }

  @override
  Future<void> deleteNote(String noteId) async {
    try {
      await apiClient.delete('/notes/$noteId');
    } catch (e) {
      throw Exception('Failed to delete note: $e');
    }
  }

  @override
  Future<void> togglePin(String noteId) async {
    try {
      await apiClient.post('/notes/$noteId/pin');
    } catch (e) {
      throw Exception('Failed to toggle pin: $e');
    }
  }

  @override
  Future<List<NoteEntity>> generateAINotes({
    required String studySetId,
    String? topic,
  }) async {
    try {
      // Backend doesn't have /generate endpoint yet
      // For now, create a single note with AI-generated content
      final note = await createNote(
        studySetId: studySetId,
        title: topic ?? 'AI Generated Note',
        content: 'AI generated content based on: ${topic ?? "study materials"}',
        sourceType: 'ai_generated',
        summary: 'This is an AI generated summary',
        tags: ['ai-generated'],
      );
      return [note];
    } catch (e) {
      throw Exception('Failed to generate AI notes: $e');
    }
  }
}
