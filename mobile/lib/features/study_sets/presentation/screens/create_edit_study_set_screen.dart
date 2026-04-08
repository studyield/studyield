import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:image_picker/image_picker.dart';
import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_dimensions.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/widgets/buttons/primary_button.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../flashcards/presentation/bloc/flashcards_bloc.dart';
import '../../../flashcards/presentation/bloc/flashcards_event.dart';
import '../../../flashcards/presentation/bloc/flashcards_state.dart';
import '../../../flashcards/presentation/widgets/flashcard_editor_widget.dart';
import '../bloc/study_sets_bloc.dart';
import '../bloc/study_sets_event.dart';
import '../bloc/study_sets_state.dart';
import '../../domain/entities/study_set_entity.dart';

class CreateEditStudySetScreen extends StatefulWidget {
  final StudySetEntity? studySet; // null for create, non-null for edit

  const CreateEditStudySetScreen({
    super.key,
    this.studySet,
  });

  @override
  State<CreateEditStudySetScreen> createState() =>
      _CreateEditStudySetScreenState();
}

class _CreateEditStudySetScreenState extends State<CreateEditStudySetScreen> {
  late TextEditingController _titleController;
  late TextEditingController _descriptionController;
  late TextEditingController _tagController;
  late TextEditingController _examSubjectController;
  late bool _isPublic;

  File? _selectedImage;
  String? _uploadedImageUrl;
  bool _isUploading = false;
  DateTime? _selectedExamDate;

  bool _showMoreOptions = false;
  List<String> _tags = [];
  bool _isSaving = false;
  String? _errorMessage;

  // Draft flashcards from editor
  List<FlashcardData> _draftCards = [];

  bool get _isEditMode => widget.studySet != null;

  @override
  void initState() {
    super.initState();
    _titleController = TextEditingController(
      text: widget.studySet?.title ?? '',
    );
    _descriptionController = TextEditingController(
      text: widget.studySet?.description ?? '',
    );
    _tagController = TextEditingController();
    _examSubjectController = TextEditingController(
      text: widget.studySet?.examSubject ?? '',
    );
    _isPublic = widget.studySet?.isPublic ?? false;
    _uploadedImageUrl = widget.studySet?.coverImageUrl;
    _selectedExamDate = widget.studySet?.examDate;
    _tags = List<String>.from(widget.studySet?.tags ?? []);

    // Auto-expand "More Options" in edit mode if extras exist
    if (_isEditMode) {
      _showMoreOptions = _uploadedImageUrl != null ||
          _tags.isNotEmpty ||
          _selectedExamDate != null ||
          (_examSubjectController.text.isNotEmpty);
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _tagController.dispose();
    _examSubjectController.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    try {
      final ImagePicker picker = ImagePicker();
      final XFile? image = await picker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 1200,
        maxHeight: 1200,
        imageQuality: 85,
      );

      if (image != null) {
        setState(() {
          _selectedImage = File(image.path);
        });
        await _uploadImage();
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('study_sets.create_edit.upload_failed'.tr()),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  Future<void> _uploadImage() async {
    if (_selectedImage == null) return;

    setState(() {
      _isUploading = true;
    });

    try {
      final apiClient = ApiClient.instance;
      final response = await apiClient.uploadFile(
        ApiConstants.uploadImage,
        filePath: _selectedImage!.path,
        fieldName: 'file',
      );

      if (!mounted) return;
      setState(() {
        _uploadedImageUrl = response.data['url'] as String;
        _isUploading = false;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('study_sets.create_edit.image_uploaded'.tr()),
          backgroundColor: AppColors.success,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isUploading = false;
        _selectedImage = null;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('study_sets.create_edit.upload_failed'.tr()),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  Future<void> _pickExamDate() async {
    final DateTime now = DateTime.now();
    final DateTime? pickedDate = await showDatePicker(
      context: context,
      initialDate: _selectedExamDate ?? now,
      firstDate: now,
      lastDate: now.add(Duration(days: 365 * 2)),
      builder: (context, child) {
        final theme = Theme.of(context);
        return Theme(
          data: theme.copyWith(
            colorScheme: theme.colorScheme.copyWith(
              primary: AppColors.primary,
            ),
          ),
          child: child!,
        );
      },
    );

    if (pickedDate != null && mounted) {
      final TimeOfDay? pickedTime = await showTimePicker(
        context: context,
        initialTime: _selectedExamDate != null
            ? TimeOfDay.fromDateTime(_selectedExamDate!)
            : TimeOfDay.now(),
        builder: (context, child) {
          final theme = Theme.of(context);
          return Theme(
            data: theme.copyWith(
              colorScheme: theme.colorScheme.copyWith(
                primary: AppColors.primary,
              ),
            ),
            child: child!,
          );
        },
      );

      if (pickedTime != null) {
        setState(() {
          _selectedExamDate = DateTime(
            pickedDate.year,
            pickedDate.month,
            pickedDate.day,
            pickedTime.hour,
            pickedTime.minute,
          );
        });
      }
    }
  }

  void _addTag() {
    final tag = _tagController.text.trim();
    if (tag.isNotEmpty && !_tags.contains(tag)) {
      setState(() {
        _tags.add(tag);
        _tagController.clear();
      });
    }
  }

  void _removeTag(String tag) {
    setState(() {
      _tags.remove(tag);
    });
  }

  void _handleSave() {
    if (_titleController.text.trim().isEmpty) {
      setState(() {
        _errorMessage = 'study_sets.create_edit.title_required'.tr();
      });
      return;
    }

    setState(() {
      _errorMessage = null;
      _isSaving = true;
    });

    final tags = _tags.isEmpty ? null : _tags;
    final examSubject = _examSubjectController.text.isEmpty
        ? null
        : _examSubjectController.text;

    if (_isEditMode && widget.studySet != null) {
      context.read<StudySetsBloc>().add(
            UpdateStudySet(
              id: widget.studySet!.id,
              title: _titleController.text,
              description: _descriptionController.text.isEmpty
                  ? null
                  : _descriptionController.text,
              isPublic: _isPublic,
              tags: tags,
              coverImageUrl: _uploadedImageUrl,
              examDate: _selectedExamDate,
              examSubject: examSubject,
            ),
          );
    } else {
      context.read<StudySetsBloc>().add(
            CreateStudySet(
              title: _titleController.text,
              description: _descriptionController.text.isEmpty
                  ? null
                  : _descriptionController.text,
              isPublic: _isPublic,
              tags: tags,
              coverImageUrl: _uploadedImageUrl,
              examDate: _selectedExamDate,
              examSubject: examSubject,
            ),
          );
    }
  }

  void _handleDraftCardsChanged(List<FlashcardData> cards) {
    setState(() {
      _draftCards = cards;
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final borderColor = isDark ? AppColors.borderDark : AppColors.borderLight;
    final cardBg = isDark ? AppColors.cardDark : AppColors.cardLight;

    SystemChrome.setSystemUIOverlayStyle(
      SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: isDark ? Brightness.light : Brightness.dark,
        statusBarBrightness: isDark ? Brightness.dark : Brightness.light,
      ),
    );

    return MultiBlocListener(
      listeners: [
        BlocListener<StudySetsBloc, StudySetsState>(
          listener: (context, state) {
            if (state is StudySetCreating) {
              setState(() {
                _isSaving = true;
                _errorMessage = null;
              });
            } else if (state is StudySetCreated) {
              // If we have draft cards, bulk create them
              if (_draftCards.isNotEmpty) {
                context.read<FlashcardsBloc>().add(
                      BulkCreateFlashcards(
                        studySetId: state.studySet.id,
                        flashcards: _draftCards,
                      ),
                    );
                // Don't pop yet — wait for BulkCreated
              } else {
                if (!mounted) return;
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('study_sets.messages.created'.tr()),
                    backgroundColor: AppColors.success,
                  ),
                );
              }
            } else if (state is StudySetUpdated) {
              if (!mounted) return;
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('study_sets.messages.updated'.tr()),
                  backgroundColor: AppColors.success,
                ),
              );
            } else if (state is StudySetsError) {
              setState(() {
                _isSaving = false;
                _errorMessage = state.message;
              });
            }
          },
        ),
        BlocListener<FlashcardsBloc, FlashcardsState>(
          listener: (context, state) {
            if (state is FlashcardsBulkCreated) {
              if (!mounted) return;
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('study_sets.messages.created'.tr()),
                  backgroundColor: AppColors.success,
                ),
              );
            } else if (state is FlashcardsError) {
              // Study set was created but cards failed — still pop
              if (_isSaving) {
                if (!mounted) return;
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('study_sets.create_edit.cards_failed'.tr()),
                    backgroundColor: AppColors.warning,
                  ),
                );
              }
            }
          },
        ),
      ],
      child: Scaffold(
        body: Column(
          children: [
            // Safe area + custom header
            _buildHeader(theme, isDark),

            // Scrollable middle
            Expanded(
              child: SingleChildScrollView(
                padding: EdgeInsets.all(AppDimensions.space20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Error banner
                    if (_errorMessage != null) _buildErrorBanner(),

                    // Metadata card
                    _buildMetadataCard(theme, isDark, borderColor, cardBg),

                    // Flashcard Editor (create mode only)
                    if (!_isEditMode) ...[
                      SizedBox(height: AppDimensions.space20),
                      _buildFlashcardEditorSection(theme, isDark, borderColor, cardBg),
                    ],

                    // Delete button (edit mode only)
                    if (_isEditMode) ...[
                      SizedBox(height: AppDimensions.space20),
                      _buildDeleteButton(),
                    ],

                    SizedBox(height: AppDimensions.space24),
                  ],
                ),
              ),
            ),

            // Sticky bottom bar
            _buildBottomBar(theme, isDark, borderColor),
          ],
        ),
      ),
    );
  }

  // ─── Header ──────────────────────────────────────────────────────────
  Widget _buildHeader(ThemeData theme, bool isDark) {
    return Container(
      color: theme.scaffoldBackgroundColor,
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: EdgeInsets.symmetric(
            horizontal: AppDimensions.space16,
            vertical: AppDimensions.space12,
          ),
          child: Row(
            children: [
              InkWell(
                onTap: () => Navigator.of(context).pop(),
                borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
                child: Padding(
                  padding: EdgeInsets.all(AppDimensions.space8),
                  child: Icon(
                    Icons.arrow_back,
                    size: 20,
                    color: theme.colorScheme.onSurface,
                  ),
                ),
              ),
              SizedBox(width: AppDimensions.space12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _isEditMode
                          ? 'study_sets.create_edit.title_edit'.tr()
                          : 'study_sets.create_edit.title_create'.tr(),
                      style: AppTextStyles.titleLarge.copyWith(
                        fontWeight: FontWeight.bold,
                        color: theme.colorScheme.onSurface,
                      ),
                    ),
                    SizedBox(height: 2),
                    Text(
                      'study_sets.create_edit.subtitle'.tr(),
                      style: AppTextStyles.bodySmall.copyWith(
                        color: isDark
                            ? AppColors.textSecondaryDark
                            : AppColors.textSecondaryLight,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ─── Error Banner ────────────────────────────────────────────────────
  Widget _buildErrorBanner() {
    return Container(
      margin: EdgeInsets.only(bottom: AppDimensions.space16),
      padding: EdgeInsets.all(AppDimensions.space16),
      decoration: BoxDecoration(
        color: AppColors.error.withValues(alpha: 0.1),
        border: Border.all(color: AppColors.error.withValues(alpha: 0.2)),
        borderRadius: BorderRadius.circular(AppDimensions.radiusLarge),
      ),
      child: Row(
        children: [
          Icon(Icons.error_outline, color: AppColors.error, size: 20),
          SizedBox(width: AppDimensions.space8),
          Expanded(
            child: Text(
              _errorMessage!,
              style: AppTextStyles.bodySmall.copyWith(color: AppColors.error),
            ),
          ),
          InkWell(
            onTap: () => setState(() => _errorMessage = null),
            child: Icon(Icons.close, color: AppColors.error, size: 18),
          ),
        ],
      ),
    );
  }

  // ─── Metadata Card ───────────────────────────────────────────────────
  Widget _buildMetadataCard(
    ThemeData theme,
    bool isDark,
    Color borderColor,
    Color cardBg,
  ) {
    return Container(
      padding: EdgeInsets.all(AppDimensions.space24),
      decoration: BoxDecoration(
        color: cardBg,
        border: Border.all(color: borderColor),
        borderRadius: BorderRadius.circular(AppDimensions.radiusXLarge),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Title input — underline style
          _buildTitleInput(theme, isDark, borderColor),
          SizedBox(height: AppDimensions.space16),

          // Description input — thinner underline
          _buildDescriptionInput(theme, isDark, borderColor),
          SizedBox(height: AppDimensions.space16),

          // "More Options" toggle
          _buildMoreOptionsToggle(theme, isDark),

          // Collapsible section
          AnimatedSize(
            duration: Duration(milliseconds: 200),
            curve: Curves.easeInOut,
            alignment: Alignment.topCenter,
            child: _showMoreOptions
                ? _buildExpandedOptions(theme, isDark, borderColor)
                : SizedBox.shrink(),
          ),
        ],
      ),
    );
  }

  // ─── Title Input ─────────────────────────────────────────────────────
  Widget _buildTitleInput(ThemeData theme, bool isDark, Color borderColor) {
    return TextField(
      controller: _titleController,
      autofocus: !_isEditMode,
      style: TextStyle(
        fontSize: 20,
        fontWeight: FontWeight.w600,
        color: theme.colorScheme.onSurface,
      ),
      decoration: InputDecoration(
        hintText: 'study_sets.create_edit.title_placeholder'.tr(),
        hintStyle: TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: (isDark
                  ? AppColors.textSecondaryDark
                  : AppColors.textSecondaryLight)
              .withValues(alpha: 0.5),
        ),
        contentPadding: EdgeInsets.symmetric(vertical: AppDimensions.space8),
        border: InputBorder.none,
        enabledBorder: UnderlineInputBorder(
          borderSide: BorderSide(color: borderColor, width: 2),
        ),
        focusedBorder: UnderlineInputBorder(
          borderSide: BorderSide(color: AppColors.primary, width: 2),
        ),
      ),
      onChanged: (_) {
        if (_errorMessage != null) {
          setState(() => _errorMessage = null);
        }
        setState(() {}); // Rebuild to update bottom bar disabled state
      },
    );
  }

  // ─── Description Input ───────────────────────────────────────────────
  Widget _buildDescriptionInput(
      ThemeData theme, bool isDark, Color borderColor) {
    return TextField(
      controller: _descriptionController,
      maxLines: 2,
      style: TextStyle(
        fontSize: 14,
        color: theme.colorScheme.onSurface,
      ),
      decoration: InputDecoration(
        hintText: 'study_sets.create_edit.description_placeholder'.tr(),
        hintStyle: TextStyle(
          fontSize: 14,
          color: (isDark
                  ? AppColors.textSecondaryDark
                  : AppColors.textSecondaryLight)
              .withValues(alpha: 0.4),
        ),
        contentPadding: EdgeInsets.symmetric(vertical: 6),
        border: InputBorder.none,
        enabledBorder: UnderlineInputBorder(
          borderSide: BorderSide(
            color: borderColor.withValues(alpha: 0.5),
            width: 1,
          ),
        ),
        focusedBorder: UnderlineInputBorder(
          borderSide: BorderSide(
            color: AppColors.primary.withValues(alpha: 0.5),
            width: 1,
          ),
        ),
      ),
    );
  }

  // ─── More Options Toggle ─────────────────────────────────────────────
  Widget _buildMoreOptionsToggle(ThemeData theme, bool isDark) {
    return InkWell(
      onTap: () => setState(() => _showMoreOptions = !_showMoreOptions),
      borderRadius: BorderRadius.circular(AppDimensions.radiusSmall),
      child: Padding(
        padding: EdgeInsets.symmetric(vertical: AppDimensions.space4),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            AnimatedRotation(
              turns: _showMoreOptions ? 0.5 : 0,
              duration: Duration(milliseconds: 200),
              child: Icon(
                Icons.keyboard_arrow_down,
                size: 18,
                color: isDark
                    ? AppColors.textSecondaryDark
                    : AppColors.textSecondaryLight,
              ),
            ),
            SizedBox(width: 6),
            Text(
              _showMoreOptions
                  ? 'study_sets.create_edit.less_options'.tr()
                  : 'study_sets.create_edit.more_options'.tr(),
              style: AppTextStyles.bodySmall.copyWith(
                color: isDark
                    ? AppColors.textSecondaryDark
                    : AppColors.textSecondaryLight,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ─── Expanded Options ────────────────────────────────────────────────
  Widget _buildExpandedOptions(
      ThemeData theme, bool isDark, Color borderColor) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(height: AppDimensions.space16),
        Divider(color: borderColor.withValues(alpha: 0.5), thickness: 1),
        SizedBox(height: AppDimensions.space16),

        // Cover Image
        _buildCoverImageSection(theme, isDark, borderColor),
        SizedBox(height: AppDimensions.space20),

        // Tags
        _buildTagsSection(theme, isDark, borderColor),
        SizedBox(height: AppDimensions.space20),

        // Exam Date
        _buildExamDateSection(theme, isDark, borderColor),

        // Exam Subject (conditional)
        if (_selectedExamDate != null) ...[
          SizedBox(height: AppDimensions.space20),
          _buildExamSubjectSection(theme, isDark, borderColor),
        ],

        SizedBox(height: AppDimensions.space20),

        // Visibility toggles
        _buildVisibilitySection(theme, isDark, borderColor),
      ],
    );
  }

  // ─── Cover Image ─────────────────────────────────────────────────────
  Widget _buildCoverImageSection(
      ThemeData theme, bool isDark, Color borderColor) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'study_sets.create_edit.cover_image'.tr(),
          style: AppTextStyles.labelLarge.copyWith(
            color: theme.colorScheme.onSurface,
          ),
        ),
        SizedBox(height: AppDimensions.space8),
        GestureDetector(
          onTap: _pickImage,
          child: Container(
            height: 140,
            width: double.infinity,
            decoration: BoxDecoration(
              color:
                  isDark ? AppColors.inputFillDark : AppColors.inputFillLight,
              borderRadius: BorderRadius.circular(AppDimensions.radiusLarge),
              border: Border.all(color: borderColor),
            ),
            child: _isUploading
                ? Center(
                    child:
                        CircularProgressIndicator(color: AppColors.primary))
                : _selectedImage != null
                    ? ClipRRect(
                        borderRadius: BorderRadius.circular(
                            AppDimensions.radiusLarge),
                        child: Image.file(_selectedImage!,
                            fit: BoxFit.cover, width: double.infinity),
                      )
                    : _uploadedImageUrl != null
                        ? ClipRRect(
                            borderRadius: BorderRadius.circular(
                                AppDimensions.radiusLarge),
                            child: Image.network(_uploadedImageUrl!,
                                fit: BoxFit.cover, width: double.infinity),
                          )
                        : Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.add_photo_alternate_outlined,
                                  size: 40, color: AppColors.grey500),
                              SizedBox(height: 6),
                              Text(
                                'study_sets.create_edit.tap_add_cover'.tr(),
                                style: AppTextStyles.bodySmall
                                    .copyWith(color: AppColors.grey600),
                              ),
                            ],
                          ),
          ),
        ),
      ],
    );
  }

  // ─── Tags ────────────────────────────────────────────────────────────
  Widget _buildTagsSection(ThemeData theme, bool isDark, Color borderColor) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'study_sets.create_edit.tags_label'.tr(),
          style: AppTextStyles.labelLarge.copyWith(
            color: theme.colorScheme.onSurface,
          ),
        ),
        SizedBox(height: AppDimensions.space8),
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: _tagController,
                style: AppTextStyles.bodyMedium.copyWith(
                  color: theme.colorScheme.onSurface,
                ),
                decoration: InputDecoration(
                  hintText: 'study_sets.create_edit.add_tag'.tr(),
                  hintStyle: AppTextStyles.bodyMedium
                      .copyWith(color: AppColors.grey500),
                  contentPadding: EdgeInsets.symmetric(
                    horizontal: AppDimensions.space12,
                    vertical: AppDimensions.space8,
                  ),
                  border: OutlineInputBorder(
                    borderRadius:
                        BorderRadius.circular(AppDimensions.radiusMedium),
                    borderSide: BorderSide(color: borderColor),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius:
                        BorderRadius.circular(AppDimensions.radiusMedium),
                    borderSide: BorderSide(color: borderColor),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius:
                        BorderRadius.circular(AppDimensions.radiusMedium),
                    borderSide: BorderSide(color: AppColors.primary),
                  ),
                  isDense: true,
                ),
                onSubmitted: (_) => _addTag(),
              ),
            ),
            SizedBox(width: AppDimensions.space8),
            SizedBox(
              height: 40,
              width: 40,
              child: IconButton(
                onPressed:
                    _tagController.text.trim().isNotEmpty ? _addTag : null,
                icon: Icon(Icons.add, size: 20),
                color: AppColors.primary,
                style: IconButton.styleFrom(
                  side: BorderSide(color: borderColor),
                  shape: RoundedRectangleBorder(
                    borderRadius:
                        BorderRadius.circular(AppDimensions.radiusMedium),
                  ),
                ),
              ),
            ),
          ],
        ),
        if (_tags.isNotEmpty) ...[
          SizedBox(height: AppDimensions.space8),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: _tags.map((tag) => _buildTagChip(tag, isDark)).toList(),
          ),
        ],
      ],
    );
  }

  Widget _buildTagChip(String tag, bool isDark) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.primary.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(AppDimensions.radiusRound),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            tag,
            style: AppTextStyles.bodySmall.copyWith(
              color: isDark ? AppColors.primaryLight : AppColors.primaryDark,
              fontWeight: FontWeight.w500,
            ),
          ),
          SizedBox(width: 4),
          InkWell(
            onTap: () => _removeTag(tag),
            borderRadius: BorderRadius.circular(AppDimensions.radiusRound),
            child: Padding(
              padding: EdgeInsets.all(2),
              child: Icon(
                Icons.close,
                size: 14,
                color:
                    isDark ? AppColors.primaryLight : AppColors.primaryDark,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ─── Exam Date ───────────────────────────────────────────────────────
  Widget _buildExamDateSection(
      ThemeData theme, bool isDark, Color borderColor) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'study_sets.create_edit.exam_date_label'.tr(),
          style: AppTextStyles.labelLarge.copyWith(
            color: theme.colorScheme.onSurface,
          ),
        ),
        SizedBox(height: AppDimensions.space8),
        InkWell(
          onTap: _pickExamDate,
          borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
          child: Container(
            padding: EdgeInsets.symmetric(
              horizontal: AppDimensions.space12,
              vertical: AppDimensions.space12,
            ),
            decoration: BoxDecoration(
              border: Border.all(color: borderColor),
              borderRadius:
                  BorderRadius.circular(AppDimensions.radiusMedium),
            ),
            child: Row(
              children: [
                Icon(Icons.calendar_today, size: 16, color: AppColors.grey500),
                SizedBox(width: AppDimensions.space8),
                Expanded(
                  child: Text(
                    _selectedExamDate != null
                        ? '${_selectedExamDate!.year}-${_selectedExamDate!.month.toString().padLeft(2, '0')}-${_selectedExamDate!.day.toString().padLeft(2, '0')} ${_selectedExamDate!.hour.toString().padLeft(2, '0')}:${_selectedExamDate!.minute.toString().padLeft(2, '0')}'
                        : 'study_sets.create_edit.exam_date_hint'.tr(),
                    style: AppTextStyles.bodyMedium.copyWith(
                      color: _selectedExamDate != null
                          ? theme.colorScheme.onSurface
                          : AppColors.grey500,
                    ),
                  ),
                ),
                if (_selectedExamDate != null)
                  InkWell(
                    onTap: () {
                      setState(() {
                        _selectedExamDate = null;
                        _examSubjectController.clear();
                      });
                    },
                    child: Icon(Icons.close, size: 18, color: AppColors.grey500),
                  ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  // ─── Exam Subject ────────────────────────────────────────────────────
  Widget _buildExamSubjectSection(
      ThemeData theme, bool isDark, Color borderColor) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'study_sets.create_edit.exam_subject_label'.tr(),
          style: AppTextStyles.labelLarge.copyWith(
            color: theme.colorScheme.onSurface,
          ),
        ),
        SizedBox(height: AppDimensions.space8),
        TextField(
          controller: _examSubjectController,
          style: AppTextStyles.bodyMedium.copyWith(
            color: theme.colorScheme.onSurface,
          ),
          decoration: InputDecoration(
            hintText: 'study_sets.create_edit.exam_subject_hint'.tr(),
            hintStyle:
                AppTextStyles.bodyMedium.copyWith(color: AppColors.grey500),
            prefixIcon:
                Icon(Icons.book_outlined, size: 18, color: AppColors.grey500),
            contentPadding: EdgeInsets.symmetric(
              horizontal: AppDimensions.space12,
              vertical: AppDimensions.space8,
            ),
            border: OutlineInputBorder(
              borderRadius:
                  BorderRadius.circular(AppDimensions.radiusMedium),
              borderSide: BorderSide(color: borderColor),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius:
                  BorderRadius.circular(AppDimensions.radiusMedium),
              borderSide: BorderSide(color: borderColor),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius:
                  BorderRadius.circular(AppDimensions.radiusMedium),
              borderSide: BorderSide(color: AppColors.primary),
            ),
            isDense: true,
          ),
        ),
      ],
    );
  }

  // ─── Visibility Toggles ──────────────────────────────────────────────
  Widget _buildVisibilitySection(
      ThemeData theme, bool isDark, Color borderColor) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'study_sets.create_edit.visibility_label'.tr(),
          style: AppTextStyles.labelLarge.copyWith(
            color: theme.colorScheme.onSurface,
          ),
        ),
        SizedBox(height: AppDimensions.space8),
        Row(
          children: [
            Expanded(
              child: _buildVisibilityButton(
                icon: Icons.lock_outline,
                label: 'study_sets.create_edit.private'.tr(),
                isActive: !_isPublic,
                onTap: () => setState(() => _isPublic = false),
                isDark: isDark,
                borderColor: borderColor,
              ),
            ),
            SizedBox(width: AppDimensions.space8),
            Expanded(
              child: _buildVisibilityButton(
                icon: Icons.public,
                label: 'study_sets.create_edit.public'.tr(),
                isActive: _isPublic,
                onTap: () => setState(() => _isPublic = true),
                isDark: isDark,
                borderColor: borderColor,
              ),
            ),
          ],
        ),
        SizedBox(height: AppDimensions.space8),
        Text(
          _isPublic
              ? 'study_sets.create_edit.visibility_public_desc'.tr()
              : 'study_sets.create_edit.visibility_private_desc'.tr(),
          style: AppTextStyles.bodySmall.copyWith(
            color: isDark
                ? AppColors.textSecondaryDark
                : AppColors.textSecondaryLight,
          ),
        ),
      ],
    );
  }

  Widget _buildVisibilityButton({
    required IconData icon,
    required String label,
    required bool isActive,
    required VoidCallback onTap,
    required bool isDark,
    required Color borderColor,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
      child: Container(
        padding: EdgeInsets.symmetric(vertical: AppDimensions.space12),
        decoration: BoxDecoration(
          color: isActive
              ? AppColors.primary.withValues(alpha: 0.1)
              : Colors.transparent,
          border: Border.all(
            color: isActive ? AppColors.primary : borderColor,
          ),
          borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 16,
              color: isActive
                  ? (isDark ? AppColors.primaryLight : AppColors.primaryDark)
                  : (isDark
                      ? AppColors.textSecondaryDark
                      : AppColors.textSecondaryLight),
            ),
            SizedBox(width: 6),
            Text(
              label,
              style: AppTextStyles.labelLarge.copyWith(
                color: isActive
                    ? (isDark
                        ? AppColors.primaryLight
                        : AppColors.primaryDark)
                    : (isDark
                        ? AppColors.textSecondaryDark
                        : AppColors.textSecondaryLight),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ─── Flashcard Editor Section (create mode only) ─────────────────────
  Widget _buildFlashcardEditorSection(
    ThemeData theme,
    bool isDark,
    Color borderColor,
    Color cardBg,
  ) {
    return Container(
      height: 550,
      decoration: BoxDecoration(
        color: cardBg,
        border: Border.all(color: borderColor),
        borderRadius: BorderRadius.circular(AppDimensions.radiusXLarge),
      ),
      clipBehavior: Clip.antiAlias,
      child: FlashcardEditorWidget(
        onFlashcardsAdded: _handleDraftCardsChanged,
      ),
    );
  }

  // ─── Delete Button ───────────────────────────────────────────────────
  Widget _buildDeleteButton() {
    return OutlinedButton.icon(
      onPressed: () => _showDeleteConfirmation(context),
      icon: Icon(Icons.delete_outline, color: AppColors.error),
      label: Text(
        'study_sets.create_edit.delete_study_set'.tr(),
        style: TextStyle(color: AppColors.error),
      ),
      style: OutlinedButton.styleFrom(
        side: BorderSide(color: AppColors.error),
        minimumSize: Size(double.infinity, 48),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
        ),
      ),
    );
  }

  // ─── Sticky Bottom Bar ───────────────────────────────────────────────
  Widget _buildBottomBar(ThemeData theme, bool isDark, Color borderColor) {
    return Container(
      decoration: BoxDecoration(
        color: theme.scaffoldBackgroundColor,
        border: Border(
          top: BorderSide(color: borderColor, width: 1),
        ),
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: EdgeInsets.symmetric(
            horizontal: AppDimensions.space20,
            vertical: AppDimensions.space12,
          ),
          child: Row(
            children: [
              OutlinedButton(
                onPressed: _isSaving ? null : () => Navigator.pop(context),
                style: OutlinedButton.styleFrom(
                  side: BorderSide(color: borderColor),
                  shape: RoundedRectangleBorder(
                    borderRadius:
                        BorderRadius.circular(AppDimensions.radiusMedium),
                  ),
                  padding: EdgeInsets.symmetric(
                    horizontal: AppDimensions.space20,
                    vertical: AppDimensions.space12,
                  ),
                ),
                child: Text(
                  'study_sets.create_edit.cancel'.tr(),
                  style: AppTextStyles.button.copyWith(
                    color: theme.colorScheme.onSurface,
                  ),
                ),
              ),
              // Card count info
              if (!_isEditMode && _draftCards.isNotEmpty) ...[
                SizedBox(width: AppDimensions.space12),
                Expanded(
                  child: Text(
                    'study_sets.create_edit.cards_ready_count'.tr(
                      namedArgs: {'count': _draftCards.length.toString()},
                    ),
                    style: AppTextStyles.bodySmall.copyWith(
                      color: isDark
                          ? AppColors.textSecondaryDark
                          : AppColors.textSecondaryLight,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ] else ...[
                Spacer(),
              ],
              SizedBox(width: AppDimensions.space12),
              PrimaryButton(
                text: _isEditMode
                    ? 'study_sets.create_edit.save_changes'.tr()
                    : _draftCards.isNotEmpty
                        ? 'study_sets.create_edit.create_with_cards'.tr(
                            namedArgs: {'count': _draftCards.length.toString()},
                          )
                        : 'study_sets.create_edit.create_button'.tr(),
                onPressed: _handleSave,
                isLoading: _isSaving,
                isDisabled:
                    _titleController.text.trim().isEmpty || _isSaving,
                gradient: AppColors.greenGradient,
                icon: _isSaving ? null : Icons.check,
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ─── Delete Confirmation ─────────────────────────────────────────────
  void _showDeleteConfirmation(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('study_sets.create_edit.delete_confirm_title'.tr()),
        content: Text(
          'study_sets.create_edit.delete_confirm_message'.tr(
            namedArgs: {'title': widget.studySet?.title ?? ''},
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('study_sets.create_edit.cancel'.tr()),
          ),
          TextButton(
            onPressed: () {
              if (widget.studySet != null) {
                context.read<StudySetsBloc>().add(
                      DeleteStudySet(id: widget.studySet!.id),
                    );
              }
              Navigator.pop(context); // Close dialog
              Navigator.pop(context); // Close edit screen
              Navigator.pop(context); // Close detail screen
            },
            child: Text(
              'study_sets.detail.delete_confirm_delete'.tr(),
              style: TextStyle(color: AppColors.error),
            ),
          ),
        ],
      ),
    );
  }
}
