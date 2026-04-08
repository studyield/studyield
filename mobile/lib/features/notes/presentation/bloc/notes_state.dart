import 'package:equatable/equatable.dart';
import '../../domain/entities/note_entity.dart';

abstract class NotesState extends Equatable {
  const NotesState();

  @override
  List<Object?> get props => [];
}

class NotesInitial extends NotesState {}

class NotesLoading extends NotesState {}

class NotesLoaded extends NotesState {
  final List<NoteEntity> notes;
  final List<NoteEntity> filteredNotes;
  final String searchQuery;
  final String? selectedTag;
  final String sortOption;
  final List<String> allTags;

  const NotesLoaded({
    required this.notes,
    required this.filteredNotes,
    this.searchQuery = '',
    this.selectedTag,
    this.sortOption = 'newest',
    this.allTags = const [],
  });

  @override
  List<Object?> get props => [
        notes,
        filteredNotes,
        searchQuery,
        selectedTag,
        sortOption,
        allTags,
      ];

  NotesLoaded copyWith({
    List<NoteEntity>? notes,
    List<NoteEntity>? filteredNotes,
    String? searchQuery,
    String? selectedTag,
    String? sortOption,
    List<String>? allTags,
    bool clearSelectedTag = false,
  }) {
    return NotesLoaded(
      notes: notes ?? this.notes,
      filteredNotes: filteredNotes ?? this.filteredNotes,
      searchQuery: searchQuery ?? this.searchQuery,
      selectedTag: clearSelectedTag ? null : (selectedTag ?? this.selectedTag),
      sortOption: sortOption ?? this.sortOption,
      allTags: allTags ?? this.allTags,
    );
  }
}

class NoteDetailLoaded extends NotesState {
  final NoteEntity note;

  const NoteDetailLoaded({required this.note});

  @override
  List<Object?> get props => [note];
}

class NoteCreated extends NotesState {
  final NoteEntity note;

  const NoteCreated({required this.note});

  @override
  List<Object?> get props => [note];
}

class NoteUpdated extends NotesState {
  final NoteEntity note;

  const NoteUpdated({required this.note});

  @override
  List<Object?> get props => [note];
}

class NoteDeleted extends NotesState {}

class NotePinToggled extends NotesState {}

class AINotesGenerated extends NotesState {
  final List<NoteEntity> notes;

  const AINotesGenerated({required this.notes});

  @override
  List<Object?> get props => [notes];
}

class AINotesGenerating extends NotesState {
  final String message;

  const AINotesGenerating({this.message = 'Generating notes...'});

  @override
  List<Object?> get props => [message];
}

class NotesError extends NotesState {
  final String message;

  const NotesError({required this.message});

  @override
  List<Object?> get props => [message];
}
