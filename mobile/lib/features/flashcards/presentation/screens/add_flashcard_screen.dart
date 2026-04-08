import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_dimensions.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/widgets/buttons/primary_button.dart';
import '../../domain/entities/flashcard_entity.dart';
import '../bloc/flashcards_bloc.dart';
import '../bloc/flashcards_event.dart';

class AddFlashcardScreen extends StatefulWidget {
  final String studySetId;
  final FlashcardEntity? flashcard; // null for add, non-null for edit

  const AddFlashcardScreen({
    super.key,
    required this.studySetId,
    this.flashcard,
  });

  @override
  State<AddFlashcardScreen> createState() => _AddFlashcardScreenState();
}

class _AddFlashcardScreenState extends State<AddFlashcardScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _frontController;
  late final TextEditingController _backController;
  late final TextEditingController _notesController;
  late final TextEditingController _tagsController;

  bool get _isEditMode => widget.flashcard != null;

  @override
  void initState() {
    super.initState();
    _frontController = TextEditingController(
      text: widget.flashcard?.front ?? '',
    );
    _backController = TextEditingController(
      text: widget.flashcard?.back ?? '',
    );
    _notesController = TextEditingController(
      text: widget.flashcard?.notes ?? '',
    );
    _tagsController = TextEditingController(
      text: widget.flashcard?.tags.join(', ') ?? '',
    );
  }

  @override
  void dispose() {
    _frontController.dispose();
    _backController.dispose();
    _notesController.dispose();
    _tagsController.dispose();
    super.dispose();
  }

  void _handleSave() {
    if (_formKey.currentState!.validate()) {
      final tags = _tagsController.text.isEmpty
          ? null
          : _tagsController.text
              .split(',')
              .map((e) => e.trim())
              .where((e) => e.isNotEmpty)
              .toList();

      if (_isEditMode && widget.flashcard != null) {
        context.read<FlashcardsBloc>().add(
              UpdateFlashcard(
                id: widget.flashcard!.id,
                studySetId: widget.studySetId,
                front: _frontController.text,
                back: _backController.text,
                notes: _notesController.text.isEmpty ? null : _notesController.text,
                tags: tags,
              ),
            );
      } else {
        context.read<FlashcardsBloc>().add(
              CreateFlashcard(
                studySetId: widget.studySetId,
                front: _frontController.text,
                back: _backController.text,
                notes: _notesController.text.isEmpty ? null : _notesController.text,
                tags: tags,
              ),
            );
      }

      Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    SystemChrome.setSystemUIOverlayStyle(
      SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: isDark ? Brightness.light : Brightness.dark,
        statusBarBrightness: isDark ? Brightness.dark : Brightness.light,
      ),
    );

    return Scaffold(
      appBar: AppBar(
        backgroundColor: theme.scaffoldBackgroundColor,
        elevation: 0,
        leading: IconButton(
          icon: Icon(
            Icons.close,
            color: theme.colorScheme.onSurface,
          ),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(
          _isEditMode ? 'flashcards.add.title_edit'.tr() : 'flashcards.add.title_add'.tr(),
          style: AppTextStyles.titleLarge.copyWith(
            fontWeight: FontWeight.bold,
            color: theme.colorScheme.onSurface,
          ),
        ),
      ),
      body: Form(
        key: _formKey,
        child: SingleChildScrollView(
          padding: EdgeInsets.all(AppDimensions.space20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Front Side
              Text(
                'flashcards.add.label_front'.tr(),
                style: AppTextStyles.labelLarge.copyWith(
                  color: theme.colorScheme.onSurface,
                  fontWeight: FontWeight.w600,
                ),
              ),
              SizedBox(height: AppDimensions.space8),
              TextFormField(
                controller: _frontController,
                decoration: InputDecoration(
                  hintText: 'flashcards.add.hint_front'.tr(),
                  prefixIcon: Icon(Icons.help_outline),
                  filled: true,
                  fillColor: isDark
                      ? AppColors.inputFillDark
                      : AppColors.inputFillLight,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(
                      AppDimensions.radiusMedium,
                    ),
                    borderSide: BorderSide.none,
                  ),
                ),
                maxLines: 3,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'flashcards.add.error_front_required'.tr();
                  }
                  return null;
                },
              ),

              SizedBox(height: AppDimensions.space24),

              // Back Side
              Text(
                'flashcards.add.label_back'.tr(),
                style: AppTextStyles.labelLarge.copyWith(
                  color: theme.colorScheme.onSurface,
                  fontWeight: FontWeight.w600,
                ),
              ),
              SizedBox(height: AppDimensions.space8),
              TextFormField(
                controller: _backController,
                decoration: InputDecoration(
                  hintText: 'flashcards.add.hint_back'.tr(),
                  prefixIcon: Icon(Icons.lightbulb_outline),
                  filled: true,
                  fillColor: isDark
                      ? AppColors.inputFillDark
                      : AppColors.inputFillLight,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(
                      AppDimensions.radiusMedium,
                    ),
                    borderSide: BorderSide.none,
                  ),
                ),
                maxLines: 3,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'flashcards.add.error_back_required'.tr();
                  }
                  return null;
                },
              ),

              SizedBox(height: AppDimensions.space24),

              // Notes (Optional)
              Text(
                'flashcards.add.label_notes'.tr(),
                style: AppTextStyles.labelLarge.copyWith(
                  color: theme.colorScheme.onSurface,
                  fontWeight: FontWeight.w600,
                ),
              ),
              SizedBox(height: AppDimensions.space8),
              TextFormField(
                controller: _notesController,
                decoration: InputDecoration(
                  hintText: 'flashcards.add.hint_notes'.tr(),
                  prefixIcon: Icon(Icons.note_outlined),
                  filled: true,
                  fillColor: isDark
                      ? AppColors.inputFillDark
                      : AppColors.inputFillLight,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(
                      AppDimensions.radiusMedium,
                    ),
                    borderSide: BorderSide.none,
                  ),
                ),
                maxLines: 2,
              ),

              SizedBox(height: AppDimensions.space24),

              // Tags (Optional)
              Text(
                'flashcards.add.label_tags'.tr(),
                style: AppTextStyles.labelLarge.copyWith(
                  color: theme.colorScheme.onSurface,
                  fontWeight: FontWeight.w600,
                ),
              ),
              SizedBox(height: AppDimensions.space8),
              TextFormField(
                controller: _tagsController,
                decoration: InputDecoration(
                  hintText: 'flashcards.add.hint_tags_example'.tr(),
                  prefixIcon: Icon(Icons.label_outline),
                  helperText: 'flashcards.add.helper_tags'.tr(),
                  filled: true,
                  fillColor: isDark
                      ? AppColors.inputFillDark
                      : AppColors.inputFillLight,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(
                      AppDimensions.radiusMedium,
                    ),
                    borderSide: BorderSide.none,
                  ),
                ),
              ),

              SizedBox(height: AppDimensions.space32),

              // Save Button
              PrimaryButton(
                text: _isEditMode ? 'flashcards.add.button_save_changes'.tr() : 'flashcards.add.button_create'.tr(),
                onPressed: _handleSave,
                width: double.infinity,
                gradient: AppColors.greenGradient,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
