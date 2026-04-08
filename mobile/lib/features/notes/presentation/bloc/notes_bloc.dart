import 'package:flutter_bloc/flutter_bloc.dart';
import '../../domain/entities/note_entity.dart';
import '../../domain/repositories/notes_repository.dart';
import 'notes_event.dart';
import 'notes_state.dart';

class NotesBloc extends Bloc<NotesEvent, NotesState> {
  final NotesRepository repository;

  NotesBloc({required this.repository}) : super(NotesInitial()) {
    on<LoadNotes>(_onLoadNotes);
    on<LoadNoteById>(_onLoadNoteById);
    on<CreateNote>(_onCreateNote);
    on<UpdateNote>(_onUpdateNote);
    on<DeleteNote>(_onDeleteNote);
    on<TogglePinNote>(_onTogglePinNote);
    on<GenerateAINotes>(_onGenerateAINotes);
    on<SearchNotes>(_onSearchNotes);
    on<FilterNotesByTag>(_onFilterNotesByTag);
    on<SortNotes>(_onSortNotes);
  }

  Future<void> _onLoadNotes(LoadNotes event, Emitter<NotesState> emit) async {
    emit(NotesLoading());
    try {
      final notes = await repository.getNotes(event.studySetId);
      final allTags = _extractAllTags(notes);
      final sortedNotes = _sortNotes(notes, 'newest');
      emit(NotesLoaded(
        notes: notes,
        filteredNotes: sortedNotes,
        allTags: allTags,
      ));
    } catch (e) {
      emit(NotesError(message: e.toString()));
    }
  }

  Future<void> _onLoadNoteById(LoadNoteById event, Emitter<NotesState> emit) async {
    emit(NotesLoading());
    try {
      final note = await repository.getNoteById(event.noteId);
      emit(NoteDetailLoaded(note: note));
    } catch (e) {
      emit(NotesError(message: e.toString()));
    }
  }

  Future<void> _onCreateNote(CreateNote event, Emitter<NotesState> emit) async {
    try {
      final note = await repository.createNote(
        studySetId: event.studySetId,
        title: event.title,
        content: event.content,
        sourceType: event.sourceType,
        summary: event.summary,
        tags: event.tags,
      );
      emit(NoteCreated(note: note));
    } catch (e) {
      emit(NotesError(message: e.toString()));
    }
  }

  Future<void> _onUpdateNote(UpdateNote event, Emitter<NotesState> emit) async {
    try {
      final note = await repository.updateNote(
        noteId: event.noteId,
        title: event.title,
        content: event.content,
        summary: event.summary,
        tags: event.tags,
      );
      emit(NoteUpdated(note: note));
    } catch (e) {
      emit(NotesError(message: e.toString()));
    }
  }

  Future<void> _onDeleteNote(DeleteNote event, Emitter<NotesState> emit) async {
    try {
      await repository.deleteNote(event.noteId);
      emit(NoteDeleted());
    } catch (e) {
      emit(NotesError(message: e.toString()));
    }
  }

  Future<void> _onTogglePinNote(TogglePinNote event, Emitter<NotesState> emit) async {
    try {
      await repository.togglePin(event.noteId);
      emit(NotePinToggled());
    } catch (e) {
      emit(NotesError(message: e.toString()));
    }
  }

  Future<void> _onGenerateAINotes(GenerateAINotes event, Emitter<NotesState> emit) async {
    emit(const AINotesGenerating(message: 'Generating notes with AI...'));
    try {
      final notes = await repository.generateAINotes(
        studySetId: event.studySetId,
        topic: event.topic,
      );
      emit(AINotesGenerated(notes: notes));
    } catch (e) {
      emit(NotesError(message: e.toString()));
    }
  }

  void _onSearchNotes(SearchNotes event, Emitter<NotesState> emit) {
    if (state is NotesLoaded) {
      final currentState = state as NotesLoaded;
      final filtered = _applyFilters(
        currentState.notes,
        event.query,
        currentState.selectedTag,
        currentState.sortOption,
      );
      emit(currentState.copyWith(
        searchQuery: event.query,
        filteredNotes: filtered,
      ));
    }
  }

  void _onFilterNotesByTag(FilterNotesByTag event, Emitter<NotesState> emit) {
    if (state is NotesLoaded) {
      final currentState = state as NotesLoaded;
      final filtered = _applyFilters(
        currentState.notes,
        currentState.searchQuery,
        event.tag,
        currentState.sortOption,
      );
      emit(currentState.copyWith(
        selectedTag: event.tag,
        filteredNotes: filtered,
        clearSelectedTag: event.tag == null,
      ));
    }
  }

  void _onSortNotes(SortNotes event, Emitter<NotesState> emit) {
    if (state is NotesLoaded) {
      final currentState = state as NotesLoaded;
      final filtered = _applyFilters(
        currentState.notes,
        currentState.searchQuery,
        currentState.selectedTag,
        event.sortOption,
      );
      emit(currentState.copyWith(
        sortOption: event.sortOption,
        filteredNotes: filtered,
      ));
    }
  }

  List<NoteEntity> _applyFilters(
    List<NoteEntity> notes,
    String searchQuery,
    String? selectedTag,
    String sortOption,
  ) {
    var filtered = List<NoteEntity>.from(notes);

    // Apply search filter
    if (searchQuery.isNotEmpty) {
      final query = searchQuery.toLowerCase();
      filtered = filtered.where((note) {
        return note.title.toLowerCase().contains(query) ||
            note.content.toLowerCase().contains(query) ||
            note.tags.any((tag) => tag.toLowerCase().contains(query));
      }).toList();
    }

    // Apply tag filter
    if (selectedTag != null && selectedTag.isNotEmpty) {
      filtered = filtered.where((note) => note.tags.contains(selectedTag)).toList();
    }

    // Apply sorting
    return _sortNotes(filtered, sortOption);
  }

  List<NoteEntity> _sortNotes(List<NoteEntity> notes, String sortOption) {
    final sorted = List<NoteEntity>.from(notes);

    // Pinned notes always first
    sorted.sort((a, b) {
      if (a.isPinned != b.isPinned) {
        return a.isPinned ? -1 : 1;
      }

      // Then apply sort option
      switch (sortOption) {
        case 'newest':
          return b.updatedAt.compareTo(a.updatedAt);
        case 'oldest':
          return a.updatedAt.compareTo(b.updatedAt);
        case 'title':
          return a.title.toLowerCase().compareTo(b.title.toLowerCase());
        default:
          return b.updatedAt.compareTo(a.updatedAt);
      }
    });

    return sorted;
  }

  List<String> _extractAllTags(List<NoteEntity> notes) {
    final tagsSet = <String>{};
    for (final note in notes) {
      tagsSet.addAll(note.tags);
    }
    final tags = tagsSet.toList();
    tags.sort();
    return tags;
  }
}
