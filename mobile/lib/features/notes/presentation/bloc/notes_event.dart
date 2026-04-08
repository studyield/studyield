import 'package:equatable/equatable.dart';

abstract class NotesEvent extends Equatable {
  const NotesEvent();

  @override
  List<Object?> get props => [];
}

class LoadNotes extends NotesEvent {
  final String studySetId;

  const LoadNotes({required this.studySetId});

  @override
  List<Object?> get props => [studySetId];
}

class LoadNoteById extends NotesEvent {
  final String noteId;

  const LoadNoteById({required this.noteId});

  @override
  List<Object?> get props => [noteId];
}

class CreateNote extends NotesEvent {
  final String studySetId;
  final String title;
  final String content;
  final String sourceType;
  final String? summary;
  final List<String>? tags;

  const CreateNote({
    required this.studySetId,
    required this.title,
    required this.content,
    this.sourceType = 'manual',
    this.summary,
    this.tags,
  });

  @override
  List<Object?> get props => [studySetId, title, content, sourceType, summary, tags];
}

class UpdateNote extends NotesEvent {
  final String noteId;
  final String? title;
  final String? content;
  final String? summary;
  final List<String>? tags;

  const UpdateNote({
    required this.noteId,
    this.title,
    this.content,
    this.summary,
    this.tags,
  });

  @override
  List<Object?> get props => [noteId, title, content, summary, tags];
}

class DeleteNote extends NotesEvent {
  final String noteId;

  const DeleteNote({required this.noteId});

  @override
  List<Object?> get props => [noteId];
}

class TogglePinNote extends NotesEvent {
  final String noteId;

  const TogglePinNote({required this.noteId});

  @override
  List<Object?> get props => [noteId];
}

class GenerateAINotes extends NotesEvent {
  final String studySetId;
  final String? topic;

  const GenerateAINotes({
    required this.studySetId,
    this.topic,
  });

  @override
  List<Object?> get props => [studySetId, topic];
}

class SearchNotes extends NotesEvent {
  final String query;

  const SearchNotes({required this.query});

  @override
  List<Object?> get props => [query];
}

class FilterNotesByTag extends NotesEvent {
  final String? tag;

  const FilterNotesByTag({this.tag});

  @override
  List<Object?> get props => [tag];
}

class SortNotes extends NotesEvent {
  final String sortOption; // 'newest', 'oldest', 'title'

  const SortNotes({required this.sortOption});

  @override
  List<Object?> get props => [sortOption];
}
