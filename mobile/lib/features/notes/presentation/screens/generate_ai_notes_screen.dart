import 'dart:io';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:file_picker/file_picker.dart';
import 'package:image_picker/image_picker.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/widgets/buttons/primary_button.dart';
import '../bloc/notes_bloc.dart';
import '../bloc/notes_event.dart';
import '../bloc/notes_state.dart';

enum SourceType { pdf, youtube, website, audio, handwriting, text }

class SourceOption {
  final SourceType type;
  final String label;
  final String description;
  final IconData icon;
  final Color color;

  const SourceOption({
    required this.type,
    required this.label,
    required this.description,
    required this.icon,
    required this.color,
  });
}

// Note: sourceOptions labels and descriptions are localized dynamically in the UI
const sourceOptions = [
  SourceOption(
    type: SourceType.pdf,
    label: 'notes.source_types.pdf',
    description: 'notes.sourceTypePDFDescription',
    icon: Icons.picture_as_pdf,
    color: Color(0xFFEF4444),
  ),
  SourceOption(
    type: SourceType.youtube,
    label: 'notes.source_types.youtube',
    description: 'notes.sourceTypeYouTubeDescription',
    icon: Icons.video_library,
    color: Color(0xFFEF4444),
  ),
  SourceOption(
    type: SourceType.website,
    label: 'notes.source_types.website',
    description: 'notes.sourceTypeWebsiteDescription',
    icon: Icons.language,
    color: Color(0xFFA855F7),
  ),
  SourceOption(
    type: SourceType.audio,
    label: 'notes.source_types.audio',
    description: 'notes.sourceTypeAudioDescription',
    icon: Icons.mic,
    color: Color(0xFF10B981),
  ),
  SourceOption(
    type: SourceType.handwriting,
    label: 'notes.source_types.handwriting',
    description: 'notes.sourceTypeHandwritingDescription',
    icon: Icons.edit,
    color: Color(0xFF6366F1),
  ),
  SourceOption(
    type: SourceType.text,
    label: 'notes.source_types.text',
    description: 'notes.sourceTypeTextDescription',
    icon: Icons.text_fields,
    color: Color(0xFF64748B),
  ),
];

class GenerateAINotesScreen extends StatefulWidget {
  final String studySetId;
  final String studySetTitle;

  const GenerateAINotesScreen({
    super.key,
    required this.studySetId,
    required this.studySetTitle,
  });

  @override
  State<GenerateAINotesScreen> createState() => _GenerateAINotesScreenState();
}

class _GenerateAINotesScreenState extends State<GenerateAINotesScreen> {
  String _step = 'select'; // 'select', 'input', 'processing', 'preview'
  SourceType? _selectedSource;
  final _urlController = TextEditingController();
  final _textController = TextEditingController();
  final _titleController = TextEditingController();
  File? _selectedFile;
  String? _error;

  // Preview data
  String _extractedContent = '';
  String _aiSummary = '';
  List<String> _suggestedTags = [];

  @override
  void dispose() {
    _urlController.dispose();
    _textController.dispose();
    _titleController.dispose();
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
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            if (_step == 'select') {
              Navigator.pop(context);
            } else {
              setState(() => _step = 'select');
            }
          },
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.auto_awesome, size: 20, color: AppColors.purple),
                const SizedBox(width: 8),
                Text(
                  'notes.generateAITitle'.tr(),
                  style: AppTextStyles.titleMedium.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            Text(
              'notes.generateAISubtitle'.tr(),
              style: AppTextStyles.bodySmall.copyWith(
                color: AppColors.grey600,
                fontSize: 11,
              ),
            ),
          ],
        ),
      ),
      body: BlocListener<NotesBloc, NotesState>(
        listener: (context, state) {
          if (state is AINotesGenerating) {
            setState(() => _step = 'processing');
          } else if (state is AINotesGenerated) {
            // Show preview with the generated note data
            if (state.notes.isNotEmpty) {
              final note = state.notes.first;
              setState(() {
                _titleController.text = note.title;
                _extractedContent = note.content;
                _aiSummary = note.summary ?? '';
                _suggestedTags = note.tags;
                _step = 'preview';
              });
            }
          } else if (state is NoteCreated) {
            Navigator.pop(context);
          } else if (state is NotesError) {
            setState(() {
              _error = state.message;
              _step = 'input';
            });
          }
        },
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: _buildCurrentStep(),
        ),
      ),
    );
  }

  Widget _buildCurrentStep() {
    switch (_step) {
      case 'select':
        return _buildSelectStep();
      case 'input':
        return _buildInputStep();
      case 'processing':
        return _buildProcessingStep();
      case 'preview':
        return _buildPreviewStep();
      default:
        return _buildSelectStep();
    }
  }

  Widget _buildSelectStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (_error != null) ...[
          Container(
            padding: const EdgeInsets.all(12),
            margin: const EdgeInsets.only(bottom: 16),
            decoration: BoxDecoration(
              color: AppColors.error.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: AppColors.error.withOpacity(0.3)),
            ),
            child: Row(
              children: [
                Icon(Icons.error_outline, color: AppColors.error, size: 20),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    _error!,
                    style: AppTextStyles.bodySmall.copyWith(color: AppColors.error),
                  ),
                ),
              ],
            ),
          ),
        ],
        Text(
          'notes.chooseSourceLabel'.tr(),
          style: AppTextStyles.bodyMedium.copyWith(color: AppColors.grey600),
        ),
        const SizedBox(height: 16),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 1.1,
          ),
          itemCount: sourceOptions.length,
          itemBuilder: (context, index) {
            final option = sourceOptions[index];
            return InkWell(
              onTap: () {
                setState(() {
                  _selectedSource = option.type;
                  _step = 'input';
                  _error = null;
                });
              },
              borderRadius: BorderRadius.circular(12),
              child: Container(
                decoration: BoxDecoration(
                  color: Theme.of(context).cardColor,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: Theme.of(context).colorScheme.onSurface.withOpacity(0.1),
                  ),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: option.color.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(
                        option.icon,
                        color: option.color,
                        size: 24,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      option.label.tr(),
                      style: AppTextStyles.bodySmall.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      option.description.tr(),
                      style: AppTextStyles.bodySmall.copyWith(
                        fontSize: 11,
                        color: AppColors.grey600,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _buildInputStep() {
    if (_selectedSource == null) return const SizedBox();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (_selectedSource == SourceType.youtube ||
            _selectedSource == SourceType.website) ...[
          TextField(
            controller: _urlController,
            decoration: InputDecoration(
              labelText: _selectedSource == SourceType.youtube
                  ? 'notes.youtubeUrlLabel'.tr()
                  : 'notes.websiteUrlLabel'.tr(),
              hintText: _selectedSource == SourceType.youtube
                  ? 'notes.youtubeUrlHint'.tr()
                  : 'notes.websiteUrlHint'.tr(),
              prefixIcon: Icon(
                _selectedSource == SourceType.youtube
                    ? Icons.video_library
                    : Icons.language,
              ),
            ),
          ),
        ] else if (_selectedSource == SourceType.text) ...[
          TextField(
            controller: _textController,
            decoration: InputDecoration(
              labelText: 'notes.pasteContentLabel'.tr(),
              hintText: 'notes.pasteContentHint'.tr(),
              alignLabelWithHint: true,
            ),
            maxLines: 12,
          ),
          const SizedBox(height: 8),
          Text(
            'notes.characterCount'.tr(namedArgs: {'count': '${_textController.text.length}'}),
            style: AppTextStyles.bodySmall.copyWith(color: AppColors.grey600),
          ),
        ] else if (_selectedSource == SourceType.pdf ||
            _selectedSource == SourceType.audio ||
            _selectedSource == SourceType.handwriting) ...[
          InkWell(
            onTap: () => _pickFile(),
            child: Container(
              padding: const EdgeInsets.all(32),
              decoration: BoxDecoration(
                border: Border.all(
                  color: AppColors.grey400,
                  width: 2,
                  style: BorderStyle.solid,
                ),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                children: [
                  Icon(
                    Icons.upload_file,
                    size: 48,
                    color: AppColors.grey500,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    _selectedFile != null
                        ? _selectedFile!.path.split('/').last
                        : 'notes.fileUploadPrompt'.tr(),
                    style: AppTextStyles.bodySmall.copyWith(
                      fontWeight: FontWeight.w500,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _getFileTypeHint(),
                    style: AppTextStyles.bodySmall.copyWith(
                      fontSize: 11,
                      color: AppColors.grey600,
                    ),
                  ),
                ],
              ),
            ),
          ),
          if (_selectedFile != null) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.grey100.withOpacity(0.5),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Icon(Icons.check_circle, color: AppColors.success, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _selectedFile!.path.split('/').last,
                      style: AppTextStyles.bodySmall,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  IconButton(
                    onPressed: () => setState(() => _selectedFile = null),
                    icon: const Icon(Icons.close, size: 20),
                  ),
                ],
              ),
            ),
          ],
        ],
        const SizedBox(height: 24),
        PrimaryButton(
          text: 'notes.extractGenerateButton'.tr(),
          icon: Icons.auto_awesome,
          onPressed: _canProceed() ? () => _handleExtract() : null,
          gradient: AppColors.greenGradient,
        ),
      ],
    );
  }

  Widget _buildProcessingStep() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const SizedBox(height: 40),
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: AppColors.primary.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: const Center(
              child: CircularProgressIndicator(),
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'notes.processingTitle'.tr(),
            style: AppTextStyles.titleMedium.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'notes.processingSubtitle'.tr(),
            style: AppTextStyles.bodySmall.copyWith(
              color: AppColors.grey600,
            ),
          ),
          const SizedBox(height: 32),
          ...[
            'notes.processingStep1'.tr(),
            'notes.processingStep2'.tr(),
            'notes.processingStep3'.tr(),
            'notes.processingStep4'.tr(),
          ].map((step) => Padding(
                padding: const EdgeInsets.symmetric(vertical: 8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                    const SizedBox(width: 12),
                    Text(
                      step,
                      style: AppTextStyles.bodySmall,
                    ),
                  ],
                ),
              )),
        ],
      ),
    );
  }

  Widget _buildPreviewStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Success Message
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: AppColors.success.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: AppColors.success.withOpacity(0.3)),
          ),
          child: Row(
            children: [
              Icon(Icons.check_circle, color: AppColors.success, size: 20),
              const SizedBox(width: 8),
              Text(
                'notes.extractionSuccess'.tr(),
                style: AppTextStyles.bodySmall.copyWith(
                  color: AppColors.success,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 20),

        // Title Field
        Text(
          'notes.titleLabel'.tr(),
          style: AppTextStyles.bodyMedium.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: _titleController,
          decoration: InputDecoration(
            hintText: 'notes.titleHint'.tr(),
          ),
        ),

        const SizedBox(height: 20),

        // AI Summary
        if (_aiSummary.isNotEmpty) ...[
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.purple.withOpacity(0.05),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.purple.withOpacity(0.2)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.auto_awesome, size: 16, color: AppColors.purple),
                    const SizedBox(width: 8),
                    Text(
                      'notes.aiSummaryLabel'.tr(),
                      style: AppTextStyles.bodySmall.copyWith(
                        fontWeight: FontWeight.w600,
                        color: AppColors.purple,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  _aiSummary,
                  style: AppTextStyles.bodySmall.copyWith(
                    color: AppColors.grey700,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
        ],

        // Suggested Tags
        if (_suggestedTags.isNotEmpty) ...[
          Text(
            'notes.suggestedTagsLabel'.tr(),
            style: AppTextStyles.bodyMedium.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _suggestedTags.map((tag) {
              return Chip(
                label: Text(
                  tag,
                  style: AppTextStyles.bodySmall.copyWith(fontSize: 11),
                ),
                deleteIcon: const Icon(Icons.close, size: 14),
                onDeleted: () {
                  setState(() {
                    _suggestedTags.remove(tag);
                  });
                },
                backgroundColor: AppColors.primary.withOpacity(0.1),
                side: BorderSide.none,
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              );
            }).toList(),
          ),
          const SizedBox(height: 20),
        ],

        // Content Preview
        Text(
          'notes.contentPreviewLabel'.tr(namedArgs: {'count': '${_extractedContent.length}'}),
          style: AppTextStyles.bodyMedium.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.all(16),
          constraints: const BoxConstraints(maxHeight: 200),
          decoration: BoxDecoration(
            color: Theme.of(context).cardColor,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: Theme.of(context).colorScheme.onSurface.withOpacity(0.1),
            ),
          ),
          child: SingleChildScrollView(
            child: Text(
              _extractedContent.length > 1000
                  ? '${_extractedContent.substring(0, 1000)}...'
                  : _extractedContent,
              style: AppTextStyles.bodySmall.copyWith(
                color: AppColors.grey700,
              ),
            ),
          ),
        ),

        const SizedBox(height: 24),

        // Action Buttons
        Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: () {
                  setState(() {
                    _step = 'select';
                    _error = null;
                    _titleController.clear();
                    _urlController.clear();
                    _textController.clear();
                    _selectedFile = null;
                  });
                },
                child: Text('notes.startOverButton'.tr()),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              flex: 2,
              child: PrimaryButton(
                text: 'notes.saveNoteButton'.tr(),
                icon: Icons.check,
                onPressed: _handleSaveNote,
                gradient: AppColors.greenGradient,
              ),
            ),
          ],
        ),
      ],
    );
  }

  String _getFileTypeHint() {
    switch (_selectedSource) {
      case SourceType.pdf:
        return 'notes.pdfFileTypes'.tr();
      case SourceType.audio:
        return 'notes.audioFileTypes'.tr();
      case SourceType.handwriting:
        return 'notes.imageFileTypes'.tr();
      default:
        return '';
    }
  }

  bool _canProceed() {
    if (_selectedSource == SourceType.youtube ||
        _selectedSource == SourceType.website) {
      return _urlController.text.isNotEmpty;
    } else if (_selectedSource == SourceType.text) {
      return _textController.text.length >= 50;
    } else {
      return _selectedFile != null;
    }
  }

  Future<void> _pickFile() async {
    if (_selectedSource == SourceType.handwriting) {
      final picker = ImagePicker();
      final image = await picker.pickImage(source: ImageSource.gallery);
      if (image != null) {
        setState(() => _selectedFile = File(image.path));
      }
    } else {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: _selectedSource == SourceType.pdf
            ? ['pdf', 'txt', 'md']
            : ['mp3', 'wav', 'm4a', 'ogg', 'flac', 'webm'],
      );
      if (result != null && result.files.single.path != null) {
        setState(() => _selectedFile = File(result.files.single.path!));
      }
    }
  }

  void _handleExtract() {
    // For now, just trigger AI generation with a simple topic
    // In production, you'd send the file/URL to backend
    String topic = '';
    if (_selectedSource == SourceType.text) {
      topic = _textController.text.substring(0, 100);
    } else if (_selectedSource == SourceType.youtube ||
        _selectedSource == SourceType.website) {
      topic = _urlController.text;
    } else if (_selectedFile != null) {
      topic = _selectedFile!.path.split('/').last;
    }

    context.read<NotesBloc>().add(
          GenerateAINotes(
            studySetId: widget.studySetId,
            topic: topic,
          ),
        );
  }

  void _handleSaveNote() {
    context.read<NotesBloc>().add(
          CreateNote(
            studySetId: widget.studySetId,
            title: _titleController.text,
            content: _extractedContent,
            sourceType: 'ai_generated',
            summary: _aiSummary.isNotEmpty ? _aiSummary : null,
            tags: _suggestedTags.isNotEmpty ? _suggestedTags : null,
          ),
        );
  }
}
