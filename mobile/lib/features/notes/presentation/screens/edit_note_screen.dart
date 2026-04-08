import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/widgets/buttons/primary_button.dart';
import '../../domain/entities/note_entity.dart';
import '../bloc/notes_bloc.dart';
import '../bloc/notes_event.dart';
import '../bloc/notes_state.dart';

class EditNoteScreen extends StatefulWidget {
  final String noteId;
  final String studySetId;

  const EditNoteScreen({
    super.key,
    required this.noteId,
    required this.studySetId,
  });

  @override
  State<EditNoteScreen> createState() => _EditNoteScreenState();
}

class _EditNoteScreenState extends State<EditNoteScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _titleController;
  late TextEditingController _contentController;
  late TextEditingController _tagsController;
  NoteEntity? _note;

  @override
  void initState() {
    super.initState();
    _titleController = TextEditingController();
    _contentController = TextEditingController();
    _tagsController = TextEditingController();
    context.read<NotesBloc>().add(LoadNoteById(noteId: widget.noteId));
  }

  @override
  void dispose() {
    _titleController.dispose();
    _contentController.dispose();
    _tagsController.dispose();
    super.dispose();
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
          icon: const Icon(Icons.close),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'notes.editNoteTitle'.tr(),
          style: AppTextStyles.titleMedium.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: BlocConsumer<NotesBloc, NotesState>(
        listener: (context, state) {
          if (state is NoteDetailLoaded && _note == null) {
            setState(() {
              _note = state.note;
              _titleController.text = state.note.title;
              _contentController.text = state.note.content;
              _tagsController.text = state.note.tags.join(', ');
            });
          } else if (state is NoteUpdated) {
            Navigator.pop(context);
          } else if (state is NotesError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: AppColors.error,
              ),
            );
          }
        },
        builder: (context, state) {
          if (state is NotesLoading && _note == null) {
            return const Center(child: CircularProgressIndicator());
          }

          return Form(
            key: _formKey,
            child: Column(
              children: [
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        TextFormField(
                          controller: _titleController,
                          decoration: InputDecoration(
                            labelText: 'notes.titleLabel'.tr(),
                            prefixIcon: const Icon(Icons.title),
                          ),
                          validator: (value) {
                            if (value == null || value.trim().isEmpty) {
                              return 'notes.titleValidation'.tr();
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 20),
                        TextFormField(
                          controller: _contentController,
                          decoration: InputDecoration(
                            labelText: 'notes.contentLabel'.tr(),
                            prefixIcon: const Icon(Icons.notes),
                            alignLabelWithHint: true,
                          ),
                          maxLines: 15,
                          validator: (value) {
                            if (value == null || value.trim().isEmpty) {
                              return 'notes.contentValidation'.tr();
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 20),
                        TextFormField(
                          controller: _tagsController,
                          decoration: InputDecoration(
                            labelText: 'notes.tagsLabel'.tr(),
                            hintText: 'notes.tagsHintEdit'.tr(),
                            prefixIcon: const Icon(Icons.tag),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    border: Border(
                      top: BorderSide(
                        color: theme.colorScheme.onSurface.withOpacity(0.1),
                      ),
                    ),
                  ),
                  child: SafeArea(
                    top: false,
                    child: PrimaryButton(
                      text: 'notes.updateNoteButton'.tr(),
                      icon: Icons.check,
                      onPressed: _handleSubmit,
                      gradient: AppColors.greenGradient,
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  void _handleSubmit() {
    if (_formKey.currentState!.validate()) {
      final tags = _tagsController.text
          .split(',')
          .map((e) => e.trim())
          .where((e) => e.isNotEmpty)
          .toList();

      context.read<NotesBloc>().add(
            UpdateNote(
              noteId: widget.noteId,
              title: _titleController.text.trim(),
              content: _contentController.text.trim(),
              tags: tags.isNotEmpty ? tags : null,
            ),
          );
    }
  }
}
