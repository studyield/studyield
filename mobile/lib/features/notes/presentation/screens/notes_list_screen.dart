import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_dimensions.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/widgets/buttons/primary_button.dart';
import '../../domain/entities/note_entity.dart';
import '../bloc/notes_bloc.dart';
import '../bloc/notes_event.dart';
import '../bloc/notes_state.dart';
import '../widgets/note_card.dart';
import '../widgets/note_search_bar.dart';
import '../widgets/note_filters.dart';
import 'note_detail_screen.dart';
import 'create_note_screen.dart';
import 'generate_ai_notes_screen.dart';
import 'study_set_mind_map_screen.dart';
import 'mind_map_history_screen.dart';

class NotesListScreen extends StatefulWidget {
  final String studySetId;
  final String studySetTitle;

  const NotesListScreen({
    super.key,
    required this.studySetId,
    required this.studySetTitle,
  });

  @override
  State<NotesListScreen> createState() => _NotesListScreenState();
}

class _NotesListScreenState extends State<NotesListScreen> {
  @override
  void initState() {
    super.initState();
    context.read<NotesBloc>().add(LoadNotes(studySetId: widget.studySetId));
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: theme.scaffoldBackgroundColor,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'notes.title'.tr(),
              style: AppTextStyles.titleMedium.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            Text(
              widget.studySetTitle,
              style: AppTextStyles.bodySmall.copyWith(
                color: AppColors.grey600,
              ),
            ),
          ],
        ),
        actions: [
          BlocBuilder<NotesBloc, NotesState>(
            builder: (context, state) {
              if (state is NotesLoaded && state.notes.isNotEmpty) {
                return Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    IconButton(
                      icon: const Icon(Icons.history),
                      tooltip: 'notes.mindMapHistoryTooltip'.tr(),
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => const MindMapHistoryScreen(),
                          ),
                        );
                      },
                    ),
                    IconButton(
                      icon: const Icon(Icons.account_tree_outlined),
                      tooltip: 'notes.mindMapTooltip'.tr(),
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => StudySetMindMapScreen(
                              studySetId: widget.studySetId,
                              studySetTitle: widget.studySetTitle,
                            ),
                          ),
                        );
                      },
                    ),
                  ],
                );
              }
              return const SizedBox.shrink();
            },
          ),
        ],
      ),
      body: BlocConsumer<NotesBloc, NotesState>(
        listener: (context, state) {
          if (state is NotesError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: AppColors.error,
              ),
            );
          } else if (state is NoteCreated) {
            context.read<NotesBloc>().add(LoadNotes(studySetId: widget.studySetId));
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('notes.createSuccess'.tr()),
                backgroundColor: AppColors.success,
              ),
            );
          } else if (state is NoteDeleted) {
            context.read<NotesBloc>().add(LoadNotes(studySetId: widget.studySetId));
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('notes.deleteSuccess'.tr()),
                backgroundColor: AppColors.success,
              ),
            );
          } else if (state is NotePinToggled) {
            context.read<NotesBloc>().add(LoadNotes(studySetId: widget.studySetId));
          } else if (state is AINotesGenerated) {
            context.read<NotesBloc>().add(LoadNotes(studySetId: widget.studySetId));
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('notes.aiNotesGeneratedSuccess'.tr(namedArgs: {'count': '${state.notes.length}'})),
                backgroundColor: AppColors.success,
              ),
            );
          }
        },
        builder: (context, state) {
          if (state is NotesLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (state is NotesLoaded) {
            return Column(
              children: [
                // Action Buttons
                Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () => _navigateToGenerateAINotes(context),
                          icon: const Icon(Icons.auto_awesome, size: 18),
                          label: Text('notes.aiGenerateButton'.tr()),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: AppColors.secondary,
                            side: BorderSide(color: AppColors.secondary.withOpacity(0.3)),
                            padding: const EdgeInsets.symmetric(vertical: 12),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: () => _navigateToCreateNote(context),
                          icon: const Icon(Icons.add, size: 18),
                          label: Text('notes.addNoteButton'.tr()),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 12),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                // Search and Filters
                if (state.notes.isNotEmpty) ...[
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16.0),
                    child: NoteSearchBar(
                      initialQuery: state.searchQuery,
                      onSearch: (query) {
                        context.read<NotesBloc>().add(SearchNotes(query: query));
                      },
                    ),
                  ),
                  const SizedBox(height: 12),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16.0),
                    child: NoteFilters(
                      allTags: state.allTags,
                      selectedTag: state.selectedTag,
                      sortOption: state.sortOption,
                      onTagSelected: (tag) {
                        context.read<NotesBloc>().add(FilterNotesByTag(tag: tag));
                      },
                      onSortChanged: (sort) {
                        context.read<NotesBloc>().add(SortNotes(sortOption: sort));
                      },
                    ),
                  ),
                  const SizedBox(height: 16),
                ],

                // Notes List
                Expanded(
                  child: _buildNotesList(state),
                ),
              ],
            );
          }

          return Center(
            child: Text('common.errorGeneric'.tr()),
          );
        },
      ),
    );
  }

  Widget _buildNotesList(NotesLoaded state) {
    if (state.notes.isEmpty) {
      return _buildEmptyState();
    }

    if (state.filteredNotes.isEmpty) {
      return _buildNoResultsState();
    }

    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      itemCount: state.filteredNotes.length,
      itemBuilder: (context, index) {
        final note = state.filteredNotes[index];
        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: NoteCard(
            note: note,
            onTap: () => _navigateToNoteDetail(context, note),
            onPin: () {
              context.read<NotesBloc>().add(TogglePinNote(noteId: note.id));
            },
            onDelete: () => _showDeleteConfirmation(context, note),
            onTagTap: (tag) {
              context.read<NotesBloc>().add(FilterNotesByTag(tag: tag));
            },
          ),
        );
      },
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.note_outlined,
              size: 64,
              color: AppColors.grey400,
            ),
            const SizedBox(height: 16),
            Text(
              'notes.emptyStateTitle'.tr(),
              style: AppTextStyles.titleLarge.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'notes.emptyStateSubtitle'.tr(),
              style: AppTextStyles.bodyMedium.copyWith(
                color: AppColors.grey600,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                OutlinedButton.icon(
                  onPressed: () => _navigateToGenerateAINotes(context),
                  icon: const Icon(Icons.auto_awesome, size: 18),
                  label: Text('notes.aiGenerateButton'.tr()),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.secondary,
                  ),
                ),
                const SizedBox(width: 12),
                ElevatedButton.icon(
                  onPressed: () => _navigateToCreateNote(context),
                  icon: const Icon(Icons.add, size: 18),
                  label: Text('notes.createManuallyButton'.tr()),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNoResultsState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.search_off,
              size: 64,
              color: AppColors.grey400,
            ),
            const SizedBox(height: 16),
            Text(
              'notes.noSearchResultsTitle'.tr(),
              style: AppTextStyles.titleMedium.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'notes.noSearchResultsSubtitle'.tr(),
              style: AppTextStyles.bodyMedium.copyWith(
                color: AppColors.grey600,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  void _navigateToCreateNote(BuildContext context) {
    final bloc = context.read<NotesBloc>();
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => BlocProvider.value(
          value: bloc,
          child: CreateNoteScreen(
            studySetId: widget.studySetId,
            studySetTitle: widget.studySetTitle,
          ),
        ),
      ),
    );
  }

  void _navigateToGenerateAINotes(BuildContext context) {
    final bloc = context.read<NotesBloc>();
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => BlocProvider.value(
          value: bloc,
          child: GenerateAINotesScreen(
            studySetId: widget.studySetId,
            studySetTitle: widget.studySetTitle,
          ),
        ),
      ),
    );
  }

  void _navigateToNoteDetail(BuildContext context, NoteEntity note) {
    final bloc = context.read<NotesBloc>();
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => BlocProvider.value(
          value: bloc,
          child: NoteDetailScreen(
            noteId: note.id,
            studySetId: widget.studySetId,
          ),
        ),
      ),
    );
  }

  void _showDeleteConfirmation(BuildContext context, NoteEntity note) {
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text('notes.deleteConfirmationTitle'.tr()),
        content: Text('notes.deleteConfirmationMessage'.tr(namedArgs: {'title': note.title})),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: Text('common.cancel'.tr()),
          ),
          TextButton(
            onPressed: () {
              context.read<NotesBloc>().add(DeleteNote(noteId: note.id));
              Navigator.pop(dialogContext);
            },
            child: Text(
              'common.delete'.tr(),
              style: const TextStyle(color: AppColors.error),
            ),
          ),
        ],
      ),
    );
  }
}
