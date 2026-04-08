import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:intl/intl.dart' as intl;
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_dimensions.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../bloc/notes_bloc.dart';
import '../bloc/notes_event.dart';
import '../bloc/notes_state.dart';
import '../widgets/share_note_modal.dart';
import 'edit_note_screen.dart';
import 'presentation_view_screen.dart';
import 'mind_map_screen.dart';

class NoteDetailScreen extends StatefulWidget {
  final String noteId;
  final String studySetId;

  const NoteDetailScreen({
    super.key,
    required this.noteId,
    required this.studySetId,
  });

  @override
  State<NoteDetailScreen> createState() => _NoteDetailScreenState();
}

class _NoteDetailScreenState extends State<NoteDetailScreen> {
  @override
  void initState() {
    super.initState();
    context.read<NotesBloc>().add(LoadNoteById(noteId: widget.noteId));
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
        actions: [
          BlocBuilder<NotesBloc, NotesState>(
            builder: (context, state) {
              if (state is NoteDetailLoaded) {
                return Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.account_tree),
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => MindMapScreen(
                              noteId: state.note.id,
                              noteTitle: state.note.title,
                            ),
                          ),
                        );
                      },
                      tooltip: 'notes.mindMapTooltip'.tr(),
                    ),
                    IconButton(
                      icon: const Icon(Icons.slideshow),
                      onPressed: () => _openPresentation(context, state.note),
                      tooltip: 'notes.mindMapTooltip'.tr(),
                    ),
                    IconButton(
                      icon: Icon(
                        state.note.isPinned
                            ? Icons.push_pin
                            : Icons.push_pin_outlined,
                      ),
                      onPressed: () {
                        context.read<NotesBloc>().add(
                              TogglePinNote(noteId: widget.noteId),
                            );
                        context.read<NotesBloc>().add(
                              LoadNoteById(noteId: widget.noteId),
                            );
                      },
                    ),
                    IconButton(
                      icon: const Icon(Icons.share),
                      onPressed: () => _showShareModal(context, state.note),
                    ),
                    IconButton(
                      icon: const Icon(Icons.edit),
                      onPressed: () => _navigateToEdit(context, state.note.id),
                    ),
                    IconButton(
                      icon: const Icon(Icons.delete),
                      onPressed: () => _showDeleteConfirmation(context),
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
          } else if (state is NoteDeleted) {
            Navigator.pop(context);
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('notes.deleteSuccess'.tr()),
                backgroundColor: AppColors.success,
              ),
            );
          } else if (state is NoteUpdated) {
            context.read<NotesBloc>().add(LoadNoteById(noteId: widget.noteId));
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('notes.updateSuccess'.tr()),
                backgroundColor: AppColors.success,
              ),
            );
          }
        },
        builder: (context, state) {
          if (state is NotesLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (state is NoteDetailLoaded) {
            final note = state.note;
            final isAIGenerated = note.sourceType == 'ai_generated';

            return SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Badges Row
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      if (note.isPinned)
                        _buildBadge(
                          icon: Icons.push_pin,
                          label: 'notes.pinnedBadge'.tr(),
                          color: AppColors.accent,
                        ),
                      if (note.sourceType != 'manual')
                        _buildBadge(
                          icon: isAIGenerated ? Icons.auto_awesome : Icons.upload_file,
                          label: note.sourceType.replaceAll('_', ' '),
                          color: isAIGenerated ? AppColors.purple : AppColors.secondary,
                        ),
                    ],
                  ),

                  const SizedBox(height: 16),

                  // Title
                  Text(
                    note.title,
                    style: AppTextStyles.headlineMedium.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),

                  const SizedBox(height: 8),

                  // Date
                  Text(
                    'notes.updatedDateLabel'.tr(namedArgs: {'date': intl.DateFormat('MMM d, yyyy').format(note.updatedAt)}),
                    style: AppTextStyles.bodySmall.copyWith(
                      color: AppColors.grey600,
                    ),
                  ),

                  // Summary
                  if (note.summary != null && note.summary!.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.purple.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: AppColors.purple.withOpacity(0.3),
                        ),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Icon(
                            Icons.auto_awesome,
                            size: 16,
                            color: AppColors.purple,
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              note.summary!,
                              style: AppTextStyles.bodySmall.copyWith(
                                color: AppColors.purple,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],

                  // Tags
                  if (note.tags.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: note.tags.map((tag) {
                        return Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            '#$tag',
                            style: AppTextStyles.bodySmall.copyWith(
                              color: AppColors.primary,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ],

                  const SizedBox(height: 24),

                  // Content
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: theme.cardColor,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: theme.colorScheme.onSurface.withOpacity(0.1),
                      ),
                    ),
                    child: MarkdownBody(
                      data: note.content,
                      styleSheet: MarkdownStyleSheet(
                        p: AppTextStyles.bodyMedium,
                        h1: AppTextStyles.headlineMedium.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                        h2: AppTextStyles.titleLarge.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                        h3: AppTextStyles.titleMedium.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 24),
                ],
              ),
            );
          }

          return Center(
            child: Text('common.errorGeneric'.tr()),
          );
        },
      ),
    );
  }

  Widget _buildBadge({
    required IconData icon,
    required String label,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(
          color: color.withOpacity(0.3),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 4),
          Text(
            label,
            style: AppTextStyles.bodySmall.copyWith(
              fontSize: 11,
              color: color,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  void _openPresentation(BuildContext context, note) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => PresentationViewScreen(note: note),
      ),
    );
  }

  void _showShareModal(BuildContext context, note) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return ShareNoteModal(
          note: note,
          shareUrl: 'http://localhost:5189/dashboard/study-sets/${widget.studySetId}/notes/${widget.noteId}',
        );
      },
    );
  }

  void _navigateToEdit(BuildContext context, String noteId) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => BlocProvider.value(
          value: context.read<NotesBloc>(),
          child: EditNoteScreen(
            noteId: noteId,
            studySetId: widget.studySetId,
          ),
        ),
      ),
    );
  }

  void _showDeleteConfirmation(BuildContext context) {
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text('notes.deleteConfirmationTitle'.tr()),
        content: Text('notes.deleteConfirmationMessage'.tr(namedArgs: {'title': ''})),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: Text('common.cancel'.tr()),
          ),
          TextButton(
            onPressed: () {
              context.read<NotesBloc>().add(DeleteNote(noteId: widget.noteId));
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
