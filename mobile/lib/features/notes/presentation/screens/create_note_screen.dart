import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/widgets/buttons/primary_button.dart';
import '../bloc/notes_bloc.dart';
import '../bloc/notes_event.dart';
import '../bloc/notes_state.dart';

class CreateNoteScreen extends StatefulWidget {
  final String studySetId;
  final String studySetTitle;

  const CreateNoteScreen({
    super.key,
    required this.studySetId,
    required this.studySetTitle,
  });

  @override
  State<CreateNoteScreen> createState() => _CreateNoteScreenState();
}

class _CreateNoteScreenState extends State<CreateNoteScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _contentController = TextEditingController();
  final _tagsController = TextEditingController();

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
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'notes.createNoteTitle'.tr(),
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
      ),
      body: BlocListener<NotesBloc, NotesState>(
        listener: (context, state) {
          if (state is NoteCreated) {
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
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Title Field
                      TextFormField(
                        controller: _titleController,
                        decoration: InputDecoration(
                          labelText: 'notes.titleLabel'.tr(),
                          hintText: 'notes.titleHint'.tr(),
                          prefixIcon: const Icon(Icons.title),
                        ),
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) {
                            return 'notes.titleValidation'.tr();
                          }
                          return null;
                        },
                        textCapitalization: TextCapitalization.sentences,
                      ),

                      const SizedBox(height: 20),

                      // Content Field
                      TextFormField(
                        controller: _contentController,
                        decoration: InputDecoration(
                          labelText: 'notes.contentLabel'.tr(),
                          hintText: 'notes.contentHint'.tr(),
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
                        textCapitalization: TextCapitalization.sentences,
                      ),

                      const SizedBox(height: 20),

                      // Tags Field
                      TextFormField(
                        controller: _tagsController,
                        decoration: InputDecoration(
                          labelText: 'notes.tagsLabel'.tr(),
                          hintText: 'notes.tagsHint'.tr(),
                          prefixIcon: const Icon(Icons.tag),
                        ),
                        textCapitalization: TextCapitalization.none,
                      ),

                      const SizedBox(height: 16),

                      // Help Text
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppColors.secondary.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Icon(
                              Icons.info_outline,
                              size: 16,
                              color: AppColors.secondary,
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                'notes.markdownHelpText'.tr(),
                                style: AppTextStyles.bodySmall.copyWith(
                                  color: AppColors.grey700,
                                  fontSize: 11,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // Bottom Action Bar
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: theme.scaffoldBackgroundColor,
                  border: Border(
                    top: BorderSide(
                      color: theme.colorScheme.onSurface.withOpacity(0.1),
                    ),
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.05),
                      blurRadius: 10,
                      offset: const Offset(0, -2),
                    ),
                  ],
                ),
                child: SafeArea(
                  top: false,
                  child: PrimaryButton(
                    text: 'notes.createNoteSubmitButton'.tr(),
                    icon: Icons.check,
                    onPressed: _handleSubmit,
                    gradient: AppColors.greenGradient,
                  ),
                ),
              ),
            ],
          ),
        ),
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
            CreateNote(
              studySetId: widget.studySetId,
              title: _titleController.text.trim(),
              content: _contentController.text.trim(),
              sourceType: 'manual',
              tags: tags.isNotEmpty ? tags : null,
            ),
          );
    }
  }
}
